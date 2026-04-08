-- ─────────────────────────────────────────────────────────────
-- Migration: workout social (photos, comments, likes)
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- or via the CLI after 001_initial.sql.
-- ─────────────────────────────────────────────────────────────

-- 1) Photo URL on workouts
ALTER TABLE workouts
  ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- 2) Workout comments
CREATE TABLE IF NOT EXISTS workout_comments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id  UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workout_comments_workout
  ON workout_comments(workout_id, created_at DESC);

-- 3) Workout likes / kudos
CREATE TABLE IF NOT EXISTS workout_likes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id  UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workout_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_workout_likes_workout
  ON workout_likes(workout_id, created_at DESC);

-- 4) Enable RLS
ALTER TABLE workout_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_likes    ENABLE ROW LEVEL SECURITY;

-- Access helper reused from 001_initial.sql
--   current_user_id() → users.id for auth.jwt()->>'sub'
--   get_my_squad_ids() → squad_ids for current user

-- 5) Policies: comments
CREATE POLICY "workout_comments_read_member" ON workout_comments
FOR SELECT USING (
  -- Author can always read their own comments
  user_id = current_user_id()
  OR workout_id IN (
    SELECT id FROM workouts
    WHERE user_id = current_user_id()
       OR squad_id IN (SELECT squad_id FROM squad_members WHERE user_id = current_user_id())
  )
);

CREATE POLICY "workout_comments_insert_member" ON workout_comments
FOR INSERT WITH CHECK (
  user_id = current_user_id()
  AND workout_id IN (
    SELECT id FROM workouts
    WHERE user_id = current_user_id()
       OR squad_id IN (SELECT squad_id FROM squad_members WHERE user_id = current_user_id())
  )
);

CREATE POLICY "workout_comments_delete_own" ON workout_comments
FOR DELETE USING (user_id = current_user_id());

-- 6) Policies: likes / kudos
CREATE POLICY "workout_likes_read_member" ON workout_likes
FOR SELECT USING (
  user_id = current_user_id()
  OR workout_id IN (
    SELECT id FROM workouts
    WHERE user_id = current_user_id()
       OR squad_id IN (SELECT squad_id FROM squad_members WHERE user_id = current_user_id())
  )
);

CREATE POLICY "workout_likes_insert_member" ON workout_likes
FOR INSERT WITH CHECK (
  user_id = current_user_id()
  AND workout_id IN (
    SELECT id FROM workouts
    WHERE user_id = current_user_id()
       OR squad_id IN (SELECT squad_id FROM squad_members WHERE user_id = current_user_id())
  )
);

CREATE POLICY "workout_likes_delete_own" ON workout_likes
FOR DELETE USING (user_id = current_user_id());

-- 7) Optional: realtime on comments/likes (uncomment if desired)
-- ALTER PUBLICATION supabase_realtime ADD TABLE workout_comments;
-- ALTER PUBLICATION supabase_realtime ADD TABLE workout_likes;
