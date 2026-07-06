-- Students browsing independent (school_id IS NULL) classes need to see the
-- teacher's name/avatar, but the existing "profiles: select" policy only
-- allows self, super_admin, or same-school members. Add a branch so any
-- authenticated profile can see a teacher's profile if that teacher runs at
-- least one independent (public/discoverable) class.
create or replace function public.is_independent_class_teacher(p_profile_id uuid)
returns boolean
language sql
stable security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.classes
    where teacher_id = p_profile_id and school_id is null
  );
$$;

drop policy if exists "profiles: select" on public.profiles;
create policy "profiles: select" on public.profiles
for select
using (
  is_super_admin()
  or user_id = auth.uid()
  or is_same_school_member(id)
  or is_independent_class_teacher(id)
);
