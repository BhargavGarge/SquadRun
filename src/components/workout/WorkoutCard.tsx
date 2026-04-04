// Workout card for activity feeds and history

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import GlassCard from '../common/GlassCard';
import Avatar from '../common/Avatar';
import { useTheme } from '../../contexts/ThemeContext';
import { textStyles } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import type { Workout, WorkoutType } from '../../types';

const TYPE_CONFIG: Record<WorkoutType, { emoji: string; label: string; colorKey: string }> = {
  run: { emoji: '🏃', label: 'Run', colorKey: 'workout_run' },
  cycle: { emoji: '🚴', label: 'Cycle', colorKey: 'workout_cycle' },
  swim: { emoji: '🏊', label: 'Swim', colorKey: 'workout_swim' },
  strength: { emoji: '💪', label: 'Strength', colorKey: 'workout_strength' },
  yoga: { emoji: '🧘', label: 'Yoga', colorKey: 'workout_yoga' },
  hike: { emoji: '🥾', label: 'Hike', colorKey: 'workout_hike' },
  other: { emoji: '⚡', label: 'Workout', colorKey: 'workout_other' },
};

interface WorkoutCardProps {
  workout: Workout;
  showUser?: boolean;
  onPress?: () => void;
}

export default function WorkoutCard({ workout, showUser = false, onPress }: WorkoutCardProps) {
  const { theme } = useTheme();
  const config = TYPE_CONFIG[workout.type] ?? TYPE_CONFIG.other;
  const accentColor = (theme.colors as any)[config.colorKey] ?? theme.colors.primary;

  const stats: { label: string; value: string }[] = [];
  if (workout.distance_km) stats.push({ label: 'Distance', value: `${workout.distance_km} km` });
  if (workout.duration_minutes) stats.push({ label: 'Time', value: `${workout.duration_minutes} min` });
  if (workout.calories) stats.push({ label: 'Calories', value: `${workout.calories} kcal` });

  return (
    <GlassCard onPress={onPress} style={styles.card} padding={0}>
      {/* Color accent bar on left */}
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

      <View style={styles.inner}>
        {/* Header */}
        <View style={styles.header}>
          <View
            style={[
              styles.typeTag,
              { backgroundColor: `${accentColor}22`, borderColor: `${accentColor}44` },
            ]}
          >
            <Text style={{ fontSize: 16 }}>{config.emoji}</Text>
            <Text style={[textStyles.labelMd, { color: accentColor }]}>
              {config.label}
            </Text>
          </View>

          <Text style={[textStyles.bodySm, { color: theme.colors.on_surface_variant }]}>
            {format(new Date(workout.logged_at), 'MMM d, h:mm a')}
          </Text>
        </View>

        {/* Title */}
        {workout.title && (
          <Text
            style={[textStyles.titleLg, { color: theme.colors.on_surface, marginTop: spacing[1] }]}
            numberOfLines={1}
          >
            {workout.title}
          </Text>
        )}

        {/* Stats row */}
        {stats.length > 0 && (
          <View style={styles.statsRow}>
            {stats.map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 && (
                  <View style={[styles.statDivider, { backgroundColor: theme.colors.outline }]} />
                )}
                <View style={styles.stat}>
                  <Text style={[textStyles.headlineSm, { color: theme.colors.on_surface }]}>
                    {s.value}
                  </Text>
                  <Text style={[textStyles.labelSm, { color: theme.colors.on_surface_variant }]}>
                    {s.label}
                  </Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        )}

        {/* Notes */}
        {workout.notes && (
          <Text
            style={[textStyles.bodySm, { color: theme.colors.on_surface_variant, marginTop: spacing[2] }]}
            numberOfLines={2}
          >
            {workout.notes}
          </Text>
        )}

        {/* User attribution */}
        {showUser && workout.user && (
          <View style={styles.userRow}>
            <Avatar uri={workout.user.avatar_url} name={workout.user.display_name} size={20} />
            <Text style={[textStyles.bodySm, { color: theme.colors.on_surface_variant }]}>
              {workout.user.display_name}
            </Text>
          </View>
        )}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
  accentBar: {
    width: 4,
  },
  inner: {
    flex: 1,
    padding: spacing[4],
    gap: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: spacing[3],
    gap: spacing[3],
  },
  statDivider: {
    width: 1,
    height: 32,
    alignSelf: 'center',
  },
  stat: {
    alignItems: 'flex-start',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing[2],
  },
});
