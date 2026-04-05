// ─────────────────────────────────────────────────────────────
// LogWorkoutScreen — log a new workout with type, stats, notes.
// Animated workout type selector and success celebration.
// ─────────────────────────────────────────────────────────────

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import Input from "../../components/common/Input";
import GradientButton from "../../components/common/GradientButton";
import GlassCard from "../../components/common/GlassCard";
import RouteMapCard from "../../components/workout/RouteMapCard";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuthContext } from "../../contexts/AuthContext";
import { useSquadStore } from "../../contexts/SquadContext";
import { workoutsApi, activityApi, notifySquadMembers } from "../../services/supabase";
import { sendLocalNotification } from "../../services/notifications";
import { textStyles } from "../../theme/typography";
import { spacing, radius } from "../../theme/spacing";
import type { WorkoutType, RouteCoord } from "../../types";

const WORKOUT_TYPES: {
  type: WorkoutType;
  emoji: string;
  label: string;
  colorKey: string;
}[] = [
  { type: "run", emoji: "🏃", label: "Run", colorKey: "workout_run" },
  { type: "cycle", emoji: "🚴", label: "Cycle", colorKey: "workout_cycle" },
  { type: "swim", emoji: "🏊", label: "Swim", colorKey: "workout_swim" },
  {
    type: "strength",
    emoji: "💪",
    label: "Strength",
    colorKey: "workout_strength",
  },
  { type: "yoga", emoji: "🧘", label: "Yoga", colorKey: "workout_yoga" },
  { type: "hike", emoji: "🥾", label: "Hike", colorKey: "workout_hike" },
  { type: "other", emoji: "⚡", label: "Other", colorKey: "workout_other" },
];

