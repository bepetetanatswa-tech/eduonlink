-- Independent (school_id IS NULL) classes are meant to be publicly
-- discoverable by students shopping for a teacher, not just found via an
-- out-of-band join code. Add a SELECT branch so any authenticated profile
-- can see (browse) them before enrolling. join_class_by_code() already runs
-- SECURITY DEFINER for the actual enrollment insert, so exposing join_code
-- in this listing doesn't grant any privilege beyond what that RPC already
-- grants to anyone who has the code.
drop policy if exists "classes: select" on public.classes;
create policy "classes: select" on public.classes
for select
using (
  is_super_admin()
  or teacher_id = get_my_profile_id()
  or is_enrolled_in_class(id)
  or (school_id is not null and is_my_school_admin(school_id))
  or school_id is null
);
