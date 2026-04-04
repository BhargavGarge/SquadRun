// ─────────────────────────────────────────────────────────────
// SquadCard — glassmorphic card for the squad list.
// Shows squad name, member avatars, active goal progress,
// and streak badge.
// ─────────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import GlassCard from '../common/GlassCard';
import Avatar from '../common/Avatar';
import AnimatedProgressBar from '../common/AnimatedProgressBar';
import { useTheme } from '../../contexts/ThemeContext';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import type { Squad } from '../../types';

interface SquadCardProps {
  squad: Squad;
  goalProgress?: number;    // 0–100
  goalLabel?: string;
  streak?: number;
  onPress?: () => void;
}

export default function SquadCard({
  squad,
  goalProgress = 0,
  goalLabel,
  streak = 0,
  onPress,
}: SquadCardProps) {
  const { theme } = useTheme();
  const members = squad.members ?? [];

  return (
    <GlassCard
      onPress={onPress}
      elevated
      style={styles.card}
      borderRadius={24}
      padding={0}
    >
      {/* Header gradient accent */}
      <LinearGradient
        colors={[theme.colors.gradient_card_start, theme.colors.gradient_card_end]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={styles.content}>
        {/* Squad name + streak */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[textStyles.headlineSm, { color: theme.colors.on_surface }]}>
              {squad.name}
            </Text>
            {squad.description ? (
              <Text
                style={[
                  textStyles.bodySm,
                  { color: theme.colors.on_surface_variant, marginTop: 2 },
                ]}
                numberOfLines={1}
              >
                {squad.description}
              </Text>
            ) : null}
          </View>

          {streak > 0 && (
            <View
              style={[
                styles.streakBadge,
                { backgroundColor: `${theme.colors.secondary}22`, borderColor: `${theme.colors.secondary}44` },
              ]}
            >
              <Text style={{ fontSize: 14 }}>🔥</Text>
              <Text
                style={[
                  textStyles.titleSm,
                  { color: theme.colors.secondary },
                ]}
              >
                {streak}
              </Text>
            </View>
          )}
        </View>

        {/* Member avatar stack */}
        <View style={styles.avatarRow}>
          {members.slice(0, 5).map((m, i) => (
            <Avatar
              key={m.id}
              uri={m.user?.avatar_url}
              name={m.user?.display_name}
              size={32}
              showBorder
              borderColor={theme.colors.surface}
              style={{ marginLeft: i === 0 ? 0 : -10, zIndex: 5 - i }}
            />
          ))}
          {members.length > 5 && (
            <View
              style={[
                styles.moreAvatars,
                {
                  backgroundColor: theme.colors.surface_container_highest,
                  borderColor: theme.colors.surface,
                  marginLeft: -10,
                },
              ]}
            >
              <Text style={[textStyles.labelSm, { color: theme.colors.on_surface_variant }]}>
                +{members.length - 5}
              </Text>
            </View>
          )}
          <Text
            style={[
              textStyles.bodySm,
              { color: theme.colors.on_surface_variant, marginLeft: 10 },
            ]}
          >
            {members.length}/{squad.max_members} members
          </Text>
        </View>

        {/* Goal progress */}
        {goalLabel && (
          <View style={{ marginTop: spacing[3] }}>
            <AnimatedProgressBar
              progress={goalProgress}
              height={8}
              showLabel
              labelLeft="SQUAD GOAL"
              labelRight={`${Math.round(goalProgress)}%`}
            />
            <Text
              style={[
                textStyles.bodySm,
                { color: theme.colors.on_surface_variant, marginTop: 4 },
              ]}
              numberOfLines={1}
            >
              {goalLabel}
            </Text>
          </View>
        )}

        {/* No active goal prompt */}
        {!goalLabel && (
          <View style={[styles.noGoal, { borderColor: theme.colors.outline }]}>
            <Ionicons name="flag-outline" size={14} color={theme.colors.on_surface_variant} />
            <Text style={[textStyles.bodySm, { color: theme.colors.on_surface_variant }]}>
              No active goal — tap to create one
            </Text>
          </View>
        )}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden' },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  content: {
    padding: spacing[4],
    gap: spacing[3],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moreAvatars: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  noGoal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
});
