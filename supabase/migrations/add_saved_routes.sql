-- ─────────────────────────────────────────────────────────────
-- add_saved_routes.sql
-- Route Sharing Queue — squads save favourite routes for reuse.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS saved_routes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  squad_id    UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
  saved_by    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  distance_km NUMERIC,
  route_coords JSONB NOT NULL DEFAULT '[]',
  workout_id  UUID REFERENCES workouts(id) ON DELETE SET NULL,
  times_run   INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_saved_routes_squad
  ON saved_routes(squad_id);

CREATE INDEX IF NOT EXISTS idx_saved_routes_created
  ON saved_routes(created_at DESC);

-- RLS
ALTER TABLE saved_routes ENABLE ROW LEVEL SECURITY;

-- Squad members can read routes for their squad
CREATE POLICY "squad members can read saved routes"
  ON saved_routes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM squad_members sm
      WHERE sm.squad_id = saved_routes.squad_id
        AND sm.user_id = auth.uid()
    )
  );

-- Squad members can insert routes for their squad
CREATE POLICY "squad members can save routes"
  ON saved_routes FOR INSERT
  WITH CHECK (
    saved_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM squad_members sm
      WHERE sm.squad_id = saved_routes.squad_id
        AND sm.user_id = auth.uid()
    )
  );

-- Only the person who saved it can delete it
CREATE POLICY "route owner can delete"
  ON saved_routes FOR DELETE
  USING (saved_by = auth.uid());

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE saved_routes;

-- Helper: atomically increment times_run
CREATE OR REPLACE FUNCTION increment_route_runs(route_id UUID)
RETURNS VOID AS $$
  UPDATE saved_routes SET times_run = times_run + 1 WHERE id = route_id;
$$ LANGUAGE SQL SECURITY DEFINER;
