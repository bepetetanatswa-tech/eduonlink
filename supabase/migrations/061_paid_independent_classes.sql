-- Stage 2: paid independent classes, reusing the payment_verifications +
-- admin-approval pattern already built for course purchases (see 016).
--
-- Rule: join codes are a free-class-only self-service shortcut. Paid
-- classes must go through payment + manual admin approval — never the
-- instant join_class_by_code RPC — so join_class_by_code is updated to
-- reject any class with price > 0.

alter table public.classes add column if not exists price numeric not null default 0;

alter table public.payment_verifications
  add column if not exists class_id uuid references public.classes(id) on delete set null;
create index if not exists idx_payment_verifications_class_id on public.payment_verifications(class_id);

-- One row per completed paid-class sale, mirroring course_purchases.
create table if not exists public.class_purchases (
  id                      uuid primary key default gen_random_uuid(),
  student_id              uuid not null references public.profiles(id) on delete cascade,
  class_id                uuid not null references public.classes(id) on delete cascade,
  teacher_id              uuid not null references public.profiles(id) on delete cascade,
  payment_verification_id uuid references public.payment_verifications(id) on delete set null,
  amount_paid             numeric(10,2) not null,
  platform_fee_pct        numeric(5,2) not null,
  platform_fee_amount     numeric(10,2) not null,
  teacher_earning_amount  numeric(10,2) not null,
  status                  text not null default 'completed' check (status in ('completed', 'refunded')),
  created_at              timestamptz not null default now(),
  unique (student_id, class_id)
);

alter table public.class_purchases enable row level security;
grant select on public.class_purchases to authenticated;
grant all on public.class_purchases to service_role;

drop policy if exists "Student sees own class purchases" on public.class_purchases;
create policy "Student sees own class purchases" on public.class_purchases
  for select using (student_id = public.get_my_profile_id());

drop policy if exists "Teacher sees own class sales" on public.class_purchases;
create policy "Teacher sees own class sales" on public.class_purchases
  for select using (teacher_id = public.get_my_profile_id());

drop policy if exists "Super admin all class purchases" on public.class_purchases;
create policy "Super admin all class purchases" on public.class_purchases
  for select using (public.is_super_admin());

create index if not exists idx_class_purchases_student_id on public.class_purchases(student_id);
create index if not exists idx_class_purchases_class_id on public.class_purchases(class_id);
create index if not exists idx_class_purchases_teacher_id on public.class_purchases(teacher_id);

-- Reject join-by-code on any class that requires payment.
create or replace function public.join_class_by_code(p_code text)
returns table(class_id uuid, class_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id uuid := public.get_my_profile_id();
  v_student_name text;
  v_class record;
  v_already_enrolled boolean;
begin
  if v_student_id is null then
    raise exception 'Not signed in';
  end if;

  select id, name, teacher_id, price into v_class
  from public.classes where join_code = upper(trim(p_code));

  if v_class.id is null then
    raise exception 'Invalid join code';
  end if;

  if v_class.price > 0 then
    raise exception 'This class requires payment — use Enroll instead of a join code.';
  end if;

  select exists(
    select 1 from public.class_enrollments
    where class_enrollments.class_id = v_class.id and student_id = v_student_id and status = 'active'
  ) into v_already_enrolled;

  if v_already_enrolled then
    raise exception 'Already enrolled in this class';
  end if;

  insert into public.class_enrollments (class_id, student_id, status)
  values (v_class.id, v_student_id, 'active')
  on conflict (class_id, student_id) do update set status = 'active';

  select full_name into v_student_name from public.profiles where id = v_student_id;

  if v_class.teacher_id is not null then
    insert into public.notifications (user_id, title, message, type, link)
    values (
      v_class.teacher_id,
      'New student joined ' || v_class.name,
      coalesce(v_student_name, 'A student') || ' joined your class using the join code.',
      'info',
      '/teacher/dashboard/classes/' || v_class.id || '/students'
    );
  end if;

  return query select v_class.id, v_class.name;
end;
$$;

-- Trigger: when a 'class' payment_verifications row is approved, compute
-- the commission split (same platform_settings.commission_rate_pct as
-- course sales), record the sale, grant the enrollment, and notify the
-- teacher. Piggybacks on the existing admin approve button in
-- PaymentsClient.tsx with no changes needed there.
create or replace function public.activate_class_purchase()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_class record;
  v_fee_pct numeric(5,2);
  v_fee_amount numeric(10,2);
  v_teacher_amount numeric(10,2);
begin
  if new.purchase_type <> 'class' or new.class_id is null then
    return new;
  end if;
  if new.status <> 'approved' or old.status = 'approved' then
    return new;
  end if;

  select id, teacher_id, name into v_class from public.classes where id = new.class_id;
  if v_class is null then
    return new;
  end if;

  select coalesce((value #>> '{}')::numeric, 20) into v_fee_pct
  from public.platform_settings where key = 'commission_rate_pct';
  v_fee_pct := coalesce(v_fee_pct, 20);

  v_fee_amount := round(new.amount * v_fee_pct / 100, 2);
  v_teacher_amount := new.amount - v_fee_amount;

  insert into public.class_purchases (
    student_id, class_id, teacher_id, payment_verification_id,
    amount_paid, platform_fee_pct, platform_fee_amount, teacher_earning_amount
  ) values (
    new.profile_id, new.class_id, v_class.teacher_id, new.id,
    new.amount, v_fee_pct, v_fee_amount, v_teacher_amount
  )
  on conflict (student_id, class_id) do nothing;

  insert into public.class_enrollments (class_id, student_id, status)
  values (new.class_id, new.profile_id, 'active')
  on conflict (class_id, student_id) do update set status = 'active';

  if v_class.teacher_id is not null then
    insert into public.notifications (user_id, title, message, type, link)
    values (
      v_class.teacher_id,
      'Class enrollment 💰',
      'A student paid $' || new.amount || ' to join "' || v_class.name || '" — you earned $' || v_teacher_amount || ' after the ' || v_fee_pct || '% platform fee.',
      'success',
      '/teacher/dashboard/classes/' || new.class_id || '/students'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_activate_class_purchase on public.payment_verifications;
create trigger trg_activate_class_purchase
  after update on public.payment_verifications
  for each row execute function public.activate_class_purchase();
