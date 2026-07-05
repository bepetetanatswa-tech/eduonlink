-- ═══════════════════════════════════════════════════════════════
-- EduOnLink — Migration 055: safe cross-school author lookup for lesson Q&A
-- Run this in: Supabase Dashboard → SQL Editor
--
-- lesson_comments is on course_materials, and courses have no school_id —
-- they're platform-wide marketplace content, purchased/viewed across
-- schools. lesson_comments itself is already select:true (broadcast), but
-- profiles select RLS is restricted to self/super_admin/same-school, so
-- embedding `profiles!lesson_comments_author_id_fkey(full_name,role)` in a
-- query would return null for any comment author not in the viewer's
-- school — silently anonymizing most Q&A participants and losing the
-- "Teacher" reply badge in the common cross-school case.
--
-- Fixing this by widening profiles SELECT would leak the rest of that
-- table (email, phone, address, guardian_phone, id_doc_key, etc.) to
-- anyone who ever asked a lesson question. Instead, expose only
-- {id, full_name, role} through a SECURITY DEFINER function, scoped to
-- ids that have actually authored a lesson_comment — not a general
-- profile-lookup oracle.
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_comment_authors(author_ids uuid[])
RETURNS TABLE(id uuid, full_name text, role user_role)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT p.id, p.full_name, p.role
  FROM profiles p
  WHERE p.id = ANY(author_ids)
    AND EXISTS (SELECT 1 FROM lesson_comments lc WHERE lc.author_id = p.id);
$$;

-- Postgres grants EXECUTE to PUBLIC by default on function creation, which
-- would let even a fully signed-out request call this — explicitly revoke
-- before granting only to logged-in users.
REVOKE EXECUTE ON FUNCTION public.get_comment_authors(uuid[]) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_comment_authors(uuid[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_comment_authors(uuid[]) TO authenticated;
