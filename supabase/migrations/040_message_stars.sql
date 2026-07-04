-- VOA/Educonnect — Migration 040: star/bookmark messages.
--
-- Per-user, not shared like pinning (a message being "pinned" is one
-- shared state for the whole class chat; "starred" is personal — each
-- user keeps their own set of bookmarked messages for later reference).

CREATE TABLE IF NOT EXISTS public.message_stars (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id)
);

ALTER TABLE public.message_stars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "message_stars: select" ON public.message_stars
  FOR SELECT USING (user_id = public.get_my_profile_id() OR public.is_super_admin());

CREATE POLICY "message_stars: insert" ON public.message_stars
  FOR INSERT WITH CHECK (user_id = public.get_my_profile_id());

CREATE POLICY "message_stars: delete" ON public.message_stars
  FOR DELETE USING (user_id = public.get_my_profile_id() OR public.is_super_admin());

GRANT SELECT, INSERT, DELETE ON public.message_stars TO authenticated;

CREATE INDEX IF NOT EXISTS message_stars_user_idx ON public.message_stars(user_id);
CREATE INDEX IF NOT EXISTS message_stars_message_idx ON public.message_stars(message_id);
