// ─────────────────────────────────────────────────────────────
// challengeRotation.ts
// Rotating weekly squad challenges — 9-challenge pool, 3 active per ISO week.
// Each challenge is computed purely from the weekly workout slice.
// ─────────────────────────────────────────────────────────────

import { getISOWeek } from 'date-fns';
import type { Workout } from '../types';

// ── Types ─────────────────────────────────────────────────────

export type ChallengeId =
  | 'most_distance'
  | 'most_workouts'
  | 'longest_run'
  | 'most_calories'
  | 'top_speed'
  | 'most_variety'
  | 'consistency'
  | 'longest_session'
  | 'total_duration';

export type ChallengeDefinition = {
  id: ChallengeId;
  title: string;
  subtitle: string;
  unit: string;
  precision: number;
  icon: string; // Ionicons name
};

export type ChallengeEntry = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  value: number;
};

// ── Challenge pool (9 total, groups of 3 rotate weekly) ──────

const CHALLENGE_POOL: ChallengeDefinition[] = [
  // Group A — week % 3 === 0
  {
    id: 'most_distance',
    title: 'Most distance',
    subtitle: 'Total km logged this week',
    unit: 'km',
    precision: 1,
    icon: 'navigate-outline',
  },
  {
    id: 'most_workouts',
    title: 'Most workouts',
    subtitle: 'Completed sessions this week',
    unit: 'sessions',
    precision: 0,
    icon: 'flash-outline',
  },
  {
    id: 'longest_run',
    title: 'Longest single activity',
    subtitle: 'Best one-off distance this week',
    unit: 'km',
    precision: 2,
    icon: 'trending-up-outline',
  },
  // Group B — week % 3 === 1
  {
    id: 'most_calories',
    title: 'Most calories burned',
    subtitle: 'Total kcal logged this week',
    unit: 'kcal',
    precision: 0,
    icon: 'flame-outline',
  },
  {
    id: 'top_speed',
    title: 'Top speed',
    subtitle: 'Highest avg km/h in a single workout',
    unit: 'km/h',
    precision: 1,
    icon: 'speedometer-outline',
  },
  {
    id: 'most_variety',
    title: 'Most variety',
    subtitle: 'Different workout types this week',
    unit: 'types',
    precision: 0,
    icon: 'shuffle-outline',
  },
  // Group C — week % 3 === 2
  {
    id: 'consistency',
    title: 'Most consistent',
    subtitle: 'Days with at least one workout',
    unit: 'days',
    precision: 0,
    icon: 'calendar-outline',
  },
  {
    id: 'longest_session',
    title: 'Longest session',
    subtitle: 'Single longest workout this week',
    unit: 'min',
    precision: 0,
    icon: 'time-outline',
  },
  {
    id: 'total_duration',
    title: 'Total time',
    subtitle: 'Combined workout minutes this week',
    unit: 'min',
    precision: 0,
    icon: 'stopwatch-outline',
  },
];

// ── Rotation logic ────────────────────────────────────────────

/** Returns the 3 challenge definitions active for a given date's ISO week. */
export function getCurrentWeekChallenges(date: Date = new Date()): ChallengeDefinition[] {
  const week = getISOWeek(date);
  const groupIndex = week % 3; // 0, 1, or 2
  const offset = groupIndex * 3;
  return [
    CHALLENGE_POOL[offset],
    CHALLENGE_POOL[offset + 1],
    CHALLENGE_POOL[offset + 2],
  ];
}

/** ISO week number for a given date — exported for the "Week X" label. */
export function getWeekNumber(date: Date = new Date()): number {
  return getISOWeek(date);
}

// ── Per-member stats builder ──────────────────────────────────

type MemberStats = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  distanceKm: number;
  workoutsCount: number;
  longestRunKm: number;
  totalCalories: number;
  topSpeedKmh: number;
  workoutTypes: Set<string>;
  activeDays: Set<string>;
  longestSessionMin: number;
  totalDurationMin: number;
};

function buildMemberStats(weeklyWorkouts: Workout[]): Record<string, MemberStats> {
  const map: Record<string, MemberStats> = {};

  for (const w of weeklyWorkouts) {
    const uid = w.user_id;
    if (!map[uid]) {
      map[uid] = {
        userId: uid,
        name: w.user?.display_name ?? 'Squad member',
        avatarUrl: w.user?.avatar_url ?? null,
        distanceKm: 0,
        workoutsCount: 0,
        longestRunKm: 0,
        totalCalories: 0,
        topSpeedKmh: 0,
        workoutTypes: new Set(),
        activeDays: new Set(),
        longestSessionMin: 0,
        totalDurationMin: 0,
      };
    }

    const s = map[uid];
    s.workoutsCount += 1;

    const dist = w.distance_km ?? 0;
    const dur = w.duration_minutes ?? 0;
    const cal = w.calories ?? 0;

    s.distanceKm += dist;
    s.totalCalories += cal;
    s.totalDurationMin += dur;

    if (dist > s.longestRunKm) s.longestRunKm = dist;
    if (dur > s.longestSessionMin) s.longestSessionMin = dur;

    if (w.type) s.workoutTypes.add(w.type);

    // Day key — just date portion of logged_at
    const dayKey = new Date(w.logged_at).toISOString().slice(0, 10);
    s.activeDays.add(dayKey);

    // Speed: only if both dist and dur are meaningful
    if (dist > 0 && dur > 0) {
      const speedKmh = dist / (dur / 60);
      if (speedKmh > s.topSpeedKmh) s.topSpeedKmh = speedKmh;
    }
  }

  return map;
}

/** Computes sorted leaderboard entries for a given challenge from weekly workouts. */
export function computeChallengeEntries(
  weeklyWorkouts: Workout[],
  challengeId: ChallengeId,
): ChallengeEntry[] {
  const stats = buildMemberStats(weeklyWorkouts);
  const members = Object.values(stats);

  let getValue: (s: MemberStats) => number;

  switch (challengeId) {
    case 'most_distance':
      getValue = (s) => s.distanceKm;
      break;
    case 'most_workouts':
      getValue = (s) => s.workoutsCount;
      break;
    case 'longest_run':
      getValue = (s) => s.longestRunKm;
      break;
    case 'most_calories':
      getValue = (s) => s.totalCalories;
      break;
    case 'top_speed':
      getValue = (s) => s.topSpeedKmh;
      break;
    case 'most_variety':
      getValue = (s) => s.workoutTypes.size;
      break;
    case 'consistency':
      getValue = (s) => s.activeDays.size;
      break;
    case 'longest_session':
      getValue = (s) => s.longestSessionMin;
      break;
    case 'total_duration':
      getValue = (s) => s.totalDurationMin;
      break;
  }

  return members
    .map((s) => ({
      userId: s.userId,
      name: s.name,
      avatarUrl: s.avatarUrl,
      value: getValue(s),
    }))
    .filter((e) => e.value > 0)
    .sort((a, b) => b.value - a.value);
}
