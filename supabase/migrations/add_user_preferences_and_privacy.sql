-- ─────────────────────────────────────────────────────────────
-- Add user preference + privacy fields
-- Run in Supabase SQL editor or via CLI (e.g. supabase db push)
-- ─────────────────────────────────────────────────────────────

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS preferred_units TEXT
    CHECK (preferred_units IN ('km','miles'))
    DEFAULT 'km',
  ADD COLUMN IF NOT EXISTS default_workout_type TEXT
    CHECK (default_workout_type IN ('run','cycle','swim','strength','yoga','hike','other')),
  ADD COLUMN IF NOT EXISTS share_workouts_to_squad BOOLEAN
    NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS show_in_leaderboards BOOLEAN
    NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notify_daily_reminder BOOLEAN
    NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS notify_daily_hour INTEGER
    NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS notify_squad_activity BOOLEAN
    NOT NULL DEFAULT TRUE;
