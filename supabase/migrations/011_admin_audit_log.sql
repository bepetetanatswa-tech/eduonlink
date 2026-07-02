-- ═══════════════════════════════════════════════════════════════
-- VOA — Migration 011: Admin action audit log
-- Run this in: Supabase Dashboard → SQL Editor
--
-- Append-only log of every admin decision (school/teacher approve or
-- reject, payment verification, subscription changes, broadcasts).
-- Deliberately no INSERT grant to `authenticated` at all — even the
-- super_admin's own browser client can't write directly, only the
-- service-role admin client can (via /api/admin/audit-log or a
-- decision route), so a compromised browser session can't forge or
-- suppress log entries.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_email TEXT NOT NULL,
  action      TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id   TEXT,
  details     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;

DROP POLICY IF EXISTS "Super admin reads audit log" ON public.admin_audit_log;
CREATE POLICY "Super admin reads audit log" ON public.admin_audit_log
  FOR SELECT USING (public.is_super_admin());

CREATE INDEX IF NOT EXISTS admin_audit_log_created_idx ON public.admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_log_target_idx ON public.admin_audit_log (target_type, target_id);
