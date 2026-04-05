// ─────────────────────────────────────────────────────────────
// MemberRow — Tactical Command leaderboard row.
// ROUND_NONE: 0px. Rank badges are sharp squares, not circles.
// Rank 1: Electric Lime fill (locked-on). 2–3: tonal.
// Contribution bar: square ends, lime fill, no border radius.
// Vertical indication bar on rank 1 (primary left edge per spec).
// ─────────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';

import Avatar from '../common/Avatar';
import { useTheme } from '../../contexts/ThemeContext';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import type { SquadMember } from '../../types';

interface MemberRowProps {
  member: SquadMember;
  rank: number;
  contribution: number;
  maxContribution: number;
  unit: string;
  animationDelay?: number;
}

// Tactical rank styling — no gold/silver/bronze. Data, not gamification.
function getRankStyle(rank: number, primaryColor: string, outlineVariant: string, surfaceHigh: string) {
  if (rank === 1) return { bg: primaryColor,    text: '#1a3000', isLime: true };
  if (rank === 2) return { bg: outlineVariant,  text: '#ffffff', isLime: false };
  if (rank === 3) return { bg: surfaceHigh,     text: '#adaaaa', isLime: false };
  return null;
}

export default function MemberRow({
  member,
  rank,
  contribution,
  maxContribution,
  unit,
  animationDelay = 0,
}: MemberRowProps) {
  const { theme } = useTheme();
  const widthAnim = useSharedValue(0);

  React.useEffect(() => {
    const pct = maxContribution > 0 ? (contribution / maxContribution) * 100 : 0;
    widthAnim.value = withDelay(animationDelay, withTiming(pct, { duration: 900 }));
  }, [contribution, maxContribution]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${widthAnim.value}%`,
  }));

  const rankStyle = getRankStyle(
    rank,
    theme.colors.primary,
    theme.colors.outline_variant,
    theme.colors.surface_container_high,
  );
  const isTop = rank <= 3;
  const isFirst = rank === 1;

  return (
    <View style={styles.row}>
      {/* Vertical indication bar — lime for rank 1 (locked-on state per spec) */}
      <View
        style={[
          styles.indicationBar,
          { backgroundColor: isFirst ? theme.colors.primary : 'transparent' },
        ]}
      />

      {/* Rank badge — ROUND_NONE sharp square */}
      <View style={styles.rankContainer}>
        {isTop && rankStyle ? (
          <View style={[styles.rankBadge, { backgroundColor: rankStyle.bg }]}>
            <Text style={[styles.rankText, { color: rankStyle.text, fontFamily: 'Manrope-Bold' }]}>
              {rank}
            </Text>
          </View>
        ) : (
          <Text style={[textStyles.titleSm, { color: theme.colors.on_surface_muted, width: 28, textAlign: 'center' }]}>
            {rank}
          </Text>
        )}
      </View>

      {/* Avatar + name + bar */}
      <Avatar uri={member.user?.avatar_url} name={member.user?.display_name} size={34} />
      <View style={styles.nameSection}>
        <Text style={[textStyles.titleMd, { color: theme.colors.on_surface }]} numberOfLines={1}>
          {member.user?.display_name ?? 'Member'}
        </Text>

        {/* Contribution bar — square ends, no border radius */}
        <View style={[styles.barTrack, { backgroundColor: theme.colors.surface_container_highest }]}>
          <Animated.View style={[styles.barFill, barStyle]}>
            <LinearGradient
              colors={[theme.colors.gradient_progress_start, theme.colors.gradient_progress_end]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
      </View>

      {/* Contribution value */}
      <Text style={[textStyles.titleMd, { color: isFirst ? theme.colors.primary : theme.colors.on_surface, minWidth: 56, textAlign: 'right' }]}>
        {contribution.toFixed(1)}
        <Text style={{ color: theme.colors.on_surface_variant, fontSize: 11 }}> {unit}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[3],
    borderRadius: 0,  // ROUND_NONE
  },
  indicationBar: {
    width: 2,
    alignSelf: 'stretch',
    flexShrink: 0,
  },
  rankContainer: {
    width: 30,
    alignItems: 'center',
    flexShrink: 0,
  },
  rankBadge: {
    width: 26,
    height: 26,
    borderRadius: 0,  // ROUND_NONE — sharp square rank badge
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 12,
    letterSpacing: 0,
  },
  nameSection: {
    flex: 1,
    gap: 5,
  },
  barTrack: {
    height: 3,
    borderRadius: 0,   // square ends — no caps
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 0,   // square ends
    overflow: 'hidden',
  },
});
