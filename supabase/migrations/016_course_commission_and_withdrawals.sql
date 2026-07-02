-- ═══════════════════════════════════════════════════════════════
-- VOA — Migration 016: Teacher lesson commission + withdrawal system
-- Run this in: Supabase Dashboard → SQL Editor
--
-- Model: platform holds the payment (same manual EcoCash-verification
-- flow as subscriptions), takes a commission (default 20%, configurable
-- via platform_settings.commission_rate_pct), and credits the teacher's
-- earning ledger with the rest. Teachers request a withdrawal; an admin
-- manually sends the money (EcoCash/bank) and marks it paid — there is
-- no automated payout API (Zimbabwe has no Stripe-Connect equivalent
-- readily available, and the whole payment_verifications flow is
-- already manual-verification-based, so this matches existing
-- architecture rather than introducing a new payment gateway).
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Link a payment_verifications row to the course it paid for ─

ALTER TABLE public.payment_verifications
  ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_payment_verifications_course_id ON public.payment_verifications(course_id);

-- ── 2. Course purchases — one row per completed sale ──────────────

CREATE TABLE IF NOT EXISTS public.course_purchases (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id              UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  teacher_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  payment_verification_id UUID REFERENCES public.payment_verifications(id) ON DELETE SET NULL,
  amount_paid            NUMERIC(10,2) NOT NULL,
  platform_fee_pct       NUMERIC(5,2) NOT NULL,
  platform_fee_amount    NUMERIC(10,2) NOT NULL,
  teacher_earning_amount NUMERIC(10,2) NOT NULL,
  status                 TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'refunded')),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, course_id)
);

ALTER TABLE public.course_purchases ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.course_purchases TO authenticated;
GRANT ALL ON public.course_purchases TO service_role;

DROP POLICY IF EXISTS "Student sees own purchases" ON public.course_purchases;
CREATE POLICY "Student sees own purchases" ON public.course_purchases
  FOR SELECT USING (student_id = public.get_my_profile_id());

DROP POLICY IF EXISTS "Teacher sees own sales" ON public.course_purchases;
CREATE POLICY "Teacher sees own sales" ON public.course_purchases
  FOR SELECT USING (teacher_id = public.get_my_profile_id());

DROP POLICY IF EXISTS "Super admin all course purchases" ON public.course_purchases;
CREATE POLICY "Super admin all course purchases" ON public.course_purchases
  FOR SELECT USING (public.is_super_admin());

CREATE INDEX IF NOT EXISTS idx_course_purchases_student_id ON public.course_purchases(student_id);
CREATE INDEX IF NOT EXISTS idx_course_purchases_course_id ON public.course_purchases(course_id);
CREATE INDEX IF NOT EXISTS idx_course_purchases_teacher_id ON public.course_purchases(teacher_id);

-- ── 3. Teacher withdrawal requests ─────────────────────────────────

CREATE TABLE IF NOT EXISTS public.teacher_withdrawal_requests (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount         NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  payout_method  TEXT NOT NULL DEFAULT 'ecocash',
  payout_phone   TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','paid','rejected')),
  rejection_reason TEXT,
  notes          TEXT,
  requested_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at   TIMESTAMPTZ,
  processed_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE public.teacher_withdrawal_requests ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.teacher_withdrawal_requests TO authenticated;
GRANT ALL ON public.teacher_withdrawal_requests TO service_role;

DROP POLICY IF EXISTS "Teacher sees own withdrawal requests" ON public.teacher_withdrawal_requests;
CREATE POLICY "Teacher sees own withdrawal requests" ON public.teacher_withdrawal_requests
  FOR SELECT USING (teacher_id = public.get_my_profile_id());

DROP POLICY IF EXISTS "Super admin all withdrawal requests" ON public.teacher_withdrawal_requests;
CREATE POLICY "Super admin all withdrawal requests" ON public.teacher_withdrawal_requests
  FOR SELECT USING (public.is_super_admin());

CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_teacher_id ON public.teacher_withdrawal_requests(teacher_id);

-- ── 4. Commission rate setting ──────────────────────────────────

INSERT INTO public.platform_settings (key, value)
VALUES ('commission_rate_pct', '20')
ON CONFLICT (key) DO NOTHING;

-- ── 5. Trigger: when a 'course' payment_verifications row is marked
-- verified, compute the split and record the sale automatically —
-- this piggybacks on the existing admin approve button in
-- PaymentsClient.tsx with no changes needed there.

CREATE OR REPLACE FUNCTION public.activate_course_purchase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_course RECORD;
  v_fee_pct NUMERIC(5,2);
  v_fee_amount NUMERIC(10,2);
  v_teacher_amount NUMERIC(10,2);
BEGIN
  IF NEW.purchase_type <> 'course' OR NEW.course_id IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.status <> 'approved' OR OLD.status = 'approved' THEN
    RETURN NEW;
  END IF;

  SELECT id, created_by, price INTO v_course FROM public.courses WHERE id = NEW.course_id;
  IF v_course IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE((value #>> '{}')::NUMERIC, 20) INTO v_fee_pct
  FROM public.platform_settings WHERE key = 'commission_rate_pct';
  v_fee_pct := COALESCE(v_fee_pct, 20);

  v_fee_amount := ROUND(NEW.amount * v_fee_pct / 100, 2);
  v_teacher_amount := NEW.amount - v_fee_amount;

  INSERT INTO public.course_purchases (
    student_id, course_id, teacher_id, payment_verification_id,
    amount_paid, platform_fee_pct, platform_fee_amount, teacher_earning_amount
  ) VALUES (
    NEW.profile_id, NEW.course_id, v_course.created_by, NEW.id,
    NEW.amount, v_fee_pct, v_fee_amount, v_teacher_amount
  )
  ON CONFLICT (student_id, course_id) DO NOTHING;

  IF v_course.created_by IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      v_course.created_by,
      'Course sale 💰',
      'Your course sold for $' || NEW.amount || ' — you earned $' || v_teacher_amount || ' after the ' || v_fee_pct || '% platform fee.',
      'success'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_activate_course_purchase ON public.payment_verifications;
CREATE TRIGGER trg_activate_course_purchase
  AFTER UPDATE ON public.payment_verifications
  FOR EACH ROW EXECUTE FUNCTION public.activate_course_purchase();
