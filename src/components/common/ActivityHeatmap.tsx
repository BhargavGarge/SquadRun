// ─────────────────────────────────────────────────────────────
// Activity heatmap — 52-week calendar with intensity color coding
// Shows historical workout activity at a glance
// ─────────────────────────────────────────────────────────────

import React from "react";
import { View } from "react-native";
import { WeeklyHeatMap } from "@symbiot.dev/react-native-heatmap";
import { useTheme } from "../../contexts/ThemeContext";
import { spacing } from "../../theme/spacing";
import { subDays, eachDayOfInterval, format } from "date-fns";
import type { Workout } from "../../types";

interface DayStats {
  date: Date;
  workoutCount: number;
  totalKm: number;
}

export interface HeatmapData {
  dates: Record<string, number>;
}

export type HeatmapPeriod = "today" | "week" | "month" | "year";

/**
 * Compute heatmap stats for the selected period based on real workouts.
 *
 * today  -> last 7 days (including today)
 * week   -> last 7 days
 * month  -> last 30 days
 * year   -> last 52 weeks (approx 365 days)
 */
export function computeHeatmapData(
  workouts: Workout[],
  period: HeatmapPeriod = "year",
): HeatmapData {
  const now = new Date();

  let startDate: Date;
  switch (period) {
    case "today":
      // show a short recent window around today
      startDate = subDays(now, 6); // last 7 days
      break;
    case "week":
      startDate = subDays(now, 6); // last 7 days
      break;
    case "month":
      startDate = subDays(now, 29); // last 30 days
      break;
    case "year":
    default:
      startDate = subDays(now, 364); // last 52 weeks
      break;
  }
  const endDate = now;

  const dayMap = new Map<string, DayStats>();

  // Initialize all days in the range
  const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
  for (const date of dateRange) {
    const key = format(date, "yyyy-MM-dd");
    dayMap.set(key, {
      date,
      workoutCount: 0,
      totalKm: 0,
    });
  }

  // Aggregate workouts into days
  for (const w of workouts) {
    const loggedAt = new Date(w.logged_at);
    if (loggedAt >= startDate && loggedAt <= endDate) {
      const key = format(loggedAt, "yyyy-MM-dd");
      const day = dayMap.get(key);
      if (day) {
        day.workoutCount += 1;
        day.totalKm += w.distance_km ?? 0;
      }
    }
  }

  const dates: Record<string, number> = {};
  for (const [key, day] of dayMap.entries()) {
    if (day.totalKm > 0) {
      dates[key] = day.totalKm;
    }
  }

  return { dates };
}

interface ActivityHeatmapProps {
  data: HeatmapData;
}

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const { theme } = useTheme();

  return (
    <View
      style={{ paddingHorizontal: spacing[2], paddingVertical: spacing[2] }}
    >
      <WeeklyHeatMap
        data={data.dates}
        theme={{
          scheme: "dark",
          cellDefaultColor: theme.colors.surface_container,
          cellColor: {
            1: `${theme.colors.primary}33`,
            2: `${theme.colors.primary}66`,
            3: `${theme.colors.primary}99`,
            4: theme.colors.primary,
          },
          headerTextColor: theme.colors.on_surface_variant,
          sidebarTextColor: theme.colors.on_surface_variant,
          cellTextColor: theme.colors.on_surface,
        }}
        dimensions={{
          cellSize: 14,
          cellRadius: 4,
          cellGap: 2,
          headerTextFontSize: 10,
          sidebarTextFontSize: 10,
        }}
        controller={{
          pressable: false,
          scrollable: true,
          isHeaderVisible: true,
          isSidebarVisible: true,
          isCellTextVisible: false,
        }}
      />
    </View>
  );
}
