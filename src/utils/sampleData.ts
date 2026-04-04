// ─────────────────────────────────────────────────────────────
// Sample data for development / testing
// Used in the Supabase seed.sql and for local previews
// ─────────────────────────────────────────────────────────────

import type { User, Squad, Goal, Workout, ActivityItem } from '../types';

export const SAMPLE_USERS: Partial<User>[] = [
  {
    id: 'user-001',
    clerk_id: 'clerk_sample_001',
    display_name: 'Alex Johnson',
    username: 'alexj',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alexj',
    fitness_level: 'intermediate',
    bio: 'Marathon enthusiast. Early riser. Coffee addict. 🏃',
  },
  {
    id: 'user-002',
    clerk_id: 'clerk_sample_002',
    display_name: 'Maya Patel',
    username: 'mayap',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mayap',
    fitness_level: 'advanced',
    bio: 'Triathlete. PhD student. I train hard, nap harder.',
  },
  {
    id: 'user-003',
    clerk_id: 'clerk_sample_003',
    display_name: 'Jordan Lee',
    username: 'jordanl',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jordanl',
    fitness_level: 'beginner',
    bio: 'Just started my fitness journey. Need all the accountability!',
  },
  {
    id: 'user-004',
    clerk_id: 'clerk_sample_004',
    display_name: 'Sam Rivera',
    username: 'samr',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=samr',
    fitness_level: 'intermediate',
    bio: 'Cyclist and hiker. Mountains are my home.',
  },
];

export const SAMPLE_SQUADS: Partial<Squad>[] = [
  {
    id: 'squad-001',
    name: '⚡ Morning Warriors',
    description: 'Up at 5am, no excuses. We run together.',
    invite_code: 'MW2024',
    owner_id: 'user-001',
    max_members: 5,
  },
  {
    id: 'squad-002',
    name: '🚴 Sunday Cyclists',
    description: 'Weekend rides and weekday accountability.',
    invite_code: 'CYCSUN',
    owner_id: 'user-004',
    max_members: 6,
  },
];

export const SAMPLE_GOALS: Partial<Goal>[] = [
  {
    id: 'goal-001',
    squad_id: 'squad-001',
    title: 'Run 300km in January',
    description: 'As a squad, cover 300km of running in January.',
    target_value: 300,
    unit: 'km',
    workout_types: ['run', 'hike'],
    starts_at: '2026-01-01T00:00:00Z',
    ends_at: '2026-01-31T23:59:59Z',
    status: 'active',
    created_by: 'user-001',
  },
  {
    id: 'goal-002',
    squad_id: 'squad-002',
    title: 'Cycle 500km this month',
    description: 'Combine our rides to hit 500km.',
    target_value: 500,
    unit: 'km',
    workout_types: ['cycle'],
    starts_at: '2026-01-01T00:00:00Z',
    ends_at: '2026-01-31T23:59:59Z',
    status: 'active',
    created_by: 'user-004',
  },
];

export const SAMPLE_WORKOUTS: Partial<Workout>[] = [
  {
    id: 'workout-001',
    user_id: 'user-001',
    squad_id: 'squad-001',
    goal_id: 'goal-001',
    type: 'run',
    title: 'Early morning 10k',
    distance_km: 10.2,
    duration_minutes: 56,
    calories: 620,
    notes: 'Felt strong today. New PB for this route! 🔥',
    logged_at: '2026-01-15T06:30:00Z',
  },
  {
    id: 'workout-002',
    user_id: 'user-002',
    squad_id: 'squad-001',
    goal_id: 'goal-001',
    type: 'run',
    title: 'Lunch run',
    distance_km: 8.5,
    duration_minutes: 44,
    calories: 510,
    notes: null,
    logged_at: '2026-01-15T12:15:00Z',
  },
  {
    id: 'workout-003',
    user_id: 'user-003',
    squad_id: 'squad-001',
    goal_id: 'goal-001',
    type: 'run',
    title: 'First 5k!',
    distance_km: 5.1,
    duration_minutes: 38,
    calories: 310,
    notes: 'Did it! First 5k ever. Legs are jelly 😅',
    logged_at: '2026-01-15T18:00:00Z',
  },
  {
    id: 'workout-004',
    user_id: 'user-004',
    squad_id: 'squad-002',
    goal_id: 'goal-002',
    type: 'cycle',
    title: 'Mountain trail ride',
    distance_km: 42.3,
    duration_minutes: 130,
    calories: 890,
    notes: 'Brutal climb but worth the view.',
    logged_at: '2026-01-15T09:00:00Z',
  },
];

export const SAMPLE_ACTIVITY: Partial<ActivityItem>[] = [
  {
    id: 'activity-001',
    squad_id: 'squad-001',
    user_id: 'user-001',
    kind: 'workout',
    payload: { workout_id: 'workout-001', type: 'run', distance_km: 10.2, duration_minutes: 56 },
    created_at: '2026-01-15T06:31:00Z',
  },
  {
    id: 'activity-002',
    squad_id: 'squad-001',
    user_id: 'user-002',
    kind: 'workout',
    payload: { workout_id: 'workout-002', type: 'run', distance_km: 8.5, duration_minutes: 44 },
    created_at: '2026-01-15T12:16:00Z',
  },
  {
    id: 'activity-003',
    squad_id: 'squad-001',
    user_id: 'user-003',
    kind: 'joined',
    payload: {},
    created_at: '2026-01-10T14:00:00Z',
  },
  {
    id: 'activity-004',
    squad_id: 'squad-001',
    user_id: 'user-001',
    kind: 'goal_set',
    payload: { goal_id: 'goal-001', goal_title: 'Run 300km in January' },
    created_at: '2026-01-01T08:00:00Z',
  },
];
