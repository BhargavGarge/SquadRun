-- ─────────────────────────────────────────────────────────────
-- Squad Goals — Supabase Database Schema
-- Run this in the Supabase SQL Editor or via the CLI:
--   supabase db push
-- ─────────────────────────────────────────────────────────────

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── USERS ───────────────────────────────────────────────────
-- Mirrors Clerk users; updated on each sign-in via upsert.

CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id        TEXT NOT NULL UNIQUE,
  username        TEXT NOT NULL,
  display_name    TEXT NOT NULL,
  avatar_url      TEXT,
  fitness_level   TEXT CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
  bio             TEXT,
  push_token      TEXT,                         -- Expo push token for notifications
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);

-- Automatically update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── SQUADS ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS squads (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  invite_code TEXT NOT NULL UNIQUE,
  avatar_url  TEXT,
  owner_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  max_members INTEGER NOT NULL DEFAULT 6 CHECK (max_members BETWEEN 3 AND 6),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER squads_updated_at
  BEFORE UPDATE ON squads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Generate invite code automatically if not provided
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.invite_code IS NULL OR NEW.invite_code = '' THEN
    NEW.invite_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER squads_invite_code
  BEFORE INSERT ON squads
  FOR EACH ROW EXECUTE FUNCTION generate_invite_code();

-- ─── SQUAD MEMBERS ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS squad_members (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  squad_id  UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role      TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (squad_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_squad_members_user ON squad_members(user_id);
CREATE INDEX IF NOT EXISTS idx_squad_members_squad ON squad_members(squad_id);

-- Enforce max_members limit before insert
CREATE OR REPLACE FUNCTION check_squad_capacity()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  current_count INTEGER;
  max_cap       INTEGER;
BEGIN
  SELECT COUNT(*) INTO current_count FROM squad_members WHERE squad_id = NEW.squad_id;
  SELECT max_members INTO max_cap FROM squads WHERE id = NEW.squad_id;
  IF current_count >= max_cap THEN
    RAISE EXCEPTION 'Squad is full (max % members)', max_cap;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_squad_capacity
  BEFORE INSERT ON squad_members
  FOR EACH ROW EXECUTE FUNCTION check_squad_capacity();

-- ─── GOALS ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS goals (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  squad_id       UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  description    TEXT,
  target_value   NUMERIC NOT NULL,
  unit           TEXT NOT NULL CHECK (unit IN ('km', 'miles', 'hours', 'sessions', 'calories')),
  workout_types  TEXT[] NOT NULL DEFAULT '{}',
  starts_at      TIMESTAMPTZ NOT NULL,
  ends_at        TIMESTAMPTZ NOT NULL,
  status         TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
  created_by     UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goals_squad ON goals(squad_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);

-- ─── WORKOUTS ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS workouts (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  squad_id         UUID REFERENCES squads(id) ON DELETE SET NULL,
  goal_id          UUID REFERENCES goals(id) ON DELETE SET NULL,
  type             TEXT NOT NULL CHECK (type IN ('run','cycle','swim','strength','yoga','hike','other')),
  title            TEXT,
  distance_km      NUMERIC,
  duration_minutes NUMERIC,
  calories         NUMERIC,
  notes            TEXT,
  logged_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workouts_user    ON workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_squad   ON workouts(squad_id);
CREATE INDEX IF NOT EXISTS idx_workouts_goal    ON workouts(goal_id);
CREATE INDEX IF NOT EXISTS idx_workouts_logged  ON workouts(logged_at DESC);

-- Auto-update goal status to 'completed' when progress hits target
CREATE OR REPLACE FUNCTION check_goal_completion()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  g        RECORD;
  total    NUMERIC := 0;
BEGIN
  -- Only process if the workout is tied to a goal
  IF NEW.goal_id IS NULL THEN RETURN NEW; END IF;

  SELECT * INTO g FROM goals WHERE id = NEW.goal_id;
  IF NOT FOUND OR g.status != 'active' THEN RETURN NEW; END IF;

  -- Sum the appropriate metric
  IF g.unit = 'km' THEN
    SELECT COALESCE(SUM(distance_km), 0) INTO total
    FROM workouts WHERE goal_id = NEW.goal_id;
  ELSIF g.unit = 'hours' THEN
    SELECT COALESCE(SUM(duration_minutes) / 60.0, 0) INTO total
    FROM workouts WHERE goal_id = NEW.goal_id;
  ELSIF g.unit = 'calories' THEN
    SELECT COALESCE(SUM(calories), 0) INTO total
    FROM workouts WHERE goal_id = NEW.goal_id;
  ELSE
    SELECT COUNT(*) INTO total FROM workouts WHERE goal_id = NEW.goal_id;
  END IF;

  IF total >= g.target_value THEN
    UPDATE goals SET status = 'completed' WHERE id = NEW.goal_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER workout_goal_completion
  AFTER INSERT ON workouts
  FOR EACH ROW EXECUTE FUNCTION check_goal_completion();

-- ─── ACTIVITY FEED ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS activity_feed (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  squad_id   UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL CHECK (kind IN ('workout','achievement','joined','goal_set')),
  payload    JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_squad ON activity_feed(squad_id, created_at DESC);

-- ─── NOTIFICATIONS ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  data       JSONB NOT NULL DEFAULT '{}',
  read       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);

-- ─── BADGES ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS badges (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key             TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  description     TEXT NOT NULL,
  icon            TEXT NOT NULL,              -- emoji
  condition_value NUMERIC NOT NULL,
  condition_unit  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_badges (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id  UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, badge_id)
);

-- ─── ROW-LEVEL SECURITY ──────────────────────────────────────
-- Enable RLS on all tables and add policies.
-- We use Clerk JWT for auth; the sub claim maps to clerk_id.

ALTER TABLE users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE squads         ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals          ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed  ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges         ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges    ENABLE ROW LEVEL SECURITY;

-- Helper: get the db user.id for the current Clerk JWT
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID LANGUAGE sql STABLE AS $$
  SELECT id FROM users WHERE clerk_id = auth.jwt()->>'sub';
$$;

-- Helper: get all squad IDs the current user belongs to (SECURITY DEFINER
-- bypasses RLS on squad_members so policies on that table don't recurse)
CREATE OR REPLACE FUNCTION get_my_squad_ids()
RETURNS SETOF UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT squad_id FROM squad_members WHERE user_id = current_user_id();
$$;

-- Users: read own row, all users readable (for squad member display)
CREATE POLICY "users_read_all"     ON users FOR SELECT USING (true);
CREATE POLICY "users_insert_own"   ON users FOR INSERT WITH CHECK (clerk_id = auth.jwt()->>'sub');
CREATE POLICY "users_update_own"   ON users FOR UPDATE USING (id = current_user_id());

-- Squads: readable by owner or squad members
CREATE POLICY "squads_read_member" ON squads FOR SELECT USING (
  owner_id = current_user_id()
  OR id IN (SELECT squad_id FROM squad_members WHERE user_id = current_user_id())
);
CREATE POLICY "squads_insert_auth" ON squads FOR INSERT WITH CHECK (owner_id = current_user_id());
CREATE POLICY "squads_update_owner" ON squads FOR UPDATE USING (owner_id = current_user_id());

-- Squad members: readable by self or other members of the same squad
CREATE POLICY "squad_members_read" ON squad_members FOR SELECT USING (
  user_id = current_user_id()
  OR squad_id IN (SELECT get_my_squad_ids())
);
CREATE POLICY "squad_members_insert_self" ON squad_members FOR INSERT WITH CHECK (user_id = current_user_id());
CREATE POLICY "squad_members_delete_self" ON squad_members FOR DELETE USING (user_id = current_user_id());

-- Goals: readable by squad members
CREATE POLICY "goals_read_member" ON goals FOR SELECT USING (
  squad_id IN (SELECT squad_id FROM squad_members WHERE user_id = current_user_id())
);
CREATE POLICY "goals_insert_member" ON goals FOR INSERT WITH CHECK (
  squad_id IN (SELECT squad_id FROM squad_members WHERE user_id = current_user_id())
  AND created_by = current_user_id()
);

-- Workouts: own workouts + squad workouts
CREATE POLICY "workouts_read_squad" ON workouts FOR SELECT USING (
  user_id = current_user_id()
  OR squad_id IN (SELECT squad_id FROM squad_members WHERE user_id = current_user_id())
);
CREATE POLICY "workouts_insert_own" ON workouts FOR INSERT WITH CHECK (user_id = current_user_id());
CREATE POLICY "workouts_delete_own" ON workouts FOR DELETE USING (user_id = current_user_id());

-- Activity feed: readable by self or squad members
CREATE POLICY "activity_read_member" ON activity_feed FOR SELECT USING (
  user_id = current_user_id()
  OR squad_id IN (SELECT squad_id FROM squad_members WHERE user_id = current_user_id())
);
CREATE POLICY "activity_insert_member" ON activity_feed FOR INSERT WITH CHECK (
  squad_id IN (SELECT squad_id FROM squad_members WHERE user_id = current_user_id())
  AND user_id = current_user_id()
);

-- Notifications: own only
CREATE POLICY "notifications_read_own"   ON notifications FOR SELECT USING (user_id = current_user_id());
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (user_id = current_user_id());

-- Badges: public read
CREATE POLICY "badges_read_all" ON badges FOR SELECT USING (true);
CREATE POLICY "user_badges_read" ON user_badges FOR SELECT USING (
  user_id = current_user_id()
  OR user_id IN (
    SELECT user_id FROM squad_members
    WHERE squad_id IN (SELECT squad_id FROM squad_members WHERE user_id = current_user_id())
  )
);

-- ─── REAL-TIME ────────────────────────────────────────────────
-- Enable Realtime on the tables that need live updates

ALTER PUBLICATION supabase_realtime ADD TABLE workouts;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_feed;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE goals;
