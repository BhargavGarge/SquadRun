// ─────────────────────────────────────────────────────────────
// Stats aggregation — compute summary statistics by time period
// ─────────────────────────────────────────────────────────────

import type { Workout } from "../types";
import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  endOfDay,
  endOfWeek,
  endOfMonth,
  endOfYear,
} from "date-fns";

export interface TimeRangeStats {
  totalKm: number;
  totalMinutes: number;
  workoutCount: number;
  avgPaceMinPerKm: number | null;
  maxPaceMinPerKm: number | null;
  minPaceMinPerKm: number | null;
  totalCalories: number;
  workoutsByType: Record<string, number>;
}

export interface StatsPeriod {
  label: string;
  startDate: Date;
  endDate: Date;
  stats: TimeRangeStats;
}

/**
 * Compute stats for workouts within a date range
 */
export function computeRangeStats(workouts: Workout[]): TimeRangeStats {
  if (workouts.length === 0) {
    return {
      totalKm: 0,
      totalMinutes: 0,
      workoutCount: 0,
      avgPaceMinPerKm: null,
      maxPaceMinPerKm: null,
      minPaceMinPerKm: null,
      totalCalories: 0,
      workoutsByType: {},
    };
  }

  let totalKm = 0;
  let totalMinutes = 0;
  let totalCalories = 0;
  let paces: number[] = [];
  const workoutsByType: Record<string, number> = {};

  for (const w of workouts) {
    if (w.distance_km) totalKm += w.distance_km;
    if (w.duration_minutes) totalMinutes += w.duration_minutes;
    if (w.calories) totalCalories += w.calories;

    // Track type distribution
    workoutsByType[w.type] = (workoutsByType[w.type] ?? 0) + 1;

    // Calculate pace if we have distance and duration
    if (
      w.distance_km &&
      w.distance_km > 0 &&
      w.duration_minutes &&
      w.duration_minutes > 0
    ) {
      const paceMinPerKm = w.duration_minutes / w.distance_km;
      paces.push(paceMinPerKm);
    }
  }

  const avgPaceMinPerKm =
    paces.length > 0 ? paces.reduce((a, b) => a + b, 0) / paces.length : null;
  const maxPaceMinPerKm = paces.length > 0 ? Math.max(...paces) : null;
  const minPaceMinPerKm = paces.length > 0 ? Math.min(...paces) : null;

  return {
    totalKm: Math.round(totalKm * 100) / 100,
    totalMinutes: Math.round(totalMinutes),
    workoutCount: workouts.length,
    avgPaceMinPerKm: avgPaceMinPerKm
      ? Math.round(avgPaceMinPerKm * 100) / 100
      : null,
    maxPaceMinPerKm: maxPaceMinPerKm
      ? Math.round(maxPaceMinPerKm * 100) / 100
      : null,
    minPaceMinPerKm: minPaceMinPerKm
      ? Math.round(minPaceMinPerKm * 100) / 100
      : null,
    totalCalories: Math.round(totalCalories),
    workoutsByType,
  };
}

/**
 * Filter workouts by date range
 */
export function filterByDateRange(
  workouts: Workout[],
  startDate: Date,
  endDate: Date,
): Workout[] {
  return workouts.filter((w) => {
    const d = new Date(w.logged_at);
    return d >= startDate && d <= endDate;
  });
}

/**
 * Get stats for multiple time periods (today, this week, this month, this year)
 */
export function getTimePeriodStats(workouts: Workout[]): StatsPeriod[] {
  const now = new Date();

  const periods: StatsPeriod[] = [
    {
      label: "Today",
      startDate: startOfDay(now),
      endDate: endOfDay(now),
      stats: computeRangeStats([]),
    },
    {
      label: "This Week",
      startDate: startOfWeek(now, { weekStartsOn: 1 }),
      endDate: endOfWeek(now, { weekStartsOn: 1 }),
      stats: computeRangeStats([]),
    },
    {
      label: "This Month",
      startDate: startOfMonth(now),
      endDate: endOfMonth(now),
      stats: computeRangeStats([]),
    },
    {
      label: "This Year",
      startDate: startOfYear(now),
      endDate: endOfYear(now),
      stats: computeRangeStats([]),
    },
  ];

  // Fill in stats for each period
  for (const period of periods) {
    const periodWorkouts = filterByDateRange(
      workouts,
      period.startDate,
      period.endDate,
    );
    period.stats = computeRangeStats(periodWorkouts);
  }

  return periods;
}

/**
 * Format duration as human-readable string
 */
