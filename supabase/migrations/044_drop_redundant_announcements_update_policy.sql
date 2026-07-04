-- VOA/Educonnect (now EduOnLink) — Migration 044: drop redundant legacy
-- announcements UPDATE policy.
--
-- Found via Supabase's performance advisor while auditing this session's
-- work: "Announcements update" (legacy, author_id-only) and
-- "announcements: update" (current, author_id OR super_admin) were both
-- active and OR-combined. Not a security hole this time — the legacy
-- policy's author_id check is a strict subset of what the current policy
-- already allows — but Postgres evaluates both permissive policies on
-- every UPDATE for no benefit. Dropping the redundant one.

DROP POLICY IF EXISTS "Announcements update" ON public.announcements;