export default function LogWorkoutScreen() {
  const { theme } = useTheme();
  const { dbUser } = useAuthContext();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { squadId, goalId, prefill } = route.params ?? {};

  const { activeSquad, activeGoal, refreshGoal } = useSquadStore();
  const resolvedSquadId = squadId ?? activeSquad?.id ?? null;
  const resolvedGoalId = goalId ?? activeGoal?.id ?? null;

  // prefill comes from ActiveWorkoutScreen after a GPS-tracked session
  const prefillData: {
    type?: WorkoutType;
    distance_km?: number;
    duration_minutes?: number;
    steps?: number;
    route_coords?: RouteCoord[];
  } | undefined = prefill;

  const [type, setType] = useState<WorkoutType>(prefillData?.type ?? "run");
  const [title, setTitle] = useState("");
  const [distance, setDistance] = useState(
    prefillData?.distance_km != null ? String(prefillData.distance_km) : ""
  );
  const [duration, setDuration] = useState(
    prefillData?.duration_minutes != null ? String(prefillData.duration_minutes) : ""
  );
  const [calories, setCalories] = useState("");
  const [steps] = useState(prefillData?.steps ?? 0);
  const [routeCoords] = useState<RouteCoord[]>(prefillData?.route_coords ?? []);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Celebration scale animation
  const celebrationScale = useSharedValue(0);
  const celebrationStyle = useAnimatedStyle(() => ({
    transform: [{ scale: celebrationScale.value }],
    opacity: celebrationScale.value,
  }));

  const handleLog = async () => {
    if (!dbUser) return;
    setLoading(true);

    try {
      const workout = await workoutsApi.log({
        user_id: dbUser.id,
        squad_id: resolvedSquadId,
        goal_id: resolvedGoalId,
        type,
        title: title.trim() || null,
        distance_km: distance ? parseFloat(distance) : null,
        duration_minutes: duration ? parseFloat(duration) : null,
        calories: calories ? parseFloat(calories) : null,
        steps: steps || null,
        route_coords: routeCoords.length >= 2 ? routeCoords : null,
        notes: notes.trim() || null,
        logged_at: new Date().toISOString(),
      });

      // Post to activity feed if squad is set
      if (resolvedSquadId) {
        await activityApi.insert({
          squad_id: resolvedSquadId,
          user_id: dbUser.id,
          kind: "workout",
          payload: {
            workout_id: workout.id,
            type: workout.type,
            distance_km: workout.distance_km,
            duration_minutes: workout.duration_minutes,
            steps: workout.steps,
            route_coords: workout.route_coords,
          },
        });

        // Refresh goal progress
        if (resolvedGoalId) await refreshGoal();

        // Notify squad members in-app (DB insert) + local push for foreground
        const typeInfo = WORKOUT_TYPES.find((t) => t.type === type);
        const notifTitle = "Workout logged!";
        const notifBody  = `${dbUser.display_name} just logged a ${typeInfo?.label.toLowerCase() ?? type}`;
        // Fire-and-forget — don't block the save flow
        notifySquadMembers(
          resolvedSquadId,
          dbUser.id,
          'workout_logged',
          notifTitle,
          notifBody,
          { workout_id: workout.id, squad_id: resolvedSquadId },
        ).catch(console.warn);
        await sendLocalNotification(notifTitle, notifBody);
      }

      // Trigger celebration
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      celebrationScale.value = withSequence(
        withSpring(1.2, { damping: 8 }),
        withSpring(1, { damping: 10 }),
      );
      setSaved(true);

      // Auto-close after 1.5s
      setTimeout(() => navigation.goBack(), 1500);
    } catch (err: any) {
      console.error("[LogWorkout] error:", err);
    } finally {
      setLoading(false);
    }
  };

  const selectedConfig = WORKOUT_TYPES.find((t) => t.type === type)!;
  const accentColor =
    (theme.colors as any)[selectedConfig.colorKey] ?? theme.colors.primary;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.closeBtn}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={theme.colors.on_surface}
                />
              </TouchableOpacity>
              <Text
                style={[
                  textStyles.headlineMd,
                  { color: theme.colors.on_surface },
                ]}
              >
                Log Workout
              </Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Workout type selector */}
            <View style={styles.section}>
              <Text
                style={[
                  textStyles.labelMd,
                  {
                    color: theme.colors.on_surface_variant,
                    marginBottom: spacing[3],
                  },
                ]}
              >
                Workout Type
              </Text>
              <View style={styles.typeGrid}>
                {WORKOUT_TYPES.map((t) => {
                  const color =
                    (theme.colors as any)[t.colorKey] ?? theme.colors.primary;
                  const isSelected = type === t.type;
                  return (
                    <TouchableOpacity
                      key={t.type}
                      onPress={() => setType(t.type)}
                      style={[
                        styles.typeTile,
                        {
                          backgroundColor: isSelected
                            ? `${color}22`
                            : theme.colors.surface_container,
                          borderColor: isSelected ? color : "transparent",
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 28 }}>{t.emoji}</Text>
                      <Text
                        style={[
                          textStyles.labelMd,
                          {
                            color: isSelected
                              ? color
                              : theme.colors.on_surface_variant,
                            marginTop: spacing[1],
                          },
                        ]}
                      >
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Title */}
            <View style={styles.section}>
              <Input
                label="Title (optional)"
                placeholder={`e.g. Morning ${selectedConfig.label}`}
                value={title}
                onChangeText={setTitle}
                leftIcon="text-outline"
                maxLength={50}
              />
            </View>

            {/* Stats */}
            <View style={styles.section}>
              <Text
                style={[
                  textStyles.labelMd,
                  {
                    color: theme.colors.on_surface_variant,
                    marginBottom: spacing[3],
                  },
                ]}
              >
                Stats
              </Text>
              <View style={styles.statsRow}>
                {(type === "run" ||
                  type === "cycle" ||
                  type === "swim" ||
                  type === "hike") && (
                  <Input
                    label="Distance (km)"
                    placeholder="0.0"
                    value={distance}
                    onChangeText={setDistance}
                    keyboardType="decimal-pad"
                    containerStyle={{ flex: 1 }}
                  />
                )}
                <Input
                  label="Duration (min)"
                  placeholder="0"
                  value={duration}
                  onChangeText={setDuration}
                  keyboardType="number-pad"
                  containerStyle={{ flex: 1 }}
                />
              </View>
              <View style={[styles.statsRow, { marginTop: spacing[3] }]}>
                <Input
                  label="Calories"
                  placeholder="0"
                  value={calories}
                  onChangeText={setCalories}
                  keyboardType="number-pad"
                  containerStyle={{ flex: 1 }}
                />
              </View>
            </View>

            {/* Route map preview — shown when coming from ActiveWorkoutScreen */}
            {routeCoords.length >= 2 && (
              <View style={styles.section}>
                <Text
                  style={[
                    textStyles.labelMd,
                    {
                      color: theme.colors.on_surface_variant,
                      marginBottom: spacing[3],
                    },
                  ]}
                >
                  Route
                </Text>
                <RouteMapCard
                  coords={routeCoords}
                  strokeColor={accentColor}
                  height={180}
                />
                {steps > 0 && (
                  <GlassCard
                    padding={spacing[3]}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: spacing[3],
                      marginTop: spacing[3],
                    }}
                  >
                    <Text style={{ fontSize: 18 }}>👟</Text>
                    <Text
                      style={[
                        textStyles.bodyMd,
                        { color: theme.colors.on_surface },
                      ]}
                    >
                      {steps.toLocaleString()} steps recorded
                    </Text>
                  </GlassCard>
                )}
              </View>
            )}

            {/* Notes */}
            <View style={styles.section}>
              <Input
                label="Notes (optional)"
                placeholder="How did it feel? Any highlights?"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                style={{ height: 80, paddingTop: 12 }}
                maxLength={200}
              />
            </View>

            {/* Squad assignment */}
            {resolvedSquadId && (
              <View style={styles.section}>
                <GlassCard
                  padding={spacing[3]}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing[3],
                  }}
                >
                  <Ionicons
                    name="people-outline"
                    size={18}
                    color={accentColor}
                  />
                  <Text
                    style={[
                      textStyles.bodyMd,
                      { color: theme.colors.on_surface, flex: 1 },
                    ]}
                  >
                    This workout will count toward your squad
                    {activeGoal ? `'s goal: ${activeGoal.title}` : ""}
                  </Text>
                </GlassCard>
              </View>
            )}

            {/* Submit */}
            {!saved ? (
              <View style={styles.section}>
                <GradientButton
                  label="Save Workout 💪"
                  onPress={handleLog}
                  loading={loading}
                  disabled={!duration && !distance && !calories}
                  size="lg"
                />
              </View>
            ) : (
              <Animated.View style={[styles.celebration, celebrationStyle]}>
                <Text style={{ fontSize: 64 }}>🎉</Text>
                <Text
                  style={[
                    textStyles.headlineSm,
                    {
                      color: theme.colors.on_surface,
                      textAlign: "center",
                      marginTop: spacing[3],
                    },
                  ]}
                >
                  Workout saved!
                </Text>
                <Text
                  style={[
                    textStyles.bodyMd,
                    {
                      color: theme.colors.on_surface_variant,
                      textAlign: "center",
                      marginTop: spacing[2],
                    },
                  ]}
                >
                  Your squad has been notified
                </Text>
              </Animated.View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: spacing[8] },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  section: { paddingHorizontal: spacing[4], marginBottom: spacing[5] },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[3],
  },
  typeTile: {
    width: "30%",
    minWidth: 96,
    paddingVertical: spacing[3],
    borderRadius: radius.lg,
    alignItems: "center",
    borderWidth: 2,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing[3],
  },
  celebration: {
    alignItems: "center",
    paddingVertical: spacing[10],
  },
});
