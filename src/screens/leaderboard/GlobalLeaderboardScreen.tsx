// ─────────────────────────────────────────────────────────────
// GlobalLeaderboardScreen — app-wide rankings across all users.
// Period: WEEK / MONTH / ALL TIME
// Metric: DISTANCE / WORKOUTS / TIME
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { useTheme } from "../../contexts/ThemeContext";
import { useAuthContext } from "../../contexts/AuthContext";
import { globalLeaderboardApi, type LeaderboardEntry } from "../../services/supabase";
import { textStyles } from "../../theme/typography";
import { spacing } from "../../theme/spacing";
import Avatar from "../../components/common/Avatar";
import GlassCard from "../../components/common/GlassCard";

// ── Types ─────────────────────────────────────────────────────

type Period = "week" | "month" | "all";
type Metric = "distance" | "workouts" | "time";

// ── Helpers ───────────────────────────────────────────────────

function metricValue(entry: LeaderboardEntry, metric: Metric): number {
  switch (metric) {
    case "distance": return entry.totalDistanceKm;
    case "workouts": return entry.totalWorkouts;
    case "time":     return entry.totalDurationMin;
  }
}

function formatMetric(value: number, metric: Metric): string {
  switch (metric) {
    case "distance": return `${value.toFixed(1)} km`;
    case "workouts": return `${value} sessions`;
    case "time": {
      const h = Math.floor(value / 60);
      const m = Math.round(value % 60);
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
    }
  }
}

// ── Main screen ───────────────────────────────────────────────

