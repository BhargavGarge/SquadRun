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
  Alert,
  StatusBar,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";

import { useTheme } from "../../contexts/ThemeContext";
import { useAuthContext } from "../../contexts/AuthContext";
import { workoutsApi, workoutSocialApi, savedRoutesApi } from "../../services/supabase";
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
import type { Workout, WorkoutComment } from "../../types";
import type { WorkoutSegment } from "../../utils/segmentDetection";

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

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
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState<WorkoutComment[]>([]);
  const [isLikedByMe, setIsLikedByMe] = useState(false);
  const [socialLoading, setSocialLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [routeSaved, setRouteSaved] = useState(false);

  const likeScale = useSharedValue(1);
  const likeAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeScale.value }],
  }));

  const distanceUnit = dbUser?.preferred_units === "miles" ? "miles" : "km";

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
            await workoutsApi.saveSegments(
              workout.id,
              dbUser.id,
              segmentsToSave,
            );
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

  const loadSocial = async (loadedWorkout: Workout) => {
    try {
      setSocialLoading(true);
      const [summary, fetchedComments] = await Promise.all([
        workoutSocialApi.getSummary(loadedWorkout.id, dbUser?.id),
        workoutSocialApi.getComments(loadedWorkout.id),
      ]);
      setLikesCount(summary.likesCount);
      setIsLikedByMe(summary.isLikedByMe);
      setComments(fetchedComments);
    } catch (err) {
      console.error("[WorkoutDetail] Error loading social:", err);
    } finally {
      setSocialLoading(false);
    }
  };

  useEffect(() => {
    if (workout) {
      loadSocial(workout);
    }
  }, [workout?.id, dbUser?.id]);

  const handleToggleLike = async () => {
    if (!workout || !dbUser) return;

    const wasLiked = isLikedByMe;
    setIsLikedByMe(!wasLiked);
    setLikesCount((prev) => prev + (wasLiked ? -1 : 1));

    likeScale.value = 1.15;
    likeScale.value = withSpring(1, { damping: 10, stiffness: 220 });

    try {
      if (wasLiked) {
        await workoutSocialApi.unlike(workout.id, dbUser.id);
      } else {
        await workoutSocialApi.like(workout.id, dbUser.id);
      }
    } catch (err) {
      console.error("[WorkoutDetail] Error toggling like:", err);
      setIsLikedByMe(wasLiked);
      setLikesCount((prev) => prev + (wasLiked ? 1 : -1));
    }
  };

  const handleAddComment = async () => {
    if (!workout || !dbUser) return;
    const trimmed = commentText.trim();
    if (!trimmed) return;

    setSubmittingComment(true);
    try {
      const newComment = await workoutSocialApi.addComment(
        workout.id,
        dbUser.id,
        trimmed,
      );
      setComments((prev) => [...prev, newComment]);
      setCommentText("");
    } catch (err) {
      console.error("[WorkoutDetail] Error adding comment:", err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleSaveRoute = () => {
    if (!workout?.route_coords || !workout.squad_id || !dbUser) return;
    const defaultTitle = workout.title
      ? `${workout.title} route`
      : `${workout.type.charAt(0).toUpperCase() + workout.type.slice(1)} route`;

    Alert.prompt(
      "Save to Squad Routes",
      "Give this route a name your squad will recognise.",
      async (title: string | undefined) => {
        if (!title?.trim()) return;
        try {
          await savedRoutesApi.save({
            squadId: workout.squad_id!,
            savedBy: dbUser.id,
            title: title.trim(),
            distanceKm: workout.distance_km ?? null,
            routeCoords: workout.route_coords!,
            workoutId: workout.id,
          });
          setRouteSaved(true);
        } catch (err) {
          console.error("[WorkoutDetail] Error saving route:", err);
          Alert.alert("Error", "Could not save the route. Try again.");
        }
      },
      "plain-text",
      defaultTitle,
    );
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
  const distanceKm = workout.distance_km ?? 0;
  const displayDistance =
    distanceUnit === "km" ? distanceKm : distanceKm * 0.621371;
  const distanceSuffix = distanceUnit === "km" ? "km" : "mi";
  const pacePerKm =
    durationMinutes > 0 && distanceKm
      ? durationSeconds / distanceKm / 60
      : null;
  let paceLabel = "--";
  if (pacePerKm && pacePerKm > 0) {
    if (distanceUnit === "km") {
      paceLabel = `${pacePerKm.toFixed(2)}'/km`;
    } else {
      const pacePerMile = pacePerKm * 1.60934;
      paceLabel = `${pacePerMile.toFixed(2)}'/mi`;
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
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
                <View style={{ flexDirection: "row", gap: spacing[2] }}>
                  <TouchableOpacity
                    style={[styles.playbackCTA, { backgroundColor: accentColor, flex: 1 }]}
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

                  {/* Save to squad routes — only if workout belongs to a squad */}
                  {workout.squad_id && (
                    <TouchableOpacity
                      style={[
                        styles.playbackCTA,
                        {
                          backgroundColor: routeSaved
                            ? theme.colors.surface_container
                            : "transparent",
                          borderWidth: 1,
                          borderColor: routeSaved
                            ? theme.colors.outline
                            : theme.colors.primary,
                          paddingHorizontal: spacing[3],
                        },
                      ]}
                      onPress={routeSaved ? undefined : handleSaveRoute}
                      disabled={routeSaved}
                    >
                      <Ionicons
                        name={routeSaved ? "checkmark" : "bookmark-outline"}
                        size={16}
                        color={routeSaved ? theme.colors.on_surface_variant : theme.colors.primary}
                      />
                      <Text
                        style={[
                          textStyles.labelMd,
                          {
                            color: routeSaved
                              ? theme.colors.on_surface_variant
                              : theme.colors.primary,
                            marginLeft: spacing[1],
                          },
                        ]}
                      >
                        {routeSaved ? "Saved" : "Save Route"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
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

            {/* Activity photo */}
            {workout.photo_url && (
              <GlassCard style={styles.photoCard}>
                <Image
                  source={{ uri: workout.photo_url }}
                  style={styles.photoImage}
                  resizeMode="cover"
                />
              </GlassCard>
            )}

            {/* Stats */}
            <View style={styles.statsGrid}>
              <StatCard
                label="Distance"
                value={
                  distanceKm
                    ? `${displayDistance.toFixed(2)} ${distanceSuffix}`
                    : "--"
                }
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
                value={paceLabel}
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
                  style={[
                    textStyles.bodyMd,
                    { color: theme.colors.on_surface },
                  ]}
                >
                  {workout.notes}
                </Text>
              </GlassCard>
            )}

            {/* Social: likes + comments */}
            <View style={{ marginBottom: spacing[6] }}>
              <Text
                style={[
                  textStyles.labelMd,
                  {
                    color: theme.colors.on_surface_variant,
                    marginBottom: spacing[2],
                  },
                ]}
              >
                SQUAD REACTIONS
              </Text>
              <GlassCard style={styles.socialCard}>
                <View style={styles.socialHeaderRow}>
                  <Animated.View style={[styles.likePill, likeAnimStyle]}>
                    <TouchableOpacity
                      onPress={handleToggleLike}
                      disabled={!dbUser}
                      style={styles.likeButtonInner}
                    >
                      <Ionicons
                        name={isLikedByMe ? "heart" : "heart-outline"}
                        size={18}
                        color={
                          isLikedByMe ? accentColor : theme.colors.on_surface
                        }
                      />
                      <Text
                        style={[
                          textStyles.labelMd,
                          {
                            color: isLikedByMe
                              ? accentColor
                              : theme.colors.on_surface,
                            marginLeft: spacing[1],
                          },
                        ]}
                      >
                        {likesCount} Kudos
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>

                  <View style={styles.socialMetaRow}>
                    <Ionicons
                      name="chatbubble-outline"
                      size={16}
                      color={theme.colors.on_surface_variant}
                    />
                    <Text
                      style={[
                        textStyles.labelSm,
                        {
                          color: theme.colors.on_surface_variant,
                          marginLeft: 6,
                        },
                      ]}
                    >
                      {comments.length}{" "}
                      {comments.length === 1 ? "Comment" : "Comments"}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.socialDivider,
                    { backgroundColor: theme.colors.outline },
                  ]}
                />

                <View style={styles.commentsList}>
                  {socialLoading && comments.length === 0 ? (
                    <Text
                      style={[
                        textStyles.bodySm,
                        { color: theme.colors.on_surface_variant },
                      ]}
                    >
                      Loading comments...
                    </Text>
                  ) : comments.length === 0 ? (
                    <Text
                      style={[
                        textStyles.bodySm,
                        { color: theme.colors.on_surface_variant },
                      ]}
                    >
                      Be the first to comment
                    </Text>
                  ) : (
                    comments.map((c) => (
                      <View key={c.id} style={styles.commentRow}>
                        <Avatar
                          uri={c.user?.avatar_url ?? null}
                          name={c.user?.display_name}
                          size={30}
                        />
                        <View
                          style={[
                            styles.commentBubble,
                            {
                              backgroundColor: theme.colors.surface_container,
                            },
                          ]}
                        >
                          <View style={styles.commentMetaRow}>
                            <Text
                              style={[
                                textStyles.labelSm,
                                { color: theme.colors.on_surface },
                              ]}
                            >
                              {c.user?.display_name ?? "Squad member"}
                            </Text>
                          </View>
                          <Text
                            style={[
                              textStyles.bodySm,
                              {
                                color: theme.colors.on_surface,
                                marginTop: spacing[1],
                              },
                            ]}
                          >
                            {c.body}
                          </Text>
                        </View>
                      </View>
                    ))
                  )}
                </View>

                {dbUser && (
                  <View style={styles.commentInputRow}>
                    <Avatar
                      uri={dbUser.avatar_url}
                      name={dbUser.display_name}
                      size={30}
                    />
                    <View
                      style={[
                        styles.commentInputShell,
                        { backgroundColor: theme.colors.surface_container },
                      ]}
                    >
                      <TextInput
                        style={styles.commentInput}
                        placeholder="Add a comment"
                        placeholderTextColor={theme.colors.on_surface_muted}
                        value={commentText}
                        onChangeText={setCommentText}
                        multiline
                      />
                      <TouchableOpacity
                        onPress={handleAddComment}
                        disabled={!commentText.trim() || submittingComment}
                        style={[
                          styles.commentSendBtn,
                          {
                            backgroundColor: commentText.trim()
                              ? accentColor
                              : theme.colors.surface_container,
                          },
                        ]}
                      >
                        <Ionicons
                          name="send"
                          size={16}
                          color={
                            commentText.trim()
                              ? "#fff"
                              : theme.colors.on_surface_muted
                          }
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </GlassCard>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
          <View style={[styles.prBadge, { backgroundColor: accentColor }]}>
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
  photoCard: {
    padding: 0,
    overflow: "hidden",
  },
  photoImage: {
    width: "100%",
    height: 220,
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
  socialCard: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
  },
  socialHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  likePill: {
    borderRadius: 999,
    borderWidth: 1,
  },
  likeButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[2],
  },
  socialMetaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  socialDivider: {
    height: StyleSheet.hairlineWidth,
    marginTop: spacing[3],
    marginBottom: spacing[3],
  },
  commentsList: {
    gap: spacing[2],
  },
  commentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[2],
  },
  commentBubble: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
  },
  commentMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing[2],
    marginTop: spacing[3],
  },
  commentInputShell: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 999,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  commentInput: {
    flex: 1,
    minHeight: 32,
    maxHeight: 80,
  },
  commentSendBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing[2],
  },
});
