// ─────────────────────────────────────────────────────────────
// HomeScreen — Strava-style activity feed.
// Header with greeting + avatar, squad goal progress card,
// quick-log FAB, and a scrollable activity feed.
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  StatusBar,
  Pressable,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { formatDistanceToNow } from "date-fns";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
} from "react-native-reanimated";

import { useTheme } from "../../contexts/ThemeContext";
import { useAuthContext } from "../../contexts/AuthContext";
import { useSquadStore } from "../../contexts/SquadContext";
import GlassCard from "../../components/common/GlassCard";
import Avatar from "../../components/common/Avatar";
import WorkoutCard from "../../components/workout/WorkoutCard";
import ActivityFeedItem from "../../components/squad/ActivityFeedItem";
import {
  ActivityFilterButton,
  ActivityFilterModal,
  type ActivityFilters,
} from "../../components/squad/ActivityFeedFilter";
import { textStyles } from "../../theme/typography";
import { spacing } from "../../theme/spacing";
import { getGreeting, formatValue } from "../../utils/helpers";
import type { ActivityItem, WorkoutType } from "../../types";

// ─── Skeleton helpers ─────────────────────────────────────────

function SkeletonBlock({
  width = "100%" as any,
  height,
  style,
}: {
  width?: number | string;
  height: number;
  style?: any;
}) {
  const { theme } = useTheme();
  const pulse = useSharedValue(0.35);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 750 }),
        withTiming(0.35, { duration: 750 }),
      ),
      -1,
      false,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: 0,
          backgroundColor: theme.colors.surface_container,
        },
        animStyle,
        style,
      ]}
    />
  );
}

function GoalCardSkeleton() {
  return (
    <GlassCard
      elevated
      style={[styles.goalCard, { padding: 0, overflow: "hidden" } as any]}
    >
      <SkeletonBlock height={2} />
      <View
        style={{ flexDirection: "row", padding: spacing[4], gap: spacing[4] }}
      >
        <View style={{ flex: 1, gap: spacing[2] }}>
          <SkeletonBlock height={14} width={80} />
          <SkeletonBlock height={18} width="70%" />
          <SkeletonBlock height={13} width="45%" />
        </View>
        <SkeletonBlock width={64} height={64} />
      </View>
      <SkeletonBlock height={3} />
    </GlassCard>
  );
}

function FeedItemSkeleton() {
  return (
    <GlassCard
      style={[
        styles.activityCard,
        { padding: 0, overflow: "hidden", marginBottom: spacing[3] } as any,
      ]}
    >
      <SkeletonBlock height={2} />
      <View style={{ padding: spacing[4] }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing[3],
            marginBottom: spacing[3],
          }}
        >
          <SkeletonBlock width={40} height={40} />
          <View style={{ flex: 1, gap: spacing[2] }}>
            <SkeletonBlock height={13} width="50%" />
            <SkeletonBlock height={11} width="35%" />
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: spacing[4] }}>
          <SkeletonBlock height={36} width={70} />
          <SkeletonBlock height={36} width={70} />
        </View>
      </View>
    </GlassCard>
  );
}

