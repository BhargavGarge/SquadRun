// ─────────────────────────────────────────────────────────────
// streakUtils.ts — streak + accountability calculations
// All computed client-side from the workouts array.
// ─────────────────────────────────────────────────────────────

import type { Workout } from '../types';

/** Unique set of YYYY-MM-DD strings from a workout list. */
function activeDaySet(workouts: Workout[]): Set<string> {
  const set = new Set<string>();
  for (const w of workouts) {
    set.add(new Date(w.logged_at).toISOString().slice(0, 10));
  }
  return set;
}

/**
 * Consecutive-day streak ending today or yesterday (counts even if
 * the user hasn't logged yet today — streak is still alive).
 */
export function calcStreak(workouts: Workout[]): number {
  if (workouts.length === 0) return 0;

  const days = activeDaySet(workouts);
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  const todayStr = cursor.toISOString().slice(0, 10);
  // If nothing logged today, start counting from yesterday
  if (!days.has(todayStr)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/**
 * Full days elapsed since the most recent workout.
 * Returns null if the user has never logged.
 */
export function daysSinceLast(workouts: Workout[]): number | null {
  if (workouts.length === 0) return null;
  const latest = workouts.reduce((best, w) =>
    new Date(w.logged_at) > new Date(best.logged_at) ? w : best,
  );
  const diffMs = Date.now() - new Date(latest.logged_at).getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// ── Per-member summary ────────────────────────────────────────

export type MemberStreakInfo = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  streak: number;
  daysSinceLast: number | null;
  /** Logged a workout within the last 24 h */
  isActiveToday: boolean;
  /** No workout for 2+ days */
  isAtRisk: boolean;
};

/**
 * Build streak info for every squad member given the full workouts
 * slice (already fetched for the squad — no extra API call needed).
 */
export function buildStreakInfos(
  workouts: Workout[],
  members: Array<{
    user_id: string;
    user?: { display_name?: string | null; avatar_url?: string | null } | null;
  }>,
): MemberStreakInfo[] {
  const byUser: Record<string, Workout[]> = {};
  for (const w of workouts) {
    if (!byUser[w.user_id]) byUser[w.user_id] = [];
    byUser[w.user_id].push(w);
  }

  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

  return members.map((m) => {
    const uw = byUser[m.user_id] ?? [];
    const days = daysSinceLast(uw);
    const isActiveToday = uw.some(
      (w) => new Date(w.logged_at).getTime() >= oneDayAgo,
    );
    return {
      userId: m.user_id,
      name: m.user?.display_name ?? 'Squad member',
      avatarUrl: m.user?.avatar_url ?? null,
      streak: calcStreak(uw),
      daysSinceLast: days,
      isActiveToday,
      isAtRisk: days !== null && days >= 2,
    };
  });
}

/**
 * Returns true if the user should receive an accountability nudge:
 * they haven't logged in 2+ days while at least one squadmate has
 * been active in the last 24 h.
 */
export function shouldNudge(
  myUserId: string,
  allInfos: MemberStreakInfo[],
): boolean {
  const me = allInfos.find((i) => i.userId === myUserId);
  if (!me || !me.isAtRisk) return false;
  const squadActive = allInfos.some(
    (i) => i.userId !== myUserId && i.isActiveToday,
  );
  return squadActive;
}
