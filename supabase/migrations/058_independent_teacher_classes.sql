-- Allow approved teachers with no school affiliation to create their own
-- classes. classes.school_id is already nullable and the existing "classes:
-- insert"/"classes: update" policies already had a teacher_id = self branch
-- with no role/approval check at all -- tightening that branch to require an
-- approved teacher profile also closes a pre-existing hole where any
-- authenticated profile (e.g. a student) could set teacher_id to itself.

create or replace function public.is_approved_teacher()
returns boolean
language sql
stable security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.profiles
    where id = get_my_profile_id()
      and role = 'teacher'
      and is_approved = true
  );
$$;

drop policy if exists "classes: insert" on public.classes;
create policy "classes: insert" on public.classes
for insert
with check (
  is_super_admin()
  or (teacher_id = get_my_profile_id() and is_approved_teacher())
  or (school_id is not null and is_my_school_admin(school_id))
);

drop policy if exists "classes: update" on public.classes;
create policy "classes: update" on public.classes
for update
using (
  is_super_admin()
  or (teacher_id = get_my_profile_id() and is_approved_teacher())
  or (school_id is not null and is_my_school_admin(school_id))
);
