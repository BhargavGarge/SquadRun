// ─────────────────────────────────────────────────────────────
// WorkoutDetailScreen — Full workout view with map + segments
// Accessed from HomeScreen activity feed or profile
// ─────────────────────────────────────────────────────────────

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";

import { useTheme } from "../../contexts/ThemeContext";
import { useAuthContext } from "../../contexts/AuthContext";
import { workoutsApi } from "../../services/supabase";
import { textStyles } from "../../theme/typography";
import { spacing } from "../../theme/spacing";
import GlassCard from "../../components/common/GlassCard";
import Avatar from "../../components/common/Avatar";
import { WorkoutMapViewer, RoutePlayback } from "../../components/map";
import {
  detectSegments,
  formatSegmentPace,
  getSegmentData,
} from "../../utils/segmentDetection";
import type { Workout } from "../../types";
import type { WorkoutSegment } from "../../utils/segmentDetection";

export default function WorkoutDetailScreen() {
  const { theme } = useTheme();
  const { dbUser } = useAuthContext();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { workoutId } = route.params ?? {};

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [segments, setSegments] = useState<WorkoutSegment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPlayback, setShowPlayback] = useState(false);

  useEffect(() => {
    loadWorkout();
  }, [workoutId]);

  const loadWorkout = async () => {
    try {
      setIsLoading(true);
      const workout = await workoutsApi.getById(workoutId);
      setWorkout(workout);

      // Auto-detect segments if route data exists
      if (workout.route_coords && workout.route_coords.length > 2) {
        let detectedSegments = detectSegments(
          workout.route_coords,
          workout.type,
        );

        // Check for PRs and save segments for future reference
        if (dbUser) {
          detectedSegments = await Promise.all(
            detectedSegments.map(async (seg) => {
              try {
                const segData = getSegmentData(workout.route_coords!, seg);
                const pr = await workoutsApi.getSegmentPR(
                  dbUser.id,
                  segData.distanceKm,
                  segData.startLat,
                  segData.startLon,
                  segData.endLat,
                  segData.endLon,
                );

                // Mark as PR if no previous record or if faster than best
                const isPR =
                  !pr || seg.paceMinPerKm < (pr.pace_min_per_km ?? Infinity);

                return { ...seg, isPR };
              } catch {
                return seg;
              }
            }),
          );

          // Save segments to DB for future PR tracking
          try {
            const segmentsToSave = detectedSegments.map((seg) =>
              getSegmentData(workout.route_coords!, seg),
            );
            await workoutsApi.saveSegments(workout.id, dbUser.id, segmentsToSave);
          } catch (err) {
            console.error("[WorkoutDetail] Error saving segments:", err);
          }
        }

        setSegments(detectedSegments);
      }
    } catch (err) {
      console.error("[WorkoutDetail] Error loading workout:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={{ flex: 1, justifyContent: "center" }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </SafeAreaView>
      </View>
    );
  }

  if (!workout) {
    return (
      <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.errorContainer}>
          <Text
            style={[
              textStyles.bodyMd,
              { color: theme.colors.on_surface_variant },
            ]}
          >
            Workout not found.
          </Text>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[textStyles.labelMd, { color: "#fff" }]}>Go Back</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  const accentColor =
    (theme.colors as any)[`workout_${workout.type}`] ?? theme.colors.primary;
  const timeAgo = formatDistanceToNow(new Date(workout.logged_at), {
    addSuffix: true,
  });
  const durationMinutes = workout.duration_minutes ?? 0;
  const durationSeconds = durationMinutes * 60;
  const pace =
    durationMinutes > 0 && workout.distance_km
      ? (durationSeconds / workout.distance_km / 60).toFixed(2)
      : "--";

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
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
              {workout.title || "Workout"}
            </Text>
            <View style={{ width: 28 }} />
          </View>

          {/* Map viewer */}
          {workout.route_coords && workout.route_coords.length > 0 ? (
            <>
              <WorkoutMapViewer
                route={workout.route_coords}
                title="Route"
                height={300}
              />
              <TouchableOpacity
                style={[styles.playbackCTA, { backgroundColor: accentColor }]}
                onPress={() => setShowPlayback(!showPlayback)}
              >
                <Ionicons
                  name={showPlayback ? "pause" : "play"}
                  size={18}
                  color="#fff"
                />
                <Text
                  style={[
                    textStyles.labelMd,
                    { color: "#fff", marginLeft: spacing[1] },
                  ]}
                >
                  {showPlayback ? "Hide" : "Play"} Replay
                </Text>
              </TouchableOpacity>
              {showPlayback && (
                <View style={{ height: 400, marginBottom: spacing[4] }}>
                  <RoutePlayback
                    route={workout.route_coords}
                    durationSeconds={durationSeconds}
                    distanceKm={workout.distance_km ?? 0}
                    accentColor={accentColor}
                  />
                </View>
              )}
            </>
          ) : (
            <GlassCard
              style={{
                height: 200,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons
                name="map-outline"
                size={40}
                color={theme.colors.on_surface_muted}
              />
              <Text
                style={[
                  textStyles.bodySm,
                  {
                    color: theme.colors.on_surface_variant,
                    marginTop: spacing[2],
                  },
                ]}
              >
                No route data
              </Text>
            </GlassCard>
          )}

          {/* Stats */}
          <View style={styles.statsGrid}>
            <StatCard
              label="Distance"
              value={`${workout.distance_km?.toFixed(2) ?? "--"} km`}
              accent={accentColor}
              theme={theme}
            />
            <StatCard
              label="Duration"
              value={formatDuration(durationSeconds)}
              accent={accentColor}
              theme={theme}
            />
            <StatCard
              label="Pace"
              value={`${pace}'/km`}
              accent={accentColor}
              theme={theme}
            />
            <StatCard
              label="Calories"
              value={`${Math.round(workout.calories ?? 0)} kcal`}
              accent={accentColor}
              theme={theme}
            />
          </View>

          {/* Segments */}
          {segments.length > 0 && (
            <View>
              <Text
                style={[
                  textStyles.labelMd,
                  {
                    color: theme.colors.on_surface_variant,
                    marginBottom: spacing[2],
                  },
                ]}
              >
                BEST SEGMENTS
              </Text>
              <View style={{ gap: spacing[2] }}>
                {segments.map((segment) => (
                  <SegmentCard
                    key={segment.id}
                    segment={segment}
                    workoutType={workout.type}
                    accentColor={accentColor}
                    theme={theme}
                  />
                ))}
              </View>
            </View>
          )}

          {/* User + timestamp */}
          {workout.user && (
            <GlassCard style={styles.userCard}>
              <View style={styles.userRow}>
                <Avatar
                  uri={workout.user.avatar_url}
                  name={workout.user.display_name}
                  size={40}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      textStyles.bodyMd,
                      { color: theme.colors.on_surface },
                    ]}
                  >
                    {workout.user.display_name ?? "Unknown"}
                  </Text>
                  <Text
                    style={[
                      textStyles.bodySm,
                      { color: theme.colors.on_surface_variant },
                    ]}
                  >
                    {timeAgo}
                  </Text>
                </View>
              </View>
            </GlassCard>
          )}

          {/* Notes */}
          {workout.notes && (
            <GlassCard>
              <Text
                style={[
                  textStyles.labelSm,
                  {
                    color: theme.colors.on_surface_variant,
                    marginBottom: spacing[2],
                  },
                ]}
              >
                Notes
              </Text>
              <Text
                style={[textStyles.bodyMd, { color: theme.colors.on_surface }]}
              >
                {workout.notes}
              </Text>
            </GlassCard>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}h ${m}m`;
  }
  return `${m}m ${s}s`;
}

function StatCard({
  label,
  value,
  accent,
  theme,
}: {
  label: string;
  value: string;
  accent: string;
  theme: any;
}) {
  return (
    <GlassCard style={styles.statCard}>
      <Text
        style={[textStyles.labelSm, { color: theme.colors.on_surface_variant }]}
      >
        {label}
      </Text>
      <Text
        style={[
          textStyles.headlineMd,
          { color: accent, marginTop: spacing[1] },
        ]}
      >
        {value}
      </Text>
    </GlassCard>
  );
}

function SegmentCard({
  segment,
  workoutType,
  accentColor,
  theme,
}: {
  segment: WorkoutSegment;
  workoutType: string;
  accentColor: string;
  theme: any;
}) {
  const paceLabel = formatSegmentPace(segment, workoutType);

  return (
    <GlassCard
      style={[
        styles.segmentCard,
        { backgroundColor: `${accentColor}08`, borderColor: accentColor },
      ]}
    >
      <View style={styles.segmentHeader}>
        <View style={{ flex: 1 }}>
          <Text
            style={[textStyles.bodyMd, { color: theme.colors.on_surface }]}
            numberOfLines={1}
          >
            {segment.distanceKm} km
          </Text>
          <Text
            style={[
              textStyles.bodySm,
              { color: theme.colors.on_surface_variant, marginTop: spacing[1] },
            ]}
          >
            {Math.round(segment.durationSeconds)}s — {paceLabel}
          </Text>
        </View>
        {segment.isPR && (
          <View
            style={[styles.prBadge, { backgroundColor: accentColor }]}
          >
            <Text style={[textStyles.labelSm, { color: "#fff" }]}>PR</Text>
          </View>
        )}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    gap: spacing[4],
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[4],
  },
  backBtn: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing[2],
  },
  playbackCTA: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[2],
    borderRadius: 8,
    marginVertical: spacing[3],
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
  userCard: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  segmentCard: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    borderWidth: 1,
  },
  segmentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[2],
  },
  prBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: 4,
  },
});
