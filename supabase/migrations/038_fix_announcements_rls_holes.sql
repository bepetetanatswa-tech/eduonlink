-- VOA/Educonnect — Migration 038: close two RLS holes on announcements.
--
-- Found while building the announcements feature. Two legacy policies were
-- left in place alongside newer, correctly-scoped ones (same OR-combined
-- policy hole pattern as messages, fixed in migration 036):
--   "Announcements read" (qual: auth.role() = 'authenticated') — any
--     logged-in user could read every announcement platform-wide,
--     regardless of school/class membership.
--   "Announcements insert" (with_check: author_id = self only, no
--     school/class ownership check) — any authenticated user could post
--     an announcement targeting a school_id/class_id they have no
--     relationship to, since only author_id was checked.
-- The newer "announcements: select"/"announcements: insert" policies
-- already correctly scope by is_in_school / is_my_school_admin /
-- is_my_class_teacher / is_enrolled_in_class — dropping the legacy ones
-- leaves those as the sole, correct policies.

DROP POLICY IF EXISTS "Announcements read" ON public.announcements;
DROP POLICY IF EXISTS "Announcements insert" ON public.announcements;