export function formatDurationHours(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}m`;
}

/**
 * Format pace for display
 */
export function formatPace(
  paceMinPerKm: number | null,
  type: string = "run",
): string {
  if (!paceMinPerKm) return "--";

  if (type === "cycle" || type === "swim") {
    const speedKmh = 60 / paceMinPerKm;
    return `${speedKmh.toFixed(1)} km/h`;
  }

  const min = Math.floor(paceMinPerKm);
  const sec = Math.round((paceMinPerKm % 1) * 60);
  return `${min}:${String(sec).padStart(2, "0")}/km`;
}

// ─── New functions for StatsScreen ───────────────────────────────

export interface StatsPeriod {
  distance_km: number;
  duration_minutes: number;
  workouts: number;
  calories: number;
  avg_pace_min_per_km: number;
  best_pace_min_per_km: number;
  type_breakdown: Record<string, number>;
}

export const EMPTY_STATS: StatsPeriod = {
  distance_km: 0,
  duration_minutes: 0,
  workouts: 0,
  calories: 0,
  avg_pace_min_per_km: 0,
  best_pace_min_per_km: 0,
  type_breakdown: {
    run: 0,
    cycle: 0,
    swim: 0,
    strength: 0,
    yoga: 0,
    hike: 0,
    other: 0,
  },
};

/**
 * Calculate stats for a given time period
 */
export function calculateStats(workouts: Workout[]): StatsPeriod {
  if (workouts.length === 0) return EMPTY_STATS;

  const stats = { ...EMPTY_STATS };

  let totalPaceSeconds = 0;
  let paceCount = 0;
  let bestPaceSeconds = Infinity;

  for (const w of workouts) {
    const distance = w.distance_km ?? 0;
    const duration = w.duration_minutes ?? 0;

    stats.distance_km += distance;
    stats.duration_minutes += duration;
    stats.calories += w.calories ?? 0;
    stats.workouts += 1;

    // Track type breakdown
    const type = (w.type as string) ?? "other";
    stats.type_breakdown[type] = (stats.type_breakdown[type] ?? 0) + 1;

    // Calculate pace (min/km) for runs/hikes
    if ((type === "run" || type === "hike") && distance > 0 && duration > 0) {
      const paceSeconds = (duration * 60) / distance;
      totalPaceSeconds += paceSeconds;
      paceCount += 1;

      if (paceSeconds < bestPaceSeconds) {
        bestPaceSeconds = paceSeconds;
      }
    }
  }

  // Convert pace from seconds/km to min/km
  if (paceCount > 0) {
    stats.avg_pace_min_per_km = totalPaceSeconds / paceCount / 60;
    stats.best_pace_min_per_km = bestPaceSeconds / 60;
  }

  return stats;
}

/**
 * Get stats for today
 */
export function getTodayStats(workouts: Workout[]): StatsPeriod {
  const start = startOfDay(new Date());
  const end = endOfDay(new Date());
  const filtered = filterByDateRange(workouts, start, end);
  return calculateStats(filtered);
}

/**
 * Get stats for this week (Monday to today)
 */
export function getWeekStats(workouts: Workout[]): StatsPeriod {
  const start = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
  const end = endOfDay(new Date());
  const filtered = filterByDateRange(workouts, start, end);
  return calculateStats(filtered);
}

/**
 * Get stats for this month (1st to today)
 */
export function getMonthStats(workouts: Workout[]): StatsPeriod {
  const start = startOfMonth(new Date());
  const end = endOfDay(new Date());
  const filtered = filterByDateRange(workouts, start, end);
  return calculateStats(filtered);
}

/**
 * Get stats for this year (Jan 1 to today)
 */
export function getYearStats(workouts: Workout[]): StatsPeriod {
  const start = startOfYear(new Date());
  const end = endOfDay(new Date());
  const filtered = filterByDateRange(workouts, start, end);
  return calculateStats(filtered);
}

/**
 * Format duration (minutes) as readable string
 */
export function formatDurationMinutes(minutes: number): string {
  if (!minutes || minutes <= 0) return "0m";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${Math.round(mins)}m`;
  }
  return `${Math.round(mins)}m`;
}

/**
 * Calculate daily activity for heatmap (km per day)
 */
export interface DailyActivity {
  date: Date;
  distance_km: number;
}

export function getDailyActivity(workouts: Workout[]): DailyActivity[] {
  const dailyMap = new Map<string, number>();

  for (const w of workouts) {
    const date = new Date(w.logged_at);
    const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD

    const current = dailyMap.get(dateStr) ?? 0;
    dailyMap.set(dateStr, current + (w.distance_km ?? 0));
  }

  const activities: DailyActivity[] = [];
  dailyMap.forEach((distance_km, dateStr) => {
    activities.push({
      date: new Date(dateStr),
      distance_km,
    });
  });

  return activities.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Get last 52 weeks of daily activity (for heatmap)
 */
export function getLast52WeeksDailyActivity(
  workouts: Workout[],
): Array<{ date: Date; distance_km: number }> {
  const today = new Date();
  const fiftyTwoWeeksAgo = new Date(
    today.getTime() - 52 * 7 * 24 * 60 * 60 * 1000,
  );

  const filtered = filterByDateRange(workouts, fiftyTwoWeeksAgo, today);
  return getDailyActivity(filtered);
}