export default function GlobalLeaderboardScreen() {
  const { theme } = useTheme();
  const { dbUser } = useAuthContext();
  const navigation = useNavigation<any>();

  const [period, setPeriod] = useState<Period>("week");
  const [metric, setMetric] = useState<Metric>("distance");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (p: Period) => {
    try {
      const data = await globalLeaderboardApi.get(p);
      setEntries(data);
    } catch (err) {
      console.error("[GlobalLeaderboard] load:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load(period);
  }, [period]);

  const onRefresh = () => {
    setRefreshing(true);
    load(period);
  };

  // Sort by selected metric
  const sorted = [...entries].sort(
    (a, b) => metricValue(b, metric) - metricValue(a, metric),
  );

  const myIndex = dbUser?.id
    ? sorted.findIndex((e) => e.userId === dbUser.id)
    : -1;
  const myRank = myIndex >= 0 ? myIndex + 1 : null;

  // ── Render ──────────────────────────────────────────────────

  const PERIODS: { key: Period; label: string }[] = [
    { key: "week",  label: "WEEK" },
    { key: "month", label: "MONTH" },
    { key: "all",   label: "ALL TIME" },
  ];

  const METRICS: { key: Metric; label: string; icon: string }[] = [
    { key: "distance", label: "Distance", icon: "navigate-outline" },
    { key: "workouts", label: "Workouts", icon: "flash-outline" },
    { key: "time",     label: "Time",     icon: "time-outline" },
  ];

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={theme.colors.on_surface} />
          </TouchableOpacity>
          <View>
            <Text style={[textStyles.headlineSm, { color: theme.colors.on_surface }]}>
              Global Leaderboard
            </Text>
            <Text style={[textStyles.labelSm, { color: theme.colors.primary_light }]}>
              ALL RUNNERS · RANKED
            </Text>
          </View>
          <Ionicons name="trophy-outline" size={22} color={theme.colors.primary} />
        </View>

        {/* Period tabs */}
        <View style={[styles.tabRow, { borderBottomColor: theme.colors.outline + "30" }]}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[
                styles.tab,
                period === p.key && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 },
              ]}
              onPress={() => setPeriod(p.key)}
            >
              <Text
                style={[
                  textStyles.labelSm,
                  {
                    color: period === p.key
                      ? theme.colors.primary
                      : theme.colors.on_surface_variant,
                  },
                ]}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Metric pills */}
        <View style={styles.metricRow}>
          {METRICS.map((m) => (
            <TouchableOpacity
              key={m.key}
              style={[
                styles.metricPill,
                {
                  backgroundColor:
                    metric === m.key
                      ? theme.colors.primary
                      : theme.colors.surface_container,
                },
              ]}
              onPress={() => setMetric(m.key)}
            >
              <Ionicons
                name={m.icon as any}
                size={13}
                color={metric === m.key ? "#0A1400" : theme.colors.on_surface_variant}
              />
              <Text
                style={[
                  textStyles.labelSm,
                  {
                    color: metric === m.key ? "#0A1400" : theme.colors.on_surface_variant,
                    marginLeft: spacing[1],
                  },
                ]}
              >
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={theme.colors.primary} size="large" />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.primary_light}
              />
            }
          >
            {/* My position card */}
            {myRank && myIndex >= 0 && (
              <GlassCard
                elevated
                style={{
                  marginBottom: spacing[4],
                  padding: spacing[3],
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderLeftWidth: 2,
                  borderLeftColor: theme.colors.primary,
                }}
              >
                <View>
                  <Text style={[textStyles.labelSm, { color: theme.colors.primary_light }]}>
                    YOUR RANK
                  </Text>
                  <Text style={[textStyles.headlineSm, { color: theme.colors.on_surface, marginTop: 2 }]}>
                    #{myRank} globally
                  </Text>
                </View>
                <Text style={[textStyles.titleLg, { color: theme.colors.on_surface }]}>
                  {formatMetric(metricValue(sorted[myIndex], metric), metric)}
                </Text>
              </GlassCard>
            )}

            {sorted.length === 0 ? (
              <View style={styles.centered}>
                <Ionicons name="people-outline" size={40} color={theme.colors.on_surface_variant} />
                <Text style={[textStyles.bodyMd, { color: theme.colors.on_surface_variant, marginTop: spacing[3] }]}>
                  No data for this period yet.
                </Text>
              </View>
            ) : (
              sorted.map((entry, i) => (
                <LeaderboardRow
                  key={entry.userId}
                  entry={entry}
                  rank={i + 1}
                  metric={metric}
                  isMe={entry.userId === dbUser?.id}
                  theme={theme}
                />
              ))
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

// ── LeaderboardRow ────────────────────────────────────────────

function LeaderboardRow({
  entry,
  rank,
  metric,
  isMe,
  theme,
}: {
  entry: LeaderboardEntry;
  rank: number;
  metric: Metric;
  isMe: boolean;
  theme: any;
}) {
  const rankColor =
    rank === 1 ? theme.colors.primary
    : rank === 2 ? theme.colors.on_surface_variant
    : rank === 3 ? "#CD7F32"
    : theme.colors.on_surface_variant;

  return (
    <View
      style={[
        styles.row,
        {
          borderBottomColor: theme.colors.outline + "20",
          backgroundColor: isMe
            ? theme.colors.primary + "10"
            : "transparent",
        },
      ]}
    >
      {/* Rank */}
      <View
        style={[
          styles.rankBadge,
          {
            backgroundColor:
              rank <= 3 ? rankColor : theme.colors.surface_container,
          },
        ]}
      >
        <Text
          style={[
            textStyles.labelSm,
            {
              color: rank <= 3 ? (rank === 1 ? "#0A1400" : "#fff") : theme.colors.on_surface_variant,
              fontFamily: "Lexend-Bold",
            },
          ]}
        >
          {rank}
        </Text>
      </View>

      {/* Avatar + name */}
      <Avatar uri={entry.avatarUrl} name={entry.name} size={36} />
      <View style={{ flex: 1, marginLeft: spacing[2] }}>
        <Text
          style={[
            textStyles.bodyMd,
            {
              color: isMe ? theme.colors.primary : theme.colors.on_surface,
              fontFamily: isMe ? "Manrope-SemiBold" : "Manrope-Regular",
            },
          ]}
          numberOfLines={1}
        >
          {entry.name}{isMe ? " (you)" : ""}
        </Text>
      </View>

      {/* Value */}
      <Text style={[textStyles.titleMd, { color: theme.colors.on_surface }]}>
        {formatMetric(metricValue(entry, metric), metric)}
      </Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  tabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    marginHorizontal: spacing[4],
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing[3],
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  metricRow: {
    flexDirection: "row",
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  metricPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    gap: spacing[1],
  },
  list: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[10],
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    gap: spacing[2],
  },
  rankBadge: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: spacing[16],
  },
});
