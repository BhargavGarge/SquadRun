-- ─────────────────────────────────────────────────────────────
-- Migration: add GPS tracking columns to workouts table
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ─────────────────────────────────────────────────────────────

ALTER TABLE workouts
  ADD COLUMN IF NOT EXISTS steps         integer       DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS route_coords  jsonb         DEFAULT NULL;

-- Optional: index for querying workouts that have a route
CREATE INDEX IF NOT EXISTS idx_workouts_has_route
  ON workouts ((route_coords IS NOT NULL))
  WHERE route_coords IS NOT NULL;

-- ─────────────────────────────────────────────────────────────
-- route_coords shape (array of objects):
-- [
--   { "latitude": 12.9716, "longitude": 77.5946, "timestamp": 1700000000000 },
--   ...
-- ]
-- steps: raw integer step count from device pedometer
-- ─────────────────────────────────────────────────────────────