export default function HomeScreen() {
  const { theme } = useTheme();
  const { dbUser } = useAuthContext();
  const navigation = useNavigation<any>();
  const {
    squads,
    squadsLoading,
    activeSquad,
    activeGoal,
    goalProgress,
    workouts,
    activity,
    activityLoading,
    loadSquads,
    selectSquad,
    refreshGoal,
  } = useSquadStore();

  const [refreshing, setRefreshing] = React.useState(false);
  const [showFilterModal, setShowFilterModal] = React.useState(false);
  const [filters, setFilters] = React.useState<ActivityFilters>({
    types: new Set(),
  });

  const headerOp = useSharedValue(0);
  const cardOp = useSharedValue(0);
  const feedOp = useSharedValue(0);

  useEffect(() => {
    headerOp.value = withTiming(1, { duration: 400 });
    cardOp.value = withDelay(150, withTiming(1, { duration: 400 }));
    feedOp.value = withDelay(300, withTiming(1, { duration: 400 }));
  }, []);

  useEffect(() => {
    if (dbUser) loadSquads(dbUser.id);
  }, [dbUser?.id]);

  useEffect(() => {
    if (squads.length > 0 && !activeSquad) selectSquad(squads[0]);
  }, [squads]);

  useFocusEffect(
    useCallback(() => {
      if (activeSquad) refreshGoal();
    }, [activeSquad?.id]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (dbUser) await loadSquads(dbUser.id);
    if (activeSquad) await selectSquad(activeSquad);
    setRefreshing(false);
  }, [dbUser, activeSquad]);

  // Filter activity based on selected types
  const filteredActivity = React.useMemo(() => {
    if (filters.types.size === 0) return activity;
    return activity.filter((item) => {
      if (item.kind !== "workout") return true; // Always show non-workout items
      const workoutData = (item.payload as any) ?? {};
      return filters.types.has(workoutData.type);
    });
  }, [activity, filters.types]);

  const headerStyle = useAnimatedStyle(() => ({ opacity: headerOp.value }));
  const cardStyle = useAnimatedStyle(() => ({ opacity: cardOp.value }));
  const feedStyle = useAnimatedStyle(() => ({ opacity: feedOp.value }));

  const greeting = getGreeting();
  const firstName = dbUser?.display_name?.split(" ")[0] ?? "Athlete";

  const progressPct = Math.round(goalProgress * 100);

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing || squadsLoading}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
        >
          {/* ── Header ─────────────────────────────────────── */}
          <Animated.View style={[styles.header, headerStyle]}>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  textStyles.labelMd,
                  {
                    color: theme.colors.on_surface_variant,
                    letterSpacing: 0.5,
                  },
                ]}
              >
                {greeting.toUpperCase()}
              </Text>
              <Text
                style={[styles.headerName, { color: theme.colors.on_surface }]}
              >
                {firstName}
              </Text>
            </View>
            <View style={styles.headerRight}>
              <Pressable
                onPress={() => navigation.navigate("Notifications")}
                style={[
                  styles.iconBtn,
                  { backgroundColor: theme.colors.surface_container },
                ]}
              >
                <Ionicons
                  name="notifications-outline"
                  size={20}
                  color={theme.colors.on_surface}
                />
              </Pressable>
              <Avatar
                uri={dbUser?.avatar_url}
                name={dbUser?.display_name}
                size={40}
                onPress={() => navigation.navigate("Profile")}
                showBorder
              />
            </View>
          </Animated.View>

          {/* ── Squad goal progress card ────────────────────── */}
          <Animated.View style={cardStyle}>
            {squadsLoading ? (
              <GoalCardSkeleton />
            ) : activeGoal && activeSquad ? (
              <GlassCard
                elevated
                style={styles.goalCard}
                onPress={() =>
                  navigation.navigate("SquadDetail", {
                    squadId: activeSquad.id,
                  })
                }
              >
                {/* Orange top accent bar */}
                <View
                  style={[
                    styles.goalAccentBar,
                    { backgroundColor: theme.colors.primary },
                  ]}
                />

                <View style={styles.goalCardBody}>
                  <View style={{ flex: 1 }}>
                    {/* Squad badge */}
                    <View
                      style={[
                        styles.squadBadge,
                        { backgroundColor: `${theme.colors.primary}1A` },
                      ]}
                    >
                      <Ionicons
                        name="people"
                        size={12}
                        color={theme.colors.primary}
                      />
                      <Text
                        style={[
                          textStyles.labelSm,
                          { color: theme.colors.primary, marginLeft: 5 },
                        ]}
                      >
                        {activeSquad.name}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.goalTitle,
                        { color: theme.colors.on_surface },
                      ]}
                      numberOfLines={2}
                    >
                      {activeGoal.title}
                    </Text>
                    <Text
                      style={[
                        textStyles.bodyMd,
                        {
                          color: theme.colors.on_surface_variant,
                          marginTop: 4,
                        },
                      ]}
                    >
                      {formatValue(
                        activeGoal.current_value ?? 0,
                        activeGoal.unit,
                      )}
                      <Text style={{ color: theme.colors.on_surface_muted }}>
                        {" "}
                        /{" "}
                        {formatValue(activeGoal.target_value, activeGoal.unit)}
                      </Text>
                    </Text>
                  </View>

                  {/* Circular progress */}
                  <View style={styles.progressCircle}>
                    <View
                      style={[
                        styles.progressTrack,
                        { borderColor: theme.colors.outline },
                      ]}
                    >
                      <Text
                        style={[
                          styles.progressPct,
                          { color: theme.colors.primary },
                        ]}
                      >
                        {progressPct}%
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Linear progress bar */}
                <View
                  style={[
                    styles.progressBg,
                    { backgroundColor: theme.colors.outline },
                  ]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: theme.colors.primary,
                        width: `${Math.min(progressPct, 100)}%` as any,
                      },
                    ]}
                  />
                </View>
              </GlassCard>
            ) : (
              <GlassCard
                style={styles.emptyCard}
                onPress={() => navigation.navigate("CreateSquad")}
              >
                <View style={styles.emptyCardRow}>
                  <View
                    style={[
                      styles.emptyIcon,
                      { backgroundColor: `${theme.colors.primary}1A` },
                    ]}
                  >
                    <Ionicons
                      name="people-outline"
                      size={22}
                      color={theme.colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        textStyles.titleLg,
                        { color: theme.colors.on_surface },
                      ]}
                    >
                      Start your first squad
                    </Text>
                    <Text
                      style={[
                        textStyles.bodySm,
                        {
                          color: theme.colors.on_surface_variant,
                          marginTop: 2,
                        },
                      ]}
                    >
                      Invite friends, set a goal, and go
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={theme.colors.on_surface_muted}
                  />
                </View>
              </GlassCard>
            )}
          </Animated.View>

          {/* ── Quick actions ───────────────────────────────── */}
          <Animated.View style={[styles.quickActions, cardStyle]}>
            <TouchableOpacity
              style={[
                styles.quickAction,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={() =>
                navigation.navigate("ActiveWorkout", {
                  type: "run",
                  squadId: activeSquad?.id,
                  goalId: activeGoal?.id,
                })
              }
            >
              <Ionicons name="play" size={22} color="black" />

              <Text style={[textStyles.titleMd, { color: "black" }]}>
                Start Run
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.quickAction,
                { backgroundColor: theme.colors.surface_container },
              ]}
              onPress={() =>
                navigation.navigate("Log", {
                  squadId: activeSquad?.id,
                  goalId: activeGoal?.id,
                })
              }
            >
              <Ionicons name="add" size={22} color={theme.colors.on_surface} />
              <Text
                style={[textStyles.titleMd, { color: theme.colors.on_surface }]}
              >
                Log Workout
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* ── Activity feed ───────────────────────────────── */}
          <Animated.View style={feedStyle}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: spacing[3],
              }}
            >
              <Text
                style={[
                  styles.sectionLabel,
                  { color: theme.colors.on_surface_variant },
                ]}
              >
                SQUAD FEED
              </Text>
              <View style={{ flexDirection: "row", gap: spacing[2] }}>
                <ActivityFilterButton
                  activeFiltersCount={filters.types.size}
                  onPress={() => setShowFilterModal(true)}
                />
                <Pressable
                  onPress={() => navigation.navigate("Stats")}
                  style={[
                    styles.statsBtn,
                    { backgroundColor: theme.colors.surface_container },
                  ]}
                >
                  <Ionicons
                    name="stats-chart-outline"
                    size={18}
                    color={theme.colors.on_surface}
                  />
                </Pressable>
              </View>
            </View>

            {activityLoading ? (
              <>
                <FeedItemSkeleton />
                <FeedItemSkeleton />
                <FeedItemSkeleton />
              </>
            ) : filteredActivity.length === 0 ? (
              <GlassCard style={styles.emptyFeed}>
                <Ionicons
                  name="bicycle-outline"
                  size={40}
                  color={theme.colors.on_surface_muted}
                  style={{ alignSelf: "center" }}
                />
                <Text
                  style={[
                    textStyles.bodyMd,
                    styles.emptyText,
                    { color: theme.colors.on_surface_variant },
                  ]}
                >
                  {filters.types.size > 0
                    ? "No activities match your filters"
                    : "No activity yet. Log your first workout!"}
                </Text>
              </GlassCard>
            ) : (
              filteredActivity.slice(0, 5).map((item: ActivityItem) => (
                <View key={item.id} style={styles.activityCardWrapper}>
                  {item.kind === "workout" ? (
                    <WorkoutActivityCard item={item} />
                  ) : (
                    <GlassCard style={styles.activityMetaCard}>
                      <ActivityFeedItem item={item} />
                    </GlassCard>
                  )}
                </View>
              ))
            )}
          </Animated.View>

          {/* ── Filter Modal ────────────────────────────────── */}
          <ActivityFilterModal
            visible={showFilterModal}
            onClose={() => setShowFilterModal(false)}
            filters={filters}
            onFiltersChange={setFilters}
          />

          {/* ── Recent workouts ─────────────────────────────── */}
          {workouts.length > 0 && (
            <Animated.View style={[feedStyle, { marginBottom: spacing[20] }]}>
              <Text
                style={[
                  styles.sectionLabel,
                  { color: theme.colors.on_surface_variant },
                ]}
              >
                YOUR WORKOUTS
              </Text>
              <View style={{ gap: spacing[3] }}>
                {workouts.slice(0, 3).map((w) => (
                  <WorkoutCard key={w.id} workout={w} showUser />
                ))}
              </View>
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

interface WorkoutActivityCardProps {
  item: ActivityItem;
}

function WorkoutActivityCard({ item }: WorkoutActivityCardProps) {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();

  const workout: any = item.workout ?? (item.payload as any) ?? {};
  const workoutId: string | undefined = workout.id ?? workout.workout_id;
  const type: WorkoutType = (workout.type as WorkoutType) ?? "other";
  const distanceKm =
    typeof workout.distance_km === "number" ? workout.distance_km : null;
  const durationMinutes =
    typeof workout.duration_minutes === "number"
      ? workout.duration_minutes
      : null;

  const distanceLabel =
    typeof distanceKm === "number" ? `${distanceKm.toFixed(1)} km` : null;
  const durationLabel = formatDuration(durationMinutes);
  const effortLabel = formatEffort(type, distanceKm, durationMinutes);
  const accentColor = getWorkoutAccentColor(type, theme.colors as any);

  const typeLabel =
    type === "run"
      ? "Run"
      : type === "cycle"
        ? "Ride"
        : type === "swim"
          ? "Swim"
          : type === "strength"
            ? "Strength"
            : type === "yoga"
              ? "Yoga"
              : type === "hike"
                ? "Hike"
                : "Workout";

  const timeAgo = formatDistanceToNow(new Date(item.created_at), {
    addSuffix: true,
  });

  const segments = buildSegments({
    type,
    distanceLabel,
    durationLabel,
    effortLabel,
  });

  const handlePress = () => {
    if (workoutId) {
      navigation.navigate("WorkoutDetail", { workoutId });
    }
  };

  return (
    <GlassCard style={styles.activityCard} onPress={handlePress}>
      <View
        style={[styles.activityAccentBar, { backgroundColor: accentColor }]}
      />
      <View style={styles.activityCardBody}>
        <View style={styles.activityHeaderRow}>
          <Avatar
            uri={item.user?.avatar_url}
            name={item.user?.display_name}
            size={40}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={[textStyles.bodyMd, { color: theme.colors.on_surface }]}
            >
              {item.user?.display_name ?? "Someone"}
            </Text>
            <Text
              style={[
                textStyles.bodySm,
                { color: theme.colors.on_surface_variant, marginTop: 2 },
              ]}
            >
              {typeLabel}
              <Text style={{ color: theme.colors.on_surface_muted }}>
                {" · "}
                {timeAgo}
              </Text>
            </Text>
          </View>
          <View
            style={[styles.typePill, { backgroundColor: `${accentColor}26` }]}
          >
            <Ionicons
              name={
                type === "cycle"
                  ? "bicycle-outline"
                  : type === "swim"
                    ? "water-outline"
                    : "walk-outline"
              }
              size={16}
              color={accentColor}
            />
          </View>
        </View>

        {workout.title ? (
          <Text
            style={[styles.activityTitle, { color: theme.colors.on_surface }]}
            numberOfLines={2}
          >
            {workout.title}
          </Text>
        ) : null}

        <View style={styles.activityStatsRow}>
          {distanceLabel ? (
            <View style={styles.activityStat}>
              <Text
                style={[
                  textStyles.labelSm,
                  { color: theme.colors.on_surface_muted },
                ]}
              >
                Distance
              </Text>
              <Text
                style={[textStyles.titleMd, { color: theme.colors.on_surface }]}
              >
                {distanceLabel}
              </Text>
            </View>
          ) : null}

          {durationLabel ? (
            <View style={styles.activityStat}>
              <Text
                style={[
                  textStyles.labelSm,
                  { color: theme.colors.on_surface_muted },
                ]}
              >
                Time
              </Text>
              <Text
                style={[textStyles.titleMd, { color: theme.colors.on_surface }]}
              >
                {durationLabel}
              </Text>
            </View>
          ) : null}

          {effortLabel ? (
            <View style={styles.activityStat}>
              <Text
                style={[
                  textStyles.labelSm,
                  { color: theme.colors.on_surface_muted },
                ]}
              >
                Effort
              </Text>
              <Text
                style={[textStyles.titleMd, { color: theme.colors.on_surface }]}
              >
                {effortLabel}
              </Text>
            </View>
          ) : null}
        </View>

        {segments.length > 0 && (
          <View style={styles.segmentsBlock}>
            <Text
              style={[
                textStyles.labelSm,
                { color: theme.colors.on_surface_muted },
              ]}
            >
              Segments
            </Text>
            <View style={styles.segmentsRow}>
              {segments.map((seg) => (
                <View
                  key={seg.id}
                  style={[
                    styles.segmentCard,
                    {
                      backgroundColor: theme.colors.surface_container_low,
                      borderColor: theme.colors.outline,
                    },
                  ]}
                >
                  <View style={styles.segmentHeaderRow}>
                    <Text
                      style={[
                        textStyles.titleSm,
                        { color: theme.colors.on_surface },
                      ]}
                      numberOfLines={1}
                    >
                      {seg.name}
                    </Text>
                    {seg.isPR && (
                      <View
                        style={[
                          styles.segmentPill,
                          { backgroundColor: `${accentColor}1A` },
                        ]}
                      >
                        <Text
                          style={[textStyles.labelSm, { color: accentColor }]}
                        >
                          PR
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      textStyles.bodyMd,
                      { color: theme.colors.on_surface },
                    ]}
                  >
                    {seg.primary}
                  </Text>
                  {seg.secondary ? (
                    <Text
                      style={[
                        textStyles.bodySm,
                        {
                          color: theme.colors.on_surface_variant,
                          marginTop: 2,
                        },
                      ]}
                    >
                      {seg.secondary}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </GlassCard>
  );
}

type SegmentConfig = {
  id: string;
  name: string;
  primary: string;
  secondary?: string;
  isPR?: boolean;
};

function formatDuration(minutes: number | null): string | null {
  if (!minutes || minutes <= 0) return null;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function formatEffort(
  type: WorkoutType,
  distanceKm: number | null,
  durationMinutes: number | null,
): string | null {
  if (
    !distanceKm ||
    !durationMinutes ||
    distanceKm <= 0 ||
    durationMinutes <= 0
  )
    return null;

  if (type === "cycle") {
    const speed = distanceKm / (durationMinutes / 60);
    return `${speed.toFixed(1)} km/h`;
  }

  const totalSeconds = Math.round((durationMinutes * 60) / distanceKm);
  const min = Math.floor(totalSeconds / 60);
  const sec = totalSeconds % 60;
  const secStr = sec < 10 ? `0${sec}` : `${sec}`;
  return `${min}:${secStr} /km`;
}

function getWorkoutAccentColor(type: WorkoutType, colors: any): string {
  switch (type) {
    case "run":
      return colors.workout_run;
    case "cycle":
      return colors.workout_cycle;
    case "swim":
      return colors.workout_swim;
    case "strength":
      return colors.workout_strength;
    case "yoga":
      return colors.workout_yoga;
    case "hike":
      return colors.workout_hike;
    default:
      return colors.workout_other;
  }
}

function buildSegments(input: {
  type: WorkoutType;
  distanceLabel: string | null;
  durationLabel: string | null;
  effortLabel: string | null;
}): SegmentConfig[] {
  const segments: SegmentConfig[] = [];

  if (input.effortLabel && input.distanceLabel) {
    segments.push({
      id: "seg-main",
      name: input.type === "cycle" ? "Climb segment" : "Best 1 km",
      primary: input.effortLabel,
      secondary: input.distanceLabel,
      isPR: true,
    });
  }

  if (input.durationLabel) {
    segments.push({
      id: "seg-duration",
      name: "Time in zone",
      primary: input.durationLabel,
      secondary: input.type === "cycle" ? "Tempo effort" : "Steady effort",
    });
  }

  if (!segments.length && input.effortLabel) {
    segments.push({
      id: "seg-fallback",
      name: "Average effort",
      primary: input.effortLabel,
    });
  }

  return segments.slice(0, 3);
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[10],
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[6],
    paddingTop: spacing[2],
  },
  headerName: {
    fontSize: 28,
    fontFamily: "Lexend-Bold", // correct font name
    letterSpacing: -1.4, // -0.05em
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 0, // ROUND_NONE
    alignItems: "center",
    justifyContent: "center",
  },

  goalCard: {
    marginBottom: spacing[4],
    padding: 0,
    overflow: "hidden",
  },
  goalAccentBar: {
    height: 2,
    width: "100%",
  },
  goalCardBody: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[4],
    gap: spacing[4],
  },
  squadBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 0, // ROUND_NONE
    marginBottom: spacing[2],
  },
  goalTitle: {
    fontSize: 18,
    fontFamily: "Lexend-SemiBold", // correct font name
    lineHeight: 22,
    letterSpacing: -0.9, // -0.05em
  },
  progressCircle: {
    width: 68,
    height: 68,
    alignItems: "center",
    justifyContent: "center",
  },
  progressTrack: {
    width: 64,
    height: 64,
    borderRadius: 0, // ROUND_NONE — square progress box
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  progressPct: {
    fontSize: 15,
    fontFamily: "Lexend-Bold", // correct font name
  },
  progressBg: {
    height: 3,
    marginHorizontal: 0,
    borderRadius: 0,
  },
  progressFill: {
    height: "100%",
    borderRadius: 0,
  },

  emptyCard: { marginBottom: spacing[4] },
  emptyCardRow: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 0, // ROUND_NONE
    alignItems: "center",
    justifyContent: "center",
  },

  quickActions: {
    flexDirection: "row",
    gap: spacing[2],
    marginBottom: spacing[6],
  },
  quickAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    height: 52,
    borderRadius: 0, // ROUND_NONE
  },

  sectionLabel: {
    fontSize: 12,
    fontFamily: "Manrope-Bold", // correct font name
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: spacing[3],
    marginTop: spacing[2],
  },
  statsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyFeed: {
    alignItems: "flex-start",
    paddingVertical: spacing[8],
    gap: spacing[3],
  },
  emptyText: {},
  feedDivider: { height: 0 }, // Zero-Divider Rule — no horizontal lines
  activityCardWrapper: { marginBottom: spacing[3] },
  activityMetaCard: {
    paddingVertical: spacing[1.5],
    paddingHorizontal: spacing[3],
  },
  activityCard: {
    padding: 0,
    overflow: "hidden",
  },
  activityAccentBar: {
    height: 2,
    width: "100%",
  },
  activityCardBody: {
    padding: spacing[4],
  },
  activityHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  typePill: {
    borderRadius: 0, // ROUND_NONE — no pill shapes except Chips
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    alignItems: "center",
    justifyContent: "center",
  },
  activityTitle: {
    ...textStyles.headlineSm,
    marginBottom: spacing[3],
  },
  activityStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing[3],
  },
  activityStat: {
    flex: 1,
  },
  segmentsBlock: {
    marginTop: spacing[1],
  },
  segmentsRow: {
    flexDirection: "row",
    gap: spacing[2],
    marginTop: spacing[2],
  },
  segmentCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 0, // ROUND_NONE
    padding: spacing[2.5],
  },
  segmentHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[1.5],
  },
  segmentPill: {
    borderRadius: 0, // ROUND_NONE
    paddingHorizontal: spacing[1.5],
    paddingVertical: spacing[0.5],
  },
});
