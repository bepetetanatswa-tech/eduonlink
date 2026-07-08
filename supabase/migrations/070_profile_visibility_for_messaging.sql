-- profiles: select only granted visibility for same-school members and
-- independent-class teachers (public discoverability). It had no clause for
-- "someone I'm messaging" — so any DM outside a shared school/class (e.g.
-- messaging the platform admin, cross-school messaging, classmates in a
-- schoolless independent class) came back with the embedded sender/receiver
-- profile as null. That null crashes the chat render (`m.sender.full_name`
-- on null) on the recipient's side and silently drops the conversation from
-- the sender's list (`if (!other) return;` in loadConversations).

create or replace function public.can_view_profile(target_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1 from public.messages m
      where (m.sender_id = target_id and m.receiver_id = get_my_profile_id())
         or (m.sender_id = get_my_profile_id() and m.receiver_id = target_id)
    )
    or exists (
      -- target teaches a class I'm actively enrolled in
      select 1 from public.classes c
      join public.class_enrollments ce on ce.class_id = c.id
      where c.teacher_id = target_id and ce.student_id = get_my_profile_id() and ce.status = 'active'
    )
    or exists (
      -- I teach a class the target is actively enrolled in
      select 1 from public.classes c
      join public.class_enrollments ce on ce.class_id = c.id
      where c.teacher_id = get_my_profile_id() and ce.student_id = target_id and ce.status = 'active'
    )
    or exists (
      -- target and I are both active students in the same class (classmates)
      select 1 from public.class_enrollments ce1
      join public.class_enrollments ce2 on ce1.class_id = ce2.class_id
      where ce1.student_id = target_id and ce2.student_id = get_my_profile_id()
        and ce1.status = 'active' and ce2.status = 'active'
    );
$$;

grant execute on function public.can_view_profile(uuid) to authenticated;

drop policy if exists "profiles: select" on public.profiles;
create policy "profiles: select" on public.profiles
  for select
  using (
    is_super_admin()
    or user_id = auth.uid()
    or is_same_school_member(id)
    or is_independent_class_teacher(id)
    or can_view_profile(id)
  );
