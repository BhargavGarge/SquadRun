// ─────────────────────────────────────────────────────────────
// SquadDetailScreen — full squad view with:
//   • Goal progress ring + bar
//   • Member leaderboard
//   • Activity feed
//   • Quick-log CTA
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  StatusBar,
  RefreshControl,
} from "react-native";
import * as Haptics from "expo-haptics";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

import GlassCard from "../../components/common/GlassCard";
import ProgressRing from "../../components/common/ProgressRing";
import AnimatedProgressBar from "../../components/common/AnimatedProgressBar";
import MemberRow from "../../components/squad/MemberRow";
import ActivityFeedItem from "../../components/squad/ActivityFeedItem";
import GradientButton from "../../components/common/GradientButton";
import Avatar from "../../components/common/Avatar";
import MilestoneCelebration from "../../components/squad/MilestoneCelebration";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuthContext } from "../../contexts/AuthContext";
import { useSquadStore } from "../../contexts/SquadContext";
import { textStyles } from "../../theme/typography";
import { spacing, radius } from "../../theme/spacing";
import { formatValue, getDaysLeft } from "../../utils/helpers";
import { workoutsApi } from "../../services/supabase";
import {
  getCurrentWeekChallenges,
  computeChallengeEntries,
  getWeekNumber,
} from "../../utils/challengeRotation";
import { buildStreakInfos, shouldNudge } from "../../utils/streakUtils";
import { savedRoutesApi, type SavedRoute } from "../../services/supabase";
import RouteMapCard from "../../components/workout/RouteMapCard";
import type { SquadMember } from "../../types";

