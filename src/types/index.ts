// ─────────────────────────────────────────────────────────────
// Core domain types for Squad Goals
// ─────────────────────────────────────────────────────────────

export type FitnessLevel = "beginner" | "intermediate" | "advanced";

// ─── Route / GPS ──────────────────────────────────────────────

export interface RouteCoord {
  latitude: number;
  longitude: number;
  timestamp?: number;
}
export type WorkoutType =
  | "run"
  | "cycle"
  | "swim"
  | "strength"
  | "yoga"
  | "hike"
  | "other";
export type DistanceUnit = "km" | "miles";
export type GoalUnit = "km" | "miles" | "hours" | "sessions" | "calories";
export type GoalStatus = "active" | "completed" | "expired";
export type SquadRole = "owner" | "admin" | "member";
export type NotificationKind =
  | "workout_logged"
  | "goal_achieved"
  | "streak_at_risk"
  | "member_joined"
  | "squad_invite"
  | "milestone";

// ─── User ───────────────────────────────────────────────────

export interface User {
  id: string;
  clerk_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  fitness_level: FitnessLevel | null;
  bio: string | null;
  push_token: string | null;
  preferred_units: DistanceUnit | null;
  default_workout_type: WorkoutType | null;
  share_workouts_to_squad: boolean | null;
  show_in_leaderboards: boolean | null;
  notify_daily_reminder: boolean | null;
  notify_daily_hour: number | null;
  notify_squad_activity: boolean | null;
  created_at: string;
  updated_at: string;
}

// ─── Squad ──────────────────────────────────────────────────

export interface Squad {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  avatar_url: string | null;
  owner_id: string;
  max_members: number; // 3–6
  created_at: string;
  updated_at: string;
  // Joined fields
  member_count?: number;
  members?: SquadMember[];
  active_goal?: Goal | null;
}

export interface SquadMember {
  id: string;
  squad_id: string;
  user_id: string;
  role: SquadRole;
  joined_at: string;
  // Joined
  user?: User;
  contribution?: number; // computed total for active goal
}

// ─── Goal ───────────────────────────────────────────────────

export interface Goal {
  id: string;
  squad_id: string;
  title: string;
  description: string | null;
  target_value: number;
  unit: GoalUnit;
  workout_types: WorkoutType[]; // which workout types count toward this goal
  starts_at: string;
  ends_at: string;
  status: GoalStatus;
  created_by: string;
  created_at: string;
  // Computed
  current_value?: number;
  progress_percent?: number;
}

// ─── Workout ─────────────────────────────────────────────────

export interface Workout {
  id: string;
  user_id: string;
  squad_id: string | null;
  goal_id: string | null;
  type: WorkoutType;
  title: string | null;
  distance_km: number | null;
  duration_minutes: number | null;
  calories: number | null;
  photo_url: string | null;
  steps: number | null;
  route_coords: RouteCoord[] | null;
  notes: string | null;
  logged_at: string;
  created_at: string;
  // Joined
  user?: User;
}

// ─── Activity Feed ───────────────────────────────────────────

export interface ActivityItem {
  id: string;
  squad_id: string;
  user_id: string;
  kind: "workout" | "achievement" | "joined" | "goal_set";
  payload: Record<string, unknown>;
  created_at: string;
  // Joined
  user?: User;
  workout?: Workout;
}

// ─── Notification ────────────────────────────────────────────

export interface AppNotification {
  id: string;
  user_id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

// ─── Workout Social ─────────────────────────────────────────

export interface WorkoutComment {
  id: string;
  workout_id: string;
  user_id: string;
  body: string;
  created_at: string;
  // Joined
  user?: User;
}

export interface WorkoutLike {
  id: string;
  workout_id: string;
  user_id: string;
  created_at: string;
}

// ─── Live Squad Location ─────────────────────────────────────

export interface LiveLocation {
  id: string;
  user_id: string;
  squad_id: string;
  workout_id: string | null;
  lat: number;
  lon: number;
  heading: number | null;
  speed_mps: number | null;
  updated_at: string;
  // Joined
  user?: User;
}

// ─── Badge / Achievement ─────────────────────────────────────

export interface Badge {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string; // emoji or icon name
  condition_value: number;
  condition_unit: GoalUnit;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}

// ─── Streak ──────────────────────────────────────────────────

export interface SquadStreak {
  squad_id: string;
  current_streak: number; // consecutive days squad collectively logged
  longest_streak: number;
  last_active_date: string;
}

// ─── UI helpers ──────────────────────────────────────────────

export interface SelectOption {
  label: string;
  value: string;
}

export type LoadingState = "idle" | "loading" | "success" | "error";
