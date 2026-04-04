// Create a new squad goal with target, unit, dates, and workout types

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { addDays, format } from 'date-fns';

import Input from '../../components/common/Input';
import GradientButton from '../../components/common/GradientButton';
import GlassCard from '../../components/common/GlassCard';
import Chip from '../../components/common/Chip';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuthContext } from '../../contexts/AuthContext';
import { useSquadStore } from '../../contexts/SquadContext';
import { goalsApi, activityApi } from '../../services/supabase';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import type { WorkoutType, GoalUnit } from '../../types';

const WORKOUT_TYPES: { type: WorkoutType; emoji: string; label: string }[] = [
  { type: 'run', emoji: '🏃', label: 'Run' },
  { type: 'cycle', emoji: '🚴', label: 'Cycle' },
  { type: 'swim', emoji: '🏊', label: 'Swim' },
  { type: 'strength', emoji: '💪', label: 'Strength' },
  { type: 'yoga', emoji: '🧘', label: 'Yoga' },
  { type: 'hike', emoji: '🥾', label: 'Hike' },
  { type: 'other', emoji: '⚡', label: 'Other' },
];

const UNITS: { unit: GoalUnit; label: string; hint: string }[] = [
  { unit: 'km', label: 'Kilometers', hint: 'Total distance (e.g. 200 km)' },
  { unit: 'hours', label: 'Hours', hint: 'Total active time (e.g. 30 hrs)' },
  { unit: 'sessions', label: 'Sessions', hint: 'Number of workouts (e.g. 60)' },
  { unit: 'calories', label: 'Calories', hint: 'Total energy burned (e.g. 50000)' },
];

const DURATION_PRESETS = [
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
  { label: '1 month', days: 30 },
  { label: '2 months', days: 60 },
];

export default function CreateGoalScreen() {
  const { theme } = useTheme();
  const { dbUser } = useAuthContext();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { squadId } = route.params;
  const { refreshGoal } = useSquadStore();

  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [unit, setUnit] = useState<GoalUnit>('km');
  const [selectedTypes, setSelectedTypes] = useState<WorkoutType[]>(['run', 'cycle', 'hike']);
  const [durationDays, setDurationDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleType = (type: WorkoutType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleCreate = async () => {
    if (!dbUser || !title.trim() || !target || !selectedTypes.length) return;
    setError('');
    setLoading(true);

    try {
      const now = new Date();
      const endsAt = addDays(now, durationDays);

      const goal = await goalsApi.create({
        squad_id: squadId,
        title: title.trim(),
        description: null,
        target_value: parseFloat(target),
        unit,
        workout_types: selectedTypes,
        starts_at: now.toISOString(),
        ends_at: endsAt.toISOString(),
        created_by: dbUser.id,
      });

      // Post to activity feed
      await activityApi.insert({
        squad_id: squadId,
        user_id: dbUser.id,
        kind: 'goal_set',
        payload: { goal_id: goal.id, goal_title: goal.title },
      });

      await refreshGoal();
      navigation.goBack();
    } catch (err: any) {
      setError(err.message ?? 'Failed to create goal.');
    } finally {
      setLoading(false);
    }
  };

  const startDate = new Date();
  const endDate = addDays(startDate, durationDays);

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={theme.colors.on_surface} />
              </TouchableOpacity>
              <Text style={[textStyles.headlineMd, { color: theme.colors.on_surface }]}>
                New Goal 🎯
              </Text>
              <View style={{ width: 40 }} />
            </View>

            <View style={styles.section}>
              <Input
                label="Goal Title"
                placeholder="e.g. Run 200km this month"
                value={title}
                onChangeText={setTitle}
                leftIcon="flag-outline"
                maxLength={60}
              />
            </View>

            {/* Unit selector */}
            <View style={styles.section}>
              <Text style={[textStyles.labelMd, { color: theme.colors.on_surface_variant, marginBottom: spacing[3] }]}>
                Measure by
              </Text>
              <View style={styles.chipRow}>
                {UNITS.map((u) => (
                  <Chip
                    key={u.unit}
                    label={u.label}
                    selected={unit === u.unit}
                    onPress={() => setUnit(u.unit)}
                    color={theme.colors.primary_light}
                  />
                ))}
              </View>
              <Text style={[textStyles.bodySm, { color: theme.colors.on_surface_variant, marginTop: spacing[2] }]}>
                {UNITS.find(u => u.unit === unit)?.hint}
              </Text>
            </View>

            {/* Target value */}
            <View style={styles.section}>
              <Input
                label={`Target (${unit})`}
                placeholder={unit === 'km' ? '200' : unit === 'hours' ? '30' : unit === 'sessions' ? '60' : '50000'}
                value={target}
                onChangeText={setTarget}
                keyboardType="numeric"
                leftIcon="trending-up-outline"
                error={error}
              />
            </View>

            {/* Workout types */}
            <View style={styles.section}>
              <Text style={[textStyles.labelMd, { color: theme.colors.on_surface_variant, marginBottom: spacing[3] }]}>
                Count These Workouts
              </Text>
              <View style={styles.chipRow}>
                {WORKOUT_TYPES.map((t) => (
                  <Chip
                    key={t.type}
                    label={`${t.emoji} ${t.label}`}
                    selected={selectedTypes.includes(t.type)}
                    onPress={() => toggleType(t.type)}
                    color={theme.colors.success}
                  />
                ))}
              </View>
            </View>

            {/* Duration */}
            <View style={styles.section}>
              <Text style={[textStyles.labelMd, { color: theme.colors.on_surface_variant, marginBottom: spacing[3] }]}>
                Duration
              </Text>
              <View style={styles.chipRow}>
                {DURATION_PRESETS.map((p) => (
                  <Chip
                    key={p.days}
                    label={p.label}
                    selected={durationDays === p.days}
                    onPress={() => setDurationDays(p.days)}
                    color={theme.colors.secondary}
                  />
                ))}
              </View>
              <Text style={[textStyles.bodySm, { color: theme.colors.on_surface_variant, marginTop: spacing[3] }]}>
                {format(startDate, 'MMM d')} → {format(endDate, 'MMM d, yyyy')} · {durationDays} days
              </Text>
            </View>

            <View style={styles.section}>
              <GradientButton
                label="Set Goal 🎯"
                onPress={handleCreate}
                loading={loading}
                disabled={!title.trim() || !target || selectedTypes.length === 0}
                size="lg"
              />
            </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
  },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  section: { paddingHorizontal: spacing[4], marginBottom: spacing[5] },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
});