export default function SquadDetailScreen() {
  const { theme } = useTheme();
  const { dbUser } = useAuthContext();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { squadId } = route.params;

  const {
    activeSquad,
    activeGoal,
    goalProgress,
    activity,
    selectSquad,
    workouts,
  } = useSquadStore();
  const [contributions, setContributions] = useState<Record<string, number>>(
    {},
  );
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "leaderboard" | "activity" | "challenges" | "routes"
  >("leaderboard");
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [routesLoading, setRoutesLoading] = useState(false);

  // Milestone celebration
  const [celebrationMilestone, setCelebrationMilestone] = useState<number | null>(null);
  const celebratedRef = useRef<Set<number>>(new Set());
  const lastGoalIdRef = useRef<string | null>(null);

  // Rotating challenges — 3 per ISO week, cycles every 3 weeks
  const weekChallenges = getCurrentWeekChallenges();

  useEffect(() => {
    if (activeSquad?.id !== squadId) {
      // Load the squad if not already active
      const squadsState = useSquadStore.getState();
      const squad = squadsState.squads.find((s) => s.id === squadId);
      if (squad) selectSquad(squad);
    }
  }, [squadId]);

  useEffect(() => {
    if (activeGoal) loadContributions();
  }, [activeGoal?.id]);

  useEffect(() => {
    if (activeTab === "routes" && activeSquad?.id) loadRoutes();
  }, [activeTab, activeSquad?.id]);

  const loadRoutes = async () => {
    if (!activeSquad) return;
    setRoutesLoading(true);
    try {
      const routes = await savedRoutesApi.getBySquad(activeSquad.id);
      setSavedRoutes(routes);
    } catch (err) {
      console.error("[SquadDetail] loadRoutes:", err);
    } finally {
      setRoutesLoading(false);
    }
  };

  // Detect milestone crossings and trigger celebration
  useEffect(() => {
    if (!activeGoal) return;

    // When goal changes, pre-mark milestones already passed so we don't
    // retroactively celebrate on first load.
    if (lastGoalIdRef.current !== activeGoal.id) {
      lastGoalIdRef.current = activeGoal.id;
      const already = new Set<number>();
      for (const m of [25, 50, 75, 100]) {
        if (goalProgress >= m) already.add(m);
      }
      celebratedRef.current = already;
      return;
    }

    // Check each milestone in ascending order — show the lowest uncelebrated one
    for (const milestone of [25, 50, 75, 100]) {
      if (goalProgress >= milestone && !celebratedRef.current.has(milestone)) {
        celebratedRef.current.add(milestone);
        setCelebrationMilestone(milestone);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        break;
      }
    }
  }, [goalProgress, activeGoal?.id]);

  const loadContributions = async () => {
    if (!activeGoal) return;
    try {
      const rows = await workoutsApi.getMemberContributions(activeGoal.id);
      const map: Record<string, number> = {};
      for (const row of rows) {
        const val =
          activeGoal.unit === "km"
            ? (row.distance_km ?? 0)
            : activeGoal.unit === "hours"
              ? (row.duration_minutes ?? 0) / 60
              : activeGoal.unit === "calories"
                ? (row.calories ?? 0)
                : 1;
        map[row.user_id] = (map[row.user_id] ?? 0) + val;
      }
      setContributions(map);
    } catch (err) {
      console.error("[SquadDetail] loadContributions:", err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    const squadsState = useSquadStore.getState();
    const squad = squadsState.squads.find((s) => s.id === squadId);
    if (squad) await selectSquad(squad);
    await loadContributions();
    setRefreshing(false);
  };

  const handleShare = async () => {
    if (!activeSquad) return;
    try {
      await Share.share({
        message: `Join my Squad Goals squad "${activeSquad.name}"! Use code: ${activeSquad.invite_code}`,
        title: "Join my Squad Goals squad",
      });
    } catch (err) {
      // User cancelled share
    }
  };

  // Sort members by contribution descending for leaderboard
  const sortedMembers = (activeSquad?.members ?? [])
    .map((m) => ({ ...m, contrib: contributions[m.user_id] ?? 0 }))
    .filter((m) => m.user?.show_in_leaderboards ?? true)
    .sort((a, b) => b.contrib - a.contrib);

  const maxContrib = Math.max(...sortedMembers.map((m) => m.contrib), 0.1);
  const daysLeft = activeGoal ? getDaysLeft(activeGoal.ends_at) : 0;
  const myMember = sortedMembers.find((m) => m.user_id === dbUser?.id);
  const myRank = myMember
    ? sortedMembers.findIndex((m) => m.user_id === dbUser?.id) + 1
    : null;

  // Weekly workouts slice — used by rotating challenge engine
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weeklyWorkouts = (workouts ?? []).filter((w) => {
    const logged = new Date(w.logged_at);
    return logged >= weekAgo && logged <= now && (w.user?.show_in_leaderboards ?? true);
  });

  // Streak / accountability — uses full workouts slice (all loaded workouts, not just this week)
  const streakInfos = buildStreakInfos(workouts ?? [], activeSquad?.members ?? []);
  const myNudge =
    dbUser?.id ? shouldNudge(dbUser.id, streakInfos) : false;
  const myStreakInfo = streakInfos.find((s) => s.userId === dbUser?.id);

  if (!activeSquad) {
    return (
      <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Text
            style={[
              textStyles.bodyMd,
              { color: theme.colors.on_surface_variant },
            ]}
          >
            Loading squad...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: spacing[24] }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary_light}
            />
          }
        >
          {/* ── Header ───────────────────────────────────────── */}
          <LinearGradient
            colors={[theme.colors.gradient_card_start, "transparent"]}
            style={styles.headerGrad}
          >
            <View style={styles.topBar}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.iconBtn}
              >
                <Ionicons
                  name="arrow-back"
                  size={22}
                  color={theme.colors.on_surface}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShare} style={styles.iconBtn}>
                <Ionicons
                  name="share-outline"
                  size={22}
                  color={theme.colors.on_surface}
                />
              </TouchableOpacity>
            </View>

            {/* Squad info */}
            <View style={styles.squadInfo}>
              <Text
                style={[
                  textStyles.displaySm,
                  { color: theme.colors.on_surface },
                ]}
              >
                {activeSquad.name}
              </Text>
              {activeSquad.description ? (
                <Text
                  style={[
                    textStyles.bodyMd,
                    { color: theme.colors.on_surface_variant, marginTop: 4 },
                  ]}
                >
                  {activeSquad.description}
                </Text>
              ) : null}

              {/* Member avatars */}
              <View style={styles.memberAvatars}>
                {(activeSquad.members ?? []).slice(0, 6).map((m, i) => (
                  <Avatar
                    key={m.id}
                    uri={m.user?.avatar_url}
                    name={m.user?.display_name}
                    size={36}
                    showBorder
                    borderColor={theme.colors.surface_container}
                    style={{ marginLeft: i === 0 ? 0 : -10, zIndex: 6 - i }}
                  />
                ))}
                <Text
                  style={[
                    textStyles.bodySm,
                    { color: theme.colors.on_surface_variant, marginLeft: 10 },
                  ]}
                >
                  {activeSquad.members?.length ?? 0} / {activeSquad.max_members}{" "}
                  members
                </Text>
              </View>

              {/* Invite code */}
              <GlassCard
                style={styles.inviteCode}
                padding={12}
                onPress={handleShare}
              >
                <Ionicons
                  name="link-outline"
                  size={16}
                  color={theme.colors.primary_light}
                />
                <Text
                  style={[
                    textStyles.titleMd,
                    { color: theme.colors.on_surface },
                  ]}
                >
                  Invite code:
                </Text>
                <Text
                  style={[
                    textStyles.headlineSm,
                    { color: theme.colors.primary_light, letterSpacing: 4 },
                  ]}
                >
                  {activeSquad.invite_code}
                </Text>
              </GlassCard>
            </View>
          </LinearGradient>

          {/* ── Active goal ───────────────────────────────────── */}
          <View style={styles.section}>
            {activeGoal ? (
              <GlassCard elevated style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        textStyles.labelMd,
                        { color: theme.colors.primary_light },
                      ]}
                    >
                      Active Goal
                    </Text>
                    <Text
                      style={[
                        textStyles.headlineSm,
                        { color: theme.colors.on_surface, marginTop: 4 },
                      ]}
                    >
                      {activeGoal.title}
                    </Text>
                    {daysLeft > 0 && (
                      <Text
                        style={[
                          textStyles.bodySm,
                          {
                            color: theme.colors.on_surface_variant,
                            marginTop: 2,
                          },
                        ]}
                      >
                        {daysLeft} day{daysLeft !== 1 ? "s" : ""} remaining
                      </Text>
                    )}
                  </View>
                  <ProgressRing
                    progress={goalProgress}
                    size={88}
                    strokeWidth={8}
                    sublabel={activeGoal.unit}
                  />
                </View>

                <AnimatedProgressBar
                  progress={goalProgress}
                  height={10}
                  showLabel
                  labelLeft={`${formatValue(activeGoal.current_value ?? 0, activeGoal.unit)}`}
                  labelRight={`${formatValue(activeGoal.target_value, activeGoal.unit)}`}
                  style={{ marginTop: spacing[3] }}
                />
              </GlassCard>
            ) : (
              <GlassCard
                style={styles.noGoalCard}
                onPress={() =>
                  navigation.navigate("CreateGoal", { squadId: activeSquad.id })
                }
              >
                <Ionicons
                  name="flag-outline"
                  size={24}
                  color={theme.colors.primary_light}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      textStyles.titleLg,
                      { color: theme.colors.on_surface },
                    ]}
                  >
                    Set a squad goal
                  </Text>
                  <Text
                    style={[
                      textStyles.bodySm,
                      { color: theme.colors.on_surface_variant },
                    ]}
                  >
                    Rally your squad around a shared challenge
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={theme.colors.on_surface_variant}
                />
              </GlassCard>
            )}
          </View>

          {/* ── Accountability nudge banner ───────────────────── */}
          {myNudge && (
            <View style={[styles.section, { paddingTop: 0 }]}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "rgba(255,107,53,0.10)",
                  borderLeftWidth: 2,
                  borderLeftColor: "#FF6B35",
                  paddingHorizontal: spacing[3],
                  paddingVertical: spacing[2.5],
                  gap: spacing[2],
                }}
              >
                <Ionicons name="warning-outline" size={16} color="#FF6B35" />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[textStyles.labelSm, { color: "#FF6B35" }]}
                  >
                    STREAK AT RISK
                  </Text>
                  <Text
                    style={[
                      textStyles.bodySm,
                      { color: theme.colors.on_surface_variant, marginTop: 1 },
                    ]}
                  >
                    {myStreakInfo?.daysSinceLast === 1
                      ? "You haven't logged today — squad is active."
                      : `No workout in ${myStreakInfo?.daysSinceLast ?? 2}+ days — squad is still running.`}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* ── Quick log button ──────────────────────────────── */}
          <View style={[styles.section, { paddingTop: 0 }]}>
            <GradientButton
              label="Log a Workout"
              onPress={() =>
                navigation.navigate("LogWorkout", {
                  squadId: activeSquad.id,
                  goalId: activeGoal?.id,
                })
              }
              icon={
                <Ionicons name="add-circle-outline" size={20} color="#fff" />
              }
            />
          </View>

          {/* ── Tabs — tonal separation, no border line ──────── */}
          <View style={styles.tabs}>
            {(["leaderboard", "activity", "challenges", "routes"] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tab,
                  {
                    backgroundColor:
                      activeTab === tab
                        ? theme.colors.surface_container_high
                        : "transparent",
                  },
                ]}
                onPress={() => setActiveTab(tab)}
              >
                {/* Active indicator bar — lime bottom accent */}
                {activeTab === tab && (
                  <View
                    style={[
                      styles.tabAccent,
                      { backgroundColor: theme.colors.primary },
                    ]}
                  />
                )}
                <Text
                  style={[
                    textStyles.labelMd,
                    {
                      color:
                        activeTab === tab
                          ? theme.colors.primary
                          : theme.colors.on_surface_variant,
                    },
                  ]}
                >
                  {tab === "leaderboard"
                    ? "BOARD"
                    : tab === "activity"
                      ? "FEED"
                      : tab === "challenges"
                        ? "CHALLENGES"
                        : "ROUTES"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Leaderboard ───────────────────────────────────── */}
          {activeTab === "leaderboard" && (
            <View style={styles.section}>
              {myMember && myRank && (
                <GlassCard
                  elevated
                  style={{
                    marginBottom: spacing[3],
                    padding: spacing[3],
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View>
                    <Text
                      style={[
                        textStyles.labelSm,
                        { color: theme.colors.primary_light },
                      ]}
                    >
                      Your position
                    </Text>
                    <Text
                      style={[
                        textStyles.headlineSm,
                        { color: theme.colors.on_surface, marginTop: 2 },
                      ]}
                    >
                      #{myRank} in this squad
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text
                      style={[
                        textStyles.labelSm,
                        { color: theme.colors.on_surface_variant },
                      ]}
                    >
                      Contributed
                    </Text>
                    <Text
                      style={[
                        textStyles.titleLg,
                        { color: theme.colors.on_surface },
                      ]}
                    >
                      {formatValue(
                        myMember.contrib,
                        (activeGoal?.unit ?? "km") as any,
                      )}
                    </Text>
                  </View>
                </GlassCard>
              )}
              {sortedMembers.map((m, i) => (
                <MemberRow
                  key={m.id}
                  member={m}
                  rank={i + 1}
                  contribution={m.contrib}
                  maxContribution={maxContrib}
                  unit={activeGoal?.unit ?? "pts"}
                  animationDelay={i * 80}
                />
              ))}

              {/* ── Streak status ──────────────────────────── */}
              {streakInfos.length > 0 && (
                <View style={{ marginTop: spacing[5] }}>
                  <Text
                    style={[
                      textStyles.labelMd,
                      {
                        color: theme.colors.on_surface_variant,
                        marginBottom: spacing[3],
                      },
                    ]}
                  >
                    STREAKS
                  </Text>
                  {streakInfos.map((info) => {
                    const statusColor = info.isAtRisk
                      ? "#FF6B35"
                      : info.isActiveToday
                        ? theme.colors.primary
                        : theme.colors.on_surface_variant;
                    const statusIcon: any = info.isAtRisk
                      ? "warning-outline"
                      : info.isActiveToday
                        ? "checkmark-circle-outline"
                        : "ellipse-outline";
                    const statusText = info.isAtRisk
                      ? `${info.daysSinceLast}d inactive`
                      : info.isActiveToday
                        ? "Active today"
                        : "No workout today";

                    return (
                      <View
                        key={info.userId}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          paddingVertical: spacing[2],
                          borderBottomWidth: 1,
                          borderBottomColor: theme.colors.outline + "30",
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: spacing[2],
                            flex: 1,
                          }}
                        >
                          <Avatar
                            uri={info.avatarUrl}
                            name={info.name}
                            size={30}
                          />
                          <Text
                            style={[
                              textStyles.bodyMd,
                              { color: theme.colors.on_surface },
                            ]}
                            numberOfLines={1}
                          >
                            {info.name}
                          </Text>
                        </View>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: spacing[3],
                          }}
                        >
                          {/* Streak count */}
                          {info.streak > 0 && (
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: spacing[1],
                              }}
                            >
                              <Ionicons
                                name="flame"
                                size={13}
                                color={theme.colors.primary}
                              />
                              <Text
                                style={[
                                  textStyles.labelSm,
                                  { color: theme.colors.primary },
                                ]}
                              >
                                {info.streak}d
                              </Text>
                            </View>
                          )}
                          {/* Status */}
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: spacing[1],
                            }}
                          >
                            <Ionicons
                              name={statusIcon}
                              size={13}
                              color={statusColor}
                            />
                            <Text
                              style={[
                                textStyles.labelSm,
                                { color: statusColor },
                              ]}
                            >
                              {statusText}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* ── Activity feed ─────────────────────────────────── */}
          {activeTab === "activity" && (
            <View style={styles.section}>
              {activity.length === 0 ? (
                <View style={{ paddingVertical: spacing[8] }}>
                  <Text
                    style={[
                      textStyles.labelMd,
                      { color: theme.colors.primary, marginBottom: spacing[2] },
                    ]}
                  >
                    ● STANDBY
                  </Text>
                  <Text
                    style={[
                      textStyles.bodyMd,
                      { color: theme.colors.on_surface_variant },
                    ]}
                  >
                    No activity yet — log a workout.
                  </Text>
                </View>
              ) : (
                activity.map((item) => (
                  // Zero-Divider Rule: 8px dead space separates items, no horizontal lines
                  <View key={item.id} style={{ marginBottom: spacing[2] }}>
                    <ActivityFeedItem item={item} />
                  </View>
                ))
              )}
            </View>
          )}

          {/* ── Squad challenges (rotating — 3 per ISO week) ── */}
          {activeTab === "challenges" && (
            <View style={styles.section}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  marginBottom: spacing[3],
                }}
              >
                <Text
                  style={[
                    textStyles.labelMd,
                    { color: theme.colors.on_surface_variant },
                  ]}
                >
                  THIS WEEK'S CHALLENGES
                </Text>
                <Text
                  style={[
                    textStyles.labelSm,
                    { color: theme.colors.primary_light },
                  ]}
                >
                  WK {getWeekNumber()}
                </Text>
              </View>

              {weekChallenges.map((def, idx) => (
                <ChallengeCard
                  key={def.id}
                  title={def.title}
                  subtitle={def.subtitle}
                  unit={def.unit}
                  precision={def.precision}
                  icon={def.icon}
                  entries={computeChallengeEntries(weeklyWorkouts, def.id)}
                  highlightUserId={dbUser?.id ?? null}
                  theme={theme}
                  style={idx > 0 ? { marginTop: spacing[3] } : undefined}
                />
              ))}
            </View>
          )}

          {/* ── Route Sharing Queue ───────────────────────────── */}
          {activeTab === "routes" && (
            <View style={styles.section}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: spacing[3],
                }}
              >
                <Text
                  style={[
                    textStyles.labelMd,
                    { color: theme.colors.on_surface_variant },
                  ]}
                >
                  SQUAD ROUTES
                </Text>
                <Text
                  style={[
                    textStyles.labelSm,
                    { color: theme.colors.on_surface_variant },
                  ]}
                >
                  Save routes from a workout detail
                </Text>
              </View>

              {routesLoading ? (
                <View style={{ paddingVertical: spacing[8], alignItems: "center" }}>
                  <Text
                    style={[textStyles.bodySm, { color: theme.colors.on_surface_variant }]}
                  >
                    Loading…
                  </Text>
                </View>
              ) : savedRoutes.length === 0 ? (
                <GlassCard style={{ alignItems: "center", paddingVertical: spacing[8] }}>
                  <Ionicons
                    name="map-outline"
                    size={36}
                    color={theme.colors.on_surface_variant}
                  />
                  <Text
                    style={[
                      textStyles.titleMd,
                      { color: theme.colors.on_surface, marginTop: spacing[3] },
                    ]}
                  >
                    No saved routes yet
                  </Text>
                  <Text
                    style={[
                      textStyles.bodySm,
                      {
                        color: theme.colors.on_surface_variant,
                        marginTop: spacing[1],
                        textAlign: "center",
                      },
                    ]}
                  >
                    Open a workout with a route and tap{"\n"}"Save to Squad Routes"
                  </Text>
                </GlassCard>
              ) : (
                savedRoutes.map((route) => (
                  <GlassCard
                    key={route.id}
                    elevated
                    style={{ marginBottom: spacing[3], overflow: "hidden", padding: 0 }}
                  >
                    {/* Map thumbnail */}
                    {route.route_coords && route.route_coords.length > 1 && (
                      <RouteMapCard
                        coords={route.route_coords}
                        strokeColor={theme.colors.primary}
                        height={140}
                        borderRadius={0}
                      />
                    )}

                    <View style={{ padding: spacing[3] }}>
                      {/* Title + distance */}
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text
                          style={[
                            textStyles.titleMd,
                            { color: theme.colors.on_surface, flex: 1 },
                          ]}
                          numberOfLines={1}
                        >
                          {route.title}
                        </Text>
                        {route.distance_km != null && (
                          <Text
                            style={[
                              textStyles.labelSm,
                              { color: theme.colors.primary_light },
                            ]}
                          >
                            {route.distance_km.toFixed(1)} km
                          </Text>
                        )}
                      </View>

                      {/* Saved by + times run */}
                      <Text
                        style={[
                          textStyles.bodySm,
                          { color: theme.colors.on_surface_variant, marginTop: 2 },
                        ]}
                      >
                        Saved by {route.user?.display_name ?? "Squad member"}
                        {route.times_run > 0
                          ? ` · ${route.times_run} run${route.times_run !== 1 ? "s" : ""}`
                          : ""}
                      </Text>

                      {/* Run this button */}
                      <TouchableOpacity
                        style={[
                          {
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: spacing[2],
                            marginTop: spacing[3],
                            paddingVertical: spacing[2.5],
                            backgroundColor: theme.colors.primary,
                          },
                        ]}
                        onPress={async () => {
                          // Increment run count (fire-and-forget)
                          savedRoutesApi.incrementRuns(route.id).catch(() => {});
                          navigation.navigate("ActiveWorkout", {
                            type: "run",
                            squadId: activeSquad.id,
                            goalId: activeGoal?.id,
                          });
                        }}
                      >
                        <Ionicons name="play" size={14} color="#0A1400" />
                        <Text
                          style={[textStyles.labelMd, { color: "#0A1400" }]}
                        >
                          Run This Route
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </GlassCard>
                ))
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Milestone celebration overlay */}
      {celebrationMilestone !== null && (
        <MilestoneCelebration
          milestone={celebrationMilestone}
          goalTitle={activeGoal?.title}
          onDismiss={() => setCelebrationMilestone(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerGrad: {
    paddingBottom: spacing[6],
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  squadInfo: {
    paddingHorizontal: spacing[4],
    gap: spacing[3],
    marginTop: spacing[2],
  },
  memberAvatars: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing[1],
  },
  inviteCode: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    marginTop: spacing[2],
    alignSelf: "flex-start",
  },
  section: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
  },
  goalCard: {
    marginBottom: spacing[2],
  },
  goalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[4],
  },
  noGoalCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  // Tabs — tonal stacking separates, no border line
  tabs: {
    flexDirection: "row",
    marginHorizontal: spacing[4],
    marginTop: spacing[6],
    gap: spacing[1],
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing[3],
    position: "relative",
  },
  tabAccent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },
});

