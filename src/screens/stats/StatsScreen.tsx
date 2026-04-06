// ─────────────────────────────────────────────────────────────
// StatsScreen — Display historical stats and achievements
// Shows stats by time period: Today, Week, Month, Year
// ─────────────────────────────────────────────────────────────

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuthContext } from "../../contexts/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSquadStore } from "../../contexts/SquadContext";
import { workoutsApi } from "../../services/supabase";
import { textStyles } from "../../theme/typography";
import { spacing } from "../../theme/spacing";
import GlassCard from "../../components/common/GlassCard";
import {
  ActivityHeatmap,
  computeHeatmapData,
  type HeatmapData,
  type HeatmapPeriod,
} from "../../components/common/ActivityHeatmap";
import StatCard from "../../components/common/StatCard";
import {
  getTodayStats,
  getWeekStats,
  getMonthStats,
  getYearStats,
  formatPace,
  formatDurationMinutes,
  type StatsPeriod,
} from "../../utils/statsHelpers";
import type { Workout } from "../../types";

export default function StatsScreen() {
  const { theme } = useTheme();
  const { dbUser } = useAuthContext();
  const navigation = useNavigation<any>();
  const { workouts } = useSquadStore();

  const [stats, setStats] = useState<{
    today: StatsPeriod;
    week: StatsPeriod;
    month: StatsPeriod;
    year: StatsPeriod;
  } | null>(null);
  const [dailyActivity, setDailyActivity] = useState<HeatmapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<HeatmapPeriod>("week");

  useEffect(() => {
    calculateStats(selectedPeriod);
  }, [workouts, selectedPeriod]);

  const calculateStats = async (period: HeatmapPeriod) => {
    try {
      setIsLoading(true);
      const allWorkouts = (workouts as Workout[]) || [];

      const todayStats = getTodayStats(allWorkouts);
      const weekStats = getWeekStats(allWorkouts);
      const monthStats = getMonthStats(allWorkouts);
      const yearStats = getYearStats(allWorkouts);

      setStats({
        today: todayStats,
        week: weekStats,
        month: monthStats,
        year: yearStats,
      });

      // Heatmap should reflect the currently selected period
      const heatmap = computeHeatmapData(allWorkouts, period);
      setDailyActivity(heatmap);
    } catch (err) {
      console.error("[Stats] Error calculating stats:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !stats) {
    return (
      <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={{ flex: 1, justifyContent: "center" }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </SafeAreaView>
      </View>
    );
  }

  const currentStats = stats[selectedPeriod];
  const periodLabel =
    selectedPeriod === "today"
      ? "TODAY"
      : selectedPeriod === "week"
        ? "THIS WEEK"
        : selectedPeriod === "month"
          ? "THIS MONTH"
          : "THIS YEAR";

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header with back button */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons
                name="chevron-back"
                size={28}
                color={theme.colors.on_surface}
              />
            </TouchableOpacity>
            <Text
              style={[
                textStyles.headlineMd,
                {
                  color: theme.colors.on_surface,
                  flex: 1,
                  textAlign: "center",
                },
              ]}
            >
              Statistics
            </Text>
            <View style={{ width: 28 }} />
          </View>

          {/* Period selector tabs */}
          <View style={styles.periodTabs}>
            {(["today", "week", "month", "year"] as const).map((period) => (
              <TouchableOpacity
                key={period}
                onPress={() => setSelectedPeriod(period)}
                style={[
                  styles.tab,
                  {
                    backgroundColor:
                      selectedPeriod === period
                        ? theme.colors.primary
                        : theme.colors.surface_container,
                  },
                ]}
              >
                <Text
                  style={[
                    textStyles.labelSm,
                    {
                      color:
                        selectedPeriod === period
                          ? "black"
                          : theme.colors.on_surface,
                    },
                  ]}
                >
                  {period === "today"
                    ? "Today"
                    : period === "week"
                      ? "Week"
                      : period === "month"
                        ? "Month"
                        : "Year"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Stats cards */}
          <View style={styles.statsGrid}>
            <StatCard
              label="Distance"
              value={`${currentStats.distance_km.toFixed(1)} km`}
              theme={theme}
            />
            <StatCard
              label="Duration"
              value={formatDurationMinutes(currentStats.duration_minutes)}
              theme={theme}
            />
            <StatCard
              label="Workouts"
              value={String(currentStats.workouts)}
              theme={theme}
            />
            <StatCard
              label="Calories"
              value={`${Math.round(currentStats.calories)} kcal`}
              theme={theme}
            />
            {currentStats.avg_pace_min_per_km > 0 && (
              <StatCard
                label="Avg Pace"
                value={formatPace(currentStats.avg_pace_min_per_km)}
                theme={theme}
              />
            )}
            {currentStats.best_pace_min_per_km > 0 && (
              <StatCard
                label="Best Pace"
                value={formatPace(currentStats.best_pace_min_per_km)}
                theme={theme}
              />
            )}
          </View>

          {/* Type breakdown */}
          {/* {currentStats.workouts > 0 && (
            <View>
              <Text
                style={[
                  textStyles.labelMd,
                  {
                    color: theme.colors.on_surface_variant,
                    marginBottom: spacing[3],
                  },
                ]}
              >
                BY TYPE
              </Text>
              <View style={{ gap: spacing[2] }}>
                {(
                  Object.entries(currentStats.type_breakdown) as Array<
                    [string, number]
                  >
                )
                  .filter(([, count]) => count > 0)
                  .map(([type, count]) => (
                    <View
                      key={type}
                      style={[
                        styles.typeRow,
                        { backgroundColor: theme.colors.surface_container },
                      ]}
                    >
                      <Text
                        style={[
                          textStyles.bodyMd,
                          { color: theme.colors.on_surface, flex: 1 },
                        ]}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                      <Text
                        style={[
                          textStyles.titleMd,
                          { color: theme.colors.primary },
                        ]}
                      >
                        {count}
                      </Text>
                    </View>
                  ))}
              </View>
            </View>
          )} */}

          {/* Activity graph for selected period */}
          {dailyActivity && (
            <View>
              <Text
                style={[
                  textStyles.labelMd,
                  {
                    color: theme.colors.on_surface_variant,
                    marginBottom: spacing[3],
                    marginTop: spacing[6],
                  },
                ]}
              >
                {periodLabel} ACTIVITY HEATMAP
              </Text>
              <GlassCard>
                <ActivityHeatmap data={dailyActivity} />
              </GlassCard>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    gap: spacing[4],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing[4],
  },
  periodTabs: {
    flexDirection: "row",
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  tab: {
    flex: 1,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  statCard: {
    flex: 1,
    minWidth: "48%",
  },
  typeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 8,
  },
});
