-- Found while investigating the parent_children visibility bug: the entire
-- school_members table (which every school-scoped RLS check and dashboard
-- page reads from — is_same_school_member, teacher/dashboard/ai-usage,
-- teacher/dashboard/hbc, every school/dashboard/* page, timetable,
-- financials, announcements...) has NO write path anywhere in the app.
-- Onboarding (src/app/onboarding/page.tsx) sets profiles.school_id directly
-- and never touches school_members at all. Confirmed via grep: every
-- reference to school_members in the codebase is a read. Result: a real
-- school-affiliated teacher or student who completes onboarding is, from
-- every school-gated feature's point of view, indistinguishable from
-- someone with no school at all — this isn't specific to independent
-- teachers, it affects every school in the platform.
--
-- Fix: keep school_members in sync with profiles.school_id/role via
-- trigger, and backfill any profiles that already have school_id set.

create or replace function public.sync_school_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  mapped_role member_role;
begin
  delete from public.school_members
  where user_id = NEW.id
    and (NEW.school_id is null or school_id <> NEW.school_id or NEW.role not in ('school_admin', 'teacher', 'student'));

  if NEW.school_id is not null and NEW.role in ('school_admin', 'teacher', 'student') then
    mapped_role := case NEW.role
      when 'school_admin' then 'admin'::member_role
      when 'teacher' then 'teacher'::member_role
      when 'student' then 'student'::member_role
    end;

    insert into public.school_members (school_id, user_id, role)
    values (NEW.school_id, NEW.id, mapped_role)
    on conflict (school_id, user_id) do update set role = excluded.role;
  end if;

  return NEW;
end;
$$;

drop trigger if exists sync_school_membership_trigger on public.profiles;
create trigger sync_school_membership_trigger
  after insert or update of school_id, role on public.profiles
  for each row
  execute function public.sync_school_membership();

insert into public.school_members (school_id, user_id, role)
select school_id, id,
  case role
    when 'school_admin' then 'admin'::member_role
    when 'teacher' then 'teacher'::member_role
    when 'student' then 'student'::member_role
  end
from public.profiles
where school_id is not null and role in ('school_admin', 'teacher', 'student')
on conflict (school_id, user_id) do update set role = excluded.role;
