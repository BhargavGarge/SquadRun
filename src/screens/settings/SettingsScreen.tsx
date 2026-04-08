// Settings screen — profile edit, notifications, theme toggle

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  StatusBar,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import GlassCard from "../../components/common/GlassCard";
import Input from "../../components/common/Input";
import GradientButton from "../../components/common/GradientButton";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuthContext } from "../../contexts/AuthContext";
import { usersApi } from "../../services/supabase";
import {
  scheduleWorkoutReminder,
  cancelAllNotifications,
} from "../../services/notifications";
import type { FitnessLevel, WorkoutType } from "../../types";
import { textStyles } from "../../theme/typography";
import { spacing } from "../../theme/spacing";

const FITNESS_LEVELS: FitnessLevel[] = ["beginner", "intermediate", "advanced"];

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  rightElement,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={styles.settingsRow}
    >
      <View
        style={[
          styles.rowIcon,
          { backgroundColor: theme.colors.surface_container_high },
        ]}
      >
        <Text style={{ fontSize: 16 }}>{icon}</Text>
      </View>
      <Text
        style={[
          textStyles.titleMd,
          { color: theme.colors.on_surface, flex: 1 },
        ]}
      >
        {label}
      </Text>
      {value && (
        <Text
          style={[
            textStyles.bodyMd,
            { color: theme.colors.on_surface_variant },
          ]}
        >
          {value}
        </Text>
      )}
      {rightElement}
      {onPress && !rightElement && (
        <Ionicons
          name="chevron-forward"
          size={16}
          color={theme.colors.on_surface_variant}
        />
      )}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const { dbUser, refreshUser } = useAuthContext();
  const navigation = useNavigation<any>();

  const [displayName, setDisplayName] = useState(dbUser?.display_name ?? "");
  const [bio, setBio] = useState(dbUser?.bio ?? "");
  const [fitnessLevel, setFitnessLevel] = useState<FitnessLevel>(
    dbUser?.fitness_level ?? "intermediate",
  );
  const [preferredUnits, setPreferredUnits] = useState<"km" | "miles">(
    dbUser?.preferred_units ?? "km",
  );
  const [defaultWorkoutType, setDefaultWorkoutType] = useState<WorkoutType>(
    dbUser?.default_workout_type ?? "run",
  );
  const [remindersEnabled, setRemindersEnabled] = useState(
    dbUser?.notify_daily_reminder ?? false,
  );
  const [reminderHour, setReminderHour] = useState(
    String(dbUser?.notify_daily_hour ?? 7).padStart(2, "0"),
  );
  const [squadActivityEnabled, setSquadActivityEnabled] = useState(
    dbUser?.notify_squad_activity ?? true,
  );
  const [shareWorkoutsToSquad, setShareWorkoutsToSquad] = useState(
    dbUser?.share_workouts_to_squad ?? true,
  );
  const [showInLeaderboards, setShowInLeaderboards] = useState(
    dbUser?.show_in_leaderboards ?? true,
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!dbUser) return;
    setSaving(true);
    try {
      await usersApi.update(dbUser.id, {
        display_name: displayName.trim(),
        bio: bio.trim() || null,
        fitness_level: fitnessLevel,
        preferred_units: preferredUnits,
        default_workout_type: defaultWorkoutType,
        notify_squad_activity: squadActivityEnabled,
        share_workouts_to_squad: shareWorkoutsToSquad,
        show_in_leaderboards: showInLeaderboards,
      });
      await refreshUser();
      Alert.alert("Saved", "Profile updated successfully.");
    } catch (err) {
      Alert.alert("Error", "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleReminders = async (value: boolean) => {
    setRemindersEnabled(value);
    if (value) {
      await scheduleWorkoutReminder(parseInt(reminderHour), 0);
      if (dbUser) {
        await usersApi.update(dbUser.id, {
          notify_daily_reminder: true,
          notify_daily_hour: parseInt(reminderHour, 10) || 7,
        });
        await refreshUser();
      }
    } else {
      await cancelAllNotifications();
      if (dbUser) {
        await usersApi.update(dbUser.id, {
          notify_daily_reminder: false,
        });
        await refreshUser();
      }
    }
  };

  const cycleReminderHour = async () => {
    const current = parseInt(reminderHour, 10) || 7;
    const options = [6, 7, 8, 9, 18, 20];
    const idx = options.indexOf(current);
    const next = options[(idx + 1) % options.length];
    const nextStr = String(next).padStart(2, "0");
    setReminderHour(nextStr);

    if (dbUser) {
      await usersApi.update(dbUser.id, {
        notify_daily_hour: next,
      });
      await refreshUser();
    }

    if (remindersEnabled) {
      await cancelAllNotifications();
      await scheduleWorkoutReminder(next, 0);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={theme.colors.on_surface}
            />
          </TouchableOpacity>
          <Text
            style={[textStyles.headlineMd, { color: theme.colors.on_surface }]}
          >
            Settings
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* Profile */}
          <Text
            style={[
              textStyles.labelMd,
              styles.sectionLabel,
              { color: theme.colors.on_surface_variant },
            ]}
          >
            Profile
          </Text>
          <GlassCard style={styles.card}>
            <View style={styles.formSection}>
              <Input
                label="Display Name"
                value={displayName}
                onChangeText={setDisplayName}
                leftIcon="person-outline"
                maxLength={40}
              />
              <Input
                label="Bio"
                value={bio}
                onChangeText={setBio}
                leftIcon="text-outline"
                maxLength={120}
                multiline
                numberOfLines={3}
                style={{ height: 72, paddingTop: 10 }}
              />

              {/* Fitness level */}
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
                  Fitness Level
                </Text>
                <View style={styles.levelRow}>
                  {FITNESS_LEVELS.map((level) => (
                    <TouchableOpacity
                      key={level}
                      onPress={() => setFitnessLevel(level)}
                      style={[
                        styles.levelBtn,
                        {
                          backgroundColor:
                            fitnessLevel === level
                              ? `${theme.colors.primary}33`
                              : theme.colors.surface_container_high,
                          borderColor:
                            fitnessLevel === level
                              ? theme.colors.primary
                              : "transparent",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          textStyles.labelMd,
                          {
                            color:
                              fitnessLevel === level
                                ? theme.colors.primary_light
                                : theme.colors.on_surface_variant,
                          },
                        ]}
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Preferences */}
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
                  Preferences
                </Text>
                <View style={styles.prefRow}>
                  <Text
                    style={[
                      textStyles.bodyMd,
                      { color: theme.colors.on_surface, flex: 1 },
                    ]}
                  >
                    Distance units
                  </Text>
                  <View style={styles.togglePillGroup}>
                    <TouchableOpacity
                      onPress={() => setPreferredUnits("km")}
                      style={[
                        styles.togglePill,
                        {
                          backgroundColor:
                            preferredUnits === "km"
                              ? `${theme.colors.primary}22`
                              : theme.colors.surface_container_high,
                          borderColor:
                            preferredUnits === "km"
                              ? theme.colors.primary
                              : "transparent",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          textStyles.labelSm,
                          {
                            color:
                              preferredUnits === "km"
                                ? theme.colors.primary_light
                                : theme.colors.on_surface_variant,
                          },
                        ]}
                      >
                        Kilometers
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setPreferredUnits("miles")}
                      style={[
                        styles.togglePill,
                        {
                          backgroundColor:
                            preferredUnits === "miles"
                              ? `${theme.colors.primary}22`
                              : theme.colors.surface_container_high,
                          borderColor:
                            preferredUnits === "miles"
                              ? theme.colors.primary
                              : "transparent",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          textStyles.labelSm,
                          {
                            color:
                              preferredUnits === "miles"
                                ? theme.colors.primary_light
                                : theme.colors.on_surface_variant,
                          },
                        ]}
                      >
                        Miles
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={[styles.prefRow, { marginTop: spacing[3] }]}>
                  <Text
                    style={[
                      textStyles.bodyMd,
                      { color: theme.colors.on_surface, flex: 1 },
                    ]}
                  >
                    Default workout
                  </Text>
                  <View style={styles.togglePillGroup}>
                    <TouchableOpacity
                      onPress={() => setDefaultWorkoutType("run")}
                      style={[
                        styles.togglePill,
                        {
                          backgroundColor:
                            defaultWorkoutType === "run"
                              ? `${theme.colors.primary}22`
                              : theme.colors.surface_container_high,
                          borderColor:
                            defaultWorkoutType === "run"
                              ? theme.colors.primary
                              : "transparent",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          textStyles.labelSm,
                          {
                            color:
                              defaultWorkoutType === "run"
                                ? theme.colors.primary_light
                                : theme.colors.on_surface_variant,
                          },
                        ]}
                      >
                        Run
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setDefaultWorkoutType("cycle")}
                      style={[
                        styles.togglePill,
                        {
                          backgroundColor:
                            defaultWorkoutType === "cycle"
                              ? `${theme.colors.primary}22`
                              : theme.colors.surface_container_high,
                          borderColor:
                            defaultWorkoutType === "cycle"
                              ? theme.colors.primary
                              : "transparent",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          textStyles.labelSm,
                          {
                            color:
                              defaultWorkoutType === "cycle"
                                ? theme.colors.primary_light
                                : theme.colors.on_surface_variant,
                          },
                        ]}
                      >
                        Cycle
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <GradientButton
                label="Save Profile"
                onPress={handleSave}
                loading={saving}
                variant="primary"
                size="md"
              />
            </View>
          </GlassCard>

          {/* Appearance */}
          <Text
            style={[
              textStyles.labelMd,
              styles.sectionLabel,
              { color: theme.colors.on_surface_variant },
            ]}
          >
            Appearance
          </Text>
          <GlassCard style={styles.card} padding={0}>
            <SettingsRow
              icon="🌙"
              label="Dark Mode"
              rightElement={
                <Switch
                  value={isDark}
                  onValueChange={toggleTheme}
                  trackColor={{
                    false: theme.colors.outline,
                    true: theme.colors.primary,
                  }}
                  thumbColor={
                    isDark
                      ? theme.colors.primary_light
                      : theme.colors.on_surface_variant
                  }
                />
              }
            />
          </GlassCard>

          {/* Privacy */}
          <Text
            style={[
              textStyles.labelMd,
              styles.sectionLabel,
              { color: theme.colors.on_surface_variant },
            ]}
          >
            Privacy
          </Text>
          <GlassCard style={styles.card} padding={0}>
            <SettingsRow
              icon="📤"
              label="Share workouts to squad"
              value={shareWorkoutsToSquad ? "On" : "Off"}
              rightElement={
                <Switch
                  value={shareWorkoutsToSquad}
                  onValueChange={async (value) => {
                    setShareWorkoutsToSquad(value);
                    if (dbUser) {
                      await usersApi.update(dbUser.id, {
                        share_workouts_to_squad: value,
                      });
                      await refreshUser();
                    }
                  }}
                  trackColor={{
                    false: theme.colors.outline,
                    true: theme.colors.primary,
                  }}
                  thumbColor={
                    shareWorkoutsToSquad
                      ? theme.colors.primary_light
                      : theme.colors.on_surface_variant
                  }
                />
              }
            />
            <View
              style={[
                styles.divider,
                { backgroundColor: theme.colors.outline },
              ]}
            />
            <SettingsRow
              icon="🏅"
              label="Show me in leaderboards"
              value={showInLeaderboards ? "On" : "Off"}
              rightElement={
                <Switch
                  value={showInLeaderboards}
                  onValueChange={async (value) => {
                    setShowInLeaderboards(value);
                    if (dbUser) {
                      await usersApi.update(dbUser.id, {
                        show_in_leaderboards: value,
                      });
                      await refreshUser();
                    }
                  }}
                  trackColor={{
                    false: theme.colors.outline,
                    true: theme.colors.primary,
                  }}
                  thumbColor={
                    showInLeaderboards
                      ? theme.colors.primary_light
                      : theme.colors.on_surface_variant
                  }
                />
              }
            />
          </GlassCard>

          {/* Notifications */}
          <Text
            style={[
              textStyles.labelMd,
              styles.sectionLabel,
              { color: theme.colors.on_surface_variant },
            ]}
          >
            Notifications
          </Text>
          <GlassCard style={styles.card} padding={0}>
            <SettingsRow
              icon="⏰"
              label="Daily Reminder"
              value={remindersEnabled ? `${reminderHour}:00` : "Off"}
              onPress={cycleReminderHour}
              rightElement={
                <Switch
                  value={remindersEnabled}
                  onValueChange={handleToggleReminders}
                  trackColor={{
                    false: theme.colors.outline,
                    true: theme.colors.primary,
                  }}
                  thumbColor={
                    remindersEnabled
                      ? theme.colors.primary_light
                      : theme.colors.on_surface_variant
                  }
                />
              }
            />
            <View
              style={[
                styles.divider,
                { backgroundColor: theme.colors.outline },
              ]}
            />
            <SettingsRow
              icon="📣"
              label="Squad Activity"
              value={squadActivityEnabled ? "Enabled" : "Muted"}
              rightElement={
                <Switch
                  value={squadActivityEnabled}
                  onValueChange={async (value) => {
                    setSquadActivityEnabled(value);
                    if (dbUser) {
                      await usersApi.update(dbUser.id, {
                        notify_squad_activity: value,
                      });
                      await refreshUser();
                    }
                  }}
                  trackColor={{
                    false: theme.colors.outline,
                    true: theme.colors.primary,
                  }}
                  thumbColor={
                    squadActivityEnabled
                      ? theme.colors.primary_light
                      : theme.colors.on_surface_variant
                  }
                />
              }
            />
          </GlassCard>

          {/* About */}
          <Text
            style={[
              textStyles.labelMd,
              styles.sectionLabel,
              { color: theme.colors.on_surface_variant },
            ]}
          >
            About
          </Text>
          <GlassCard style={styles.card} padding={0}>
            <SettingsRow icon="ℹ️" label="Version" value="1.0.0" />
            <View
              style={[
                styles.divider,
                { backgroundColor: theme.colors.outline },
              ]}
            />
            <SettingsRow
              icon="📝"
              label="Privacy Policy"
              onPress={() =>
                Linking.openURL("https://squadrun.example.com/privacy").catch(
                  () => {},
                )
              }
            />
            <View
              style={[
                styles.divider,
                { backgroundColor: theme.colors.outline },
              ]}
            />
            <SettingsRow
              icon="⚖️"
              label="Terms of Service"
              onPress={() =>
                Linking.openURL("https://squadrun.example.com/terms").catch(
                  () => {},
                )
              }
            />
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { paddingHorizontal: spacing[4], paddingBottom: spacing[20] },
  sectionLabel: { marginTop: spacing[5], marginBottom: spacing[3] },
  card: { marginBottom: 0 },
  formSection: { gap: spacing[4] },
  prefRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  levelRow: { flexDirection: "row", gap: spacing[2] },
  levelBtn: {
    flex: 1,
    paddingVertical: spacing[2],
    borderRadius: 0,
    alignItems: "center",
    borderWidth: 1.5,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    minHeight: 52,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: 1,
    marginHorizontal: spacing[4],
    opacity: 0.3,
  },
  togglePillGroup: {
    flexDirection: "row",
    gap: spacing[1],
  },
  togglePill: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: 999,
    borderWidth: 1,
  },
});
