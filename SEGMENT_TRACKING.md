# Segment PR Tracking — Database Setup

## Required Supabase Table

Create a new table `workout_segments` to store detected segments for PR tracking:

```sql
CREATE TABLE public.workout_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  distance_km NUMERIC NOT NULL,
  start_lat NUMERIC NOT NULL,
  start_lon NUMERIC NOT NULL,
  end_lat NUMERIC NOT NULL,
  end_lon NUMERIC NOT NULL,
  duration_seconds INTEGER NOT NULL,
  pace_min_per_km NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_distance CHECK (distance_km > 0),
  CONSTRAINT valid_duration CHECK (duration_seconds > 0)
);

CREATE INDEX idx_segments_user_distance
  ON public.workout_segments(user_id, distance_km);

CREATE INDEX idx_segments_location
  ON public.workout_segments(start_lat, start_lon, end_lat, end_lon);
```

## RLS Policy

Enable RLS and add policy for users to see only their own segments:

```sql
ALTER TABLE public.workout_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own segments" ON public.workout_segments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service inserts segments" ON public.workout_segments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## How It Works

1. **Segment Detection**: When a workout is viewed, segments are auto-detected (1km, 5km, 10km chunks)
2. **PR Checking**: System queries historical segments within a geographic threshold (±0.01° = ~1km)
3. **Geospatial Matching**: Compares start/end coordinates to find same segment
4. **PR Flag**: Segment marked as PR if:
   - No previous record exists for this distance/location, OR
   - Pace is faster than best historical time
5. **Auto-Save**: Segments are saved to DB after workout is viewed (for future reference)

## Geographic Matching

The geospatial threshold is currently set to ±0.01° latitude/longitude:

- Latitude: ~1.1 km per degree
- Longitude: ~0.9 km per degree at 45°N (varies by latitude)
- Current threshold: ~±1 km tolerance on segment endpoints

This prevents false positives while being loose enough for GPS drift (~5-10m typical accuracy).

## Future Improvements

- Add more sophisticated geospatial matching (PostGIS if needed)
- Store segment "signatures" (hash of coordinate sequence) for exact matching
- Add manual segment definitions (e.g., "Downtown Loop 5.2km")
- Support segment records without saved coordinates (manual logging)
