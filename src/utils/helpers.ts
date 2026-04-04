// ─────────────────────────────────────────────────────────────
// App utility helpers
// ─────────────────────────────────────────────────────────────

import { differenceInDays } from 'date-fns';
import type { GoalUnit } from '../types';

/** Returns a time-based greeting string */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** Format a numeric value with its unit label */
export function formatValue(value: number, unit: GoalUnit): string {
  switch (unit) {
    case 'km':
      return `${value.toFixed(1)} km`;
    case 'miles':
      return `${value.toFixed(1)} mi`;
    case 'hours':
      return `${value.toFixed(1)} hrs`;
    case 'sessions':
      return `${Math.round(value)} sessions`;
    case 'calories':
      return `${Math.round(value)} kcal`;
    default:
      return `${value}`;
  }
}

/** Format duration in minutes to a readable string */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/** How many days remain until a date string */
export function getDaysLeft(endsAt: string): number {
  const end = new Date(endsAt);
  const now = new Date();
  const diff = differenceInDays(end, now);
  return Math.max(0, diff);
}

/** Generate a random alphanumeric squad invite code */
export function generateInviteCode(length = 6): string {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length)
    .toUpperCase();
}

/** Truncate text to n characters */
export function truncate(str: string, n: number): string {
  if (str.length <= n) return str;
  return str.substring(0, n - 1) + '…';
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Format a pace (min per km) */
export function formatPace(distanceKm: number, durationMin: number): string {
  if (!distanceKm || distanceKm === 0) return '–';
  const paceMin = durationMin / distanceKm;
  const paceMinInt = Math.floor(paceMin);
  const paceSec = Math.round((paceMin - paceMinInt) * 60);
  return `${paceMinInt}:${paceSec.toString().padStart(2, '0')} /km`;
}

/** Map a workout type to a human-readable label */
export const WORKOUT_LABELS: Record<string, string> = {
  run: 'Run',
  cycle: 'Cycle',
  swim: 'Swim',
  strength: 'Strength',
  yoga: 'Yoga',
  hike: 'Hike',
  other: 'Workout',
};
