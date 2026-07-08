-- Same bug shape as migration 070, on three more tables: the only
-- teacher-view policy on ai_usage/ai_conversations/student_badges required
-- a shared school_members row, with zero fallback for a teacher whose
-- students reach them through a class instead of a school (independent
-- teachers, and their schoolless classes' students). Confirmed via a
-- schoolless-user gating audit that this leaves an independent teacher's
-- AI-usage dashboard permanently empty and their students' badges
-- unreadable, even though every other academic table (grades, attendance,
-- lessons, assignments, hbc_projects) already has this class-based clause.

create or replace function public.is_my_student(target_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.class_enrollments ce
    join public.classes c on c.id = ce.class_id
    where ce.student_id = target_student_id
      and c.teacher_id = get_my_profile_id()
      and ce.status = 'active'
  );
$$;

grant execute on function public.is_my_student(uuid) to authenticated;

drop policy if exists "Teachers view school ai usage" on public.ai_usage;
create policy "Teachers view school ai usage" on public.ai_usage
  for select
  using (
    exists (
      select 1 from school_members sm_t
      join school_members sm_s on sm_t.school_id = sm_s.school_id
      where sm_t.user_id = get_my_profile_id() and sm_t.role = 'teacher'::member_role and sm_s.user_id = ai_usage.user_id
    )
    or is_my_student(ai_usage.user_id)
  );

drop policy if exists "Teachers view school student conversations" on public.ai_conversations;
create policy "Teachers view school student conversations" on public.ai_conversations
  for select
  using (
    exists (
      select 1 from school_members sm_t
      join school_members sm_s on sm_t.school_id = sm_s.school_id
      where sm_t.user_id = get_my_profile_id() and sm_t.role = 'teacher'::member_role and sm_s.user_id = ai_conversations.student_id
    )
    or is_my_student(ai_conversations.student_id)
  );

drop policy if exists "student_badges: select" on public.student_badges;
create policy "student_badges: select" on public.student_badges
  for select
  using (
    is_super_admin()
    or student_id = get_my_profile_id()
    or exists (
      select 1 from school_members sm_t
      join school_members sm_s on sm_t.school_id = sm_s.school_id
      where sm_t.user_id = get_my_profile_id() and sm_t.role = 'teacher'::member_role and sm_s.user_id = student_badges.student_id
    )
    or is_my_student(student_badges.student_id)
  );