// ChallengeEntry type re-exported from challengeRotation — just alias here
type ChallengeEntry = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  value: number;
};

function ChallengeCard({
  title,
  subtitle,
  unit,
  precision,
  icon,
  entries,
  highlightUserId,
  theme,
  style,
}: {
  title: string;
  subtitle: string;
  unit: string;
  precision: number;
  icon: string;
  entries: ChallengeEntry[];
  highlightUserId: string | null;
  theme: any;
  style?: any;
}) {
  const top = entries.slice(0, 3);
  const hasData = top.length > 0;

  const myIndex =
    highlightUserId && entries.length > 0
      ? entries.findIndex((e) => e.userId === highlightUserId)
      : -1;
  const myRank = myIndex >= 0 ? myIndex + 1 : null;
  const myValue = myIndex >= 0 ? entries[myIndex].value : null;

  return (
    <GlassCard elevated style={[{ padding: spacing[3] }, style] as any}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: spacing[2],
        }}
      >
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing[1.5] }}>
            <Ionicons name={icon as any} size={13} color={theme.colors.primary_light} />
            <Text
              style={[textStyles.labelSm, { color: theme.colors.primary_light }]}
            >
              {title}
            </Text>
          </View>
          <Text
            style={[
              textStyles.bodySm,
              { color: theme.colors.on_surface_variant, marginTop: 2 },
            ]}
          >
            {subtitle}
          </Text>
        </View>
        {myRank && myValue !== null && (
          <View style={{ alignItems: "flex-end" }}>
            <Text
              style={[
                textStyles.labelSm,
                { color: theme.colors.on_surface_variant },
              ]}
            >
              You
            </Text>
            <Text
              style={[textStyles.titleMd, { color: theme.colors.on_surface }]}
            >
              #{myRank} · {myValue.toFixed(precision)} {unit}
            </Text>
          </View>
        )}
      </View>

      {!hasData ? (
        <Text
          style={[
            textStyles.bodySm,
            { color: theme.colors.on_surface_variant },
          ]}
        >
          No data for this week yet.
        </Text>
      ) : (
        top.map((e, index) => (
          <View
            key={e.userId}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: index === 0 ? spacing[2] : spacing[1.5],
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
            >
              <Text
                style={[
                  textStyles.labelSm,
                  {
                    color: theme.colors.on_surface_variant,
                    width: 18,
                  },
                ]}
              >
                {index + 1}
              </Text>
              <Avatar uri={e.avatarUrl} name={e.name} size={28} />
              <Text
                style={[
                  textStyles.bodyMd,
                  {
                    color: theme.colors.on_surface,
                    marginLeft: spacing[2],
                  },
                ]}
                numberOfLines={1}
              >
                {e.name}
              </Text>
            </View>
            <Text
              style={[
                textStyles.bodyMd,
                {
                  color: theme.colors.on_surface,
                  minWidth: 60,
                  textAlign: "right",
                },
              ]}
            >
              {e.value.toFixed(precision)}
              <Text
                style={[
                  textStyles.labelSm,
                  { color: theme.colors.on_surface_variant },
                ]}
              >
                {" "}
                {unit}
              </Text>
            </Text>
          </View>
        ))
      )}
    </GlassCard>
  );
}
