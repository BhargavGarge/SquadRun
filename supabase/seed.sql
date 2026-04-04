-- ─────────────────────────────────────────────────────────────
-- Squad Goals — Seed Data
-- Run after 001_initial.sql to pre-populate sample data.
-- NOTE: Disable RLS temporarily or run as service_role.
-- ─────────────────────────────────────────────────────────────

-- Sample Users
INSERT INTO users (id, clerk_id, username, display_name, avatar_url, fitness_level, bio) VALUES
  ('00000000-0000-0000-0000-000000000001', 'clerk_sample_001', 'alexj', 'Alex Johnson',
   'https://api.dicebear.com/7.x/avataaars/svg?seed=alexj', 'intermediate',
   'Marathon enthusiast. Early riser. Coffee addict. 🏃'),
  ('00000000-0000-0000-0000-000000000002', 'clerk_sample_002', 'mayap', 'Maya Patel',
   'https://api.dicebear.com/7.x/avataaars/svg?seed=mayap', 'advanced',
   'Triathlete. PhD student. I train hard, nap harder.'),
  ('00000000-0000-0000-0000-000000000003', 'clerk_sample_003', 'jordanl', 'Jordan Lee',
   'https://api.dicebear.com/7.x/avataaars/svg?seed=jordanl', 'beginner',
   'Just started my fitness journey. Need all the accountability!'),
  ('00000000-0000-0000-0000-000000000004', 'clerk_sample_004', 'samr', 'Sam Rivera',
   'https://api.dicebear.com/7.x/avataaars/svg?seed=samr', 'intermediate',
   'Cyclist and hiker. Mountains are my home.')
ON CONFLICT (clerk_id) DO NOTHING;

-- Sample Squads
INSERT INTO squads (id, name, description, invite_code, owner_id, max_members) VALUES
  ('00000000-0000-0000-0001-000000000001',
   '⚡ Morning Warriors',
   'Up at 5am, no excuses. We run together.',
   'MW2024',
   '00000000-0000-0000-0000-000000000001',
   5),
  ('00000000-0000-0000-0001-000000000002',
   '🚴 Sunday Cyclists',
   'Weekend rides and weekday accountability.',
   'CYCSUN',
   '00000000-0000-0000-0000-000000000004',
   6)
ON CONFLICT (invite_code) DO NOTHING;

-- Squad Members
INSERT INTO squad_members (squad_id, user_id, role) VALUES
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', 'admin'),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000002', 'member'),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000003', 'member'),
  ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000004', 'admin'),
  ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000002', 'member')
ON CONFLICT (squad_id, user_id) DO NOTHING;

-- Goals
INSERT INTO goals (id, squad_id, title, description, target_value, unit, workout_types, starts_at, ends_at, status, created_by) VALUES
  ('00000000-0000-0000-0002-000000000001',
   '00000000-0000-0000-0001-000000000001',
   'Run 300km in January',
   'As a squad, cover 300km of running in January.',
   300, 'km', ARRAY['run','hike'],
   '2026-01-01T00:00:00Z', '2026-01-31T23:59:59Z',
   'active',
   '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0002-000000000002',
   '00000000-0000-0000-0001-000000000002',
   'Cycle 500km this month',
   'Combine our rides to hit 500km.',
   500, 'km', ARRAY['cycle'],
   '2026-01-01T00:00:00Z', '2026-01-31T23:59:59Z',
   'active',
   '00000000-0000-0000-0000-000000000004')
ON CONFLICT DO NOTHING;

-- Workouts
INSERT INTO workouts (id, user_id, squad_id, goal_id, type, title, distance_km, duration_minutes, calories, notes, logged_at) VALUES
  ('00000000-0000-0000-0003-000000000001',
   '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0001-000000000001',
   '00000000-0000-0000-0002-000000000001',
   'run', 'Early morning 10k', 10.2, 56, 620,
   'Felt strong today. New PB for this route! 🔥',
   '2026-01-15T06:30:00Z'),
  ('00000000-0000-0000-0003-000000000002',
   '00000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0001-000000000001',
   '00000000-0000-0000-0002-000000000001',
   'run', 'Lunch run', 8.5, 44, 510, NULL,
   '2026-01-15T12:15:00Z'),
  ('00000000-0000-0000-0003-000000000003',
   '00000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0001-000000000001',
   '00000000-0000-0000-0002-000000000001',
   'run', 'First 5k!', 5.1, 38, 310,
   'Did it! First 5k ever. Legs are jelly 😅',
   '2026-01-15T18:00:00Z'),
  ('00000000-0000-0000-0003-000000000004',
   '00000000-0000-0000-0000-000000000004',
   '00000000-0000-0000-0001-000000000002',
   '00000000-0000-0000-0002-000000000002',
   'cycle', 'Mountain trail ride', 42.3, 130, 890,
   'Brutal climb but worth the view.',
   '2026-01-15T09:00:00Z')
ON CONFLICT DO NOTHING;

-- Activity Feed
INSERT INTO activity_feed (squad_id, user_id, kind, payload, created_at) VALUES
  ('00000000-0000-0000-0001-000000000001',
   '00000000-0000-0000-0000-000000000001',
   'goal_set',
   '{"goal_id": "00000000-0000-0000-0002-000000000001", "goal_title": "Run 300km in January"}',
   '2026-01-01T08:00:00Z'),
  ('00000000-0000-0000-0001-000000000001',
   '00000000-0000-0000-0000-000000000003',
   'joined', '{}',
   '2026-01-10T14:00:00Z'),
  ('00000000-0000-0000-0001-000000000001',
   '00000000-0000-0000-0000-000000000001',
   'workout',
   '{"workout_id": "00000000-0000-0000-0003-000000000001", "type": "run", "distance_km": 10.2}',
   '2026-01-15T06:31:00Z'),
  ('00000000-0000-0000-0001-000000000001',
   '00000000-0000-0000-0000-000000000002',
   'workout',
   '{"workout_id": "00000000-0000-0000-0003-000000000002", "type": "run", "distance_km": 8.5}',
   '2026-01-15T12:16:00Z');

-- Sample Badges
INSERT INTO badges (key, name, description, icon, condition_value, condition_unit) VALUES
  ('first_run', 'First Run', 'Logged your first run', '🏃', 1, 'sessions'),
  ('streak_7', '7-Day Streak', '7 consecutive active days', '🔥', 7, 'sessions'),
  ('km_100', '100km Club', 'Ran a cumulative 100km', '💯', 100, 'km'),
  ('goal_crusher', 'Goal Crusher', 'Completed a squad goal', '🏆', 1, 'sessions'),
  ('social_butterfly', 'Social Butterfly', 'Member of 3+ squads', '🦋', 3, 'sessions'),
  ('speed_demon', 'Speed Demon', 'Ran faster than 5:00/km', '⚡', 5, 'sessions')
ON CONFLICT (key) DO NOTHING;

-- Sample Notifications
INSERT INTO notifications (user_id, kind, title, body, data) VALUES
  ('00000000-0000-0000-0000-000000000001',
   'workout_logged',
   'Maya logged a run! 🏃',
   'Maya Patel just logged 8.5km. Your squad is at 23.8km total.',
   '{"squad_id": "00000000-0000-0000-0001-000000000001"}'),
  ('00000000-0000-0000-0000-000000000001',
   'member_joined',
   'Jordan joined Morning Warriors!',
   'Welcome Jordan Lee to your squad. The crew is growing!',
   '{"squad_id": "00000000-0000-0000-0001-000000000001"}');
