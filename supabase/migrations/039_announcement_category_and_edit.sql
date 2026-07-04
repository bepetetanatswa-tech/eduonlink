-- VOA/Educonnect — Migration 039: announcement categories + edit tracking.
ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN ('academic', 'event', 'urgent', 'general')),
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
