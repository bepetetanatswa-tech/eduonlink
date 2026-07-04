-- ═══════════════════════════════════════════════════════════════
-- EduOnLink — Migration 051: Digital Library
-- Run this in: Supabase Dashboard → SQL Editor
--
-- Stage 7 called for a searchable, cross-class digital library
-- (organized by subject/level/topic/resource type, with bookmarking).
-- What existed (class_resources) was a flat per-class file list only
-- — kept as-is for that use case, this is a separate, broader library.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.library_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  subject text NOT NULL,
  level public.subject_level NOT NULL,
  topic text,
  resource_type text NOT NULL CHECK (resource_type IN ('textbook', 'notes', 'video', 'reference')),
  file_url text NOT NULL,
  file_name text,
  uploaded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  download_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_library_resources_subject ON public.library_resources(subject);
CREATE INDEX IF NOT EXISTS idx_library_resources_level ON public.library_resources(level);
CREATE INDEX IF NOT EXISTS idx_library_resources_type ON public.library_resources(resource_type);

CREATE TABLE IF NOT EXISTS public.library_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  resource_id uuid NOT NULL REFERENCES public.library_resources(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, resource_id)
);

ALTER TABLE public.library_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "library_resources_select" ON public.library_resources FOR SELECT USING (true);
CREATE POLICY "library_resources_write" ON public.library_resources FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = ANY (ARRAY['teacher'::user_role, 'school_admin'::user_role, 'super_admin'::user_role]))
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = ANY (ARRAY['teacher'::user_role, 'school_admin'::user_role, 'super_admin'::user_role]))
);

CREATE POLICY "library_bookmarks_own" ON public.library_bookmarks FOR ALL USING (
  profile_id = get_my_profile_id()
) WITH CHECK (
  profile_id = get_my_profile_id()
);

CREATE OR REPLACE FUNCTION public.increment_library_download(p_resource_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path TO 'public'
AS $$
  UPDATE library_resources SET download_count = download_count + 1 WHERE id = p_resource_id;
$$;

GRANT EXECUTE ON FUNCTION public.increment_library_download(uuid) TO authenticated;
