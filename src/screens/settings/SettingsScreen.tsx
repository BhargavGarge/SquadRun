// Settings screen — profile edit, notifications, theme toggle

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import GlassCard from '../../components/common/GlassCard';
import Input from '../../components/common/Input';
import GradientButton from '../../components/common/GradientButton';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuthContext } from '../../contexts/AuthContext';
import { usersApi } from '../../services/supabase';
import { scheduleWorkoutReminder, cancelAllNotifications } from '../../services/notifications';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import type { FitnessLevel } from '../../types';

const FITNESS_LEVELS: FitnessLevel[] = ['beginner', 'intermediate', 'advanced'];

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
      <View style={[styles.rowIcon, { backgroundColor: theme.colors.surface_container_high }]}>
        <Text style={{ fontSize: 16 }}>{icon}</Text>
      </View>
      <Text style={[textStyles.titleMd, { color: theme.colors.on_surface, flex: 1 }]}>
        {label}
      </Text>
      {value && (
        <Text style={[textStyles.bodyMd, { color: theme.colors.on_surface_variant }]}>
          {value}
        </Text>
      )}
      {rightElement}
      {onPress && !rightElement && (
        <Ionicons name="chevron-forward" size={16} color={theme.colors.on_surface_variant} />
      )}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const { dbUser, refreshUser } = useAuthContext();
  const navigation = useNavigation<any>();

  const [displayName, setDisplayName] = useState(dbUser?.display_name ?? '');
  const [bio, setBio] = useState(dbUser?.bio ?? '');
  const [fitnessLevel, setFitnessLevel] = useState<FitnessLevel>(
    dbUser?.fitness_level ?? 'intermediate'
  );
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [reminderHour, setReminderHour] = useState('07');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!dbUser) return;
    setSaving(true);
    try {
      await usersApi.update(dbUser.id, {
        display_name: displayName.trim(),
        bio: bio.trim() || null,
        fitness_level: fitnessLevel,
      });
      await refreshUser();
      Alert.alert('Saved', 'Profile updated successfully.');
    } catch (err) {
      Alert.alert('Error', 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleReminders = async (value: boolean) => {
    setRemindersEnabled(value);
    if (value) {
      await scheduleWorkoutReminder(parseInt(reminderHour), 0);
    } else {
      await cancelAllNotifications();
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={theme.colors.on_surface} />
          </TouchableOpacity>
          <Text style={[textStyles.headlineMd, { color: theme.colors.on_surface }]}>
            Settings
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Profile */}
          <Text style={[textStyles.labelMd, styles.sectionLabel, { color: theme.colors.on_surface_variant }]}>
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
                <Text style={[textStyles.labelMd, { color: theme.colors.on_surface_variant, marginBottom: spacing[2] }]}>
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
                              : 'transparent',
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
          <Text style={[textStyles.labelMd, styles.sectionLabel, { color: theme.colors.on_surface_variant }]}>
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
                  trackColor={{ false: theme.colors.outline, true: theme.colors.primary }}
                  thumbColor={isDark ? theme.colors.primary_light : theme.colors.on_surface_variant}
                />
              }
            />
          </GlassCard>

          {/* Notifications */}
          <Text style={[textStyles.labelMd, styles.sectionLabel, { color: theme.colors.on_surface_variant }]}>
            Notifications
          </Text>
          <GlassCard style={styles.card} padding={0}>
            <SettingsRow
              icon="⏰"
              label="Daily Reminder"
              value={remindersEnabled ? `${reminderHour}:00` : 'Off'}
              rightElement={
                <Switch
                  value={remindersEnabled}
                  onValueChange={handleToggleReminders}
                  trackColor={{ false: theme.colors.outline, true: theme.colors.primary }}
                  thumbColor={remindersEnabled ? theme.colors.primary_light : theme.colors.on_surface_variant}
                />
              }
            />
            <View style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
            <SettingsRow
              icon="📣"
              label="Squad Activity"
              value="Enabled"
            />
          </GlassCard>

          {/* About */}
          <Text style={[textStyles.labelMd, styles.sectionLabel, { color: theme.colors.on_surface_variant }]}>
            About
          </Text>
          <GlassCard style={styles.card} padding={0}>
            <SettingsRow icon="ℹ️" label="Version" value="1.0.0" />
            <View style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
            <SettingsRow icon="📝" label="Privacy Policy" onPress={() => {}} />
            <View style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
            <SettingsRow icon="⚖️" label="Terms of Service" onPress={() => {}} />
          </GlassCard>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: spacing[4], paddingBottom: spacing[20] },
  sectionLabel: { marginTop: spacing[5], marginBottom: spacing[3] },
  card: { marginBottom: 0 },
  formSection: { gap: spacing[4] },
  levelRow: { flexDirection: 'row', gap: spacing[2] },
  levelBtn: {
    flex: 1,
    paddingVertical: spacing[2],
    borderRadius: 0,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    minHeight: 52,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    marginHorizontal: spacing[4],
    opacity: 0.3,
  },
});
