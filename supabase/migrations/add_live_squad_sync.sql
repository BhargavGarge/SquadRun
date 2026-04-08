-- Live squad sync: per-squad live GPS locations for active workouts

CREATE TABLE IF NOT EXISTS live_locations (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  squad_id   UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
  workout_id UUID REFERENCES workouts(id) ON DELETE SET NULL,
  lat        DOUBLE PRECISION NOT NULL,
  lon        DOUBLE PRECISION NOT NULL,
  heading    DOUBLE PRECISION,
  speed_mps  DOUBLE PRECISION,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, squad_id)
);

CREATE INDEX IF NOT EXISTS idx_live_locations_squad ON live_locations(squad_id);
CREATE INDEX IF NOT EXISTS idx_live_locations_updated ON live_locations(updated_at DESC);

ALTER TABLE live_locations ENABLE ROW LEVEL SECURITY;

-- Squad members can see live locations for their squads
CREATE POLICY live_locations_select_squad
  ON live_locations
  FOR SELECT
  USING (
    squad_id IN (SELECT get_my_squad_ids())
  );

-- Only the authenticated user can insert/update their own live location rows
CREATE POLICY live_locations_upsert_own
  ON live_locations
  FOR INSERT
  WITH CHECK (
    user_id = current_user_id()
      AND squad_id IN (SELECT get_my_squad_ids())
  );

CREATE POLICY live_locations_update_own
  ON live_locations
  FOR UPDATE
  USING (
    user_id = current_user_id()
  )
  WITH CHECK (
    user_id = current_user_id()
  );

CREATE POLICY live_locations_delete_own
  ON live_locations
  FOR DELETE
  USING (
    user_id = current_user_id()
  );

-- Enable Realtime on live_locations
ALTER PUBLICATION supabase_realtime ADD TABLE live_locations;
