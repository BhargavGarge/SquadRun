// Member contribution row for squad detail leaderboard

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
import { spacing, radius } from '../../theme/spacing';
import type { SquadMember } from '../../types';

interface MemberRowProps {
  member: SquadMember;
  rank: number;
  contribution: number;     // absolute value (km, hrs, etc.)
  maxContribution: number;  // used to scale the bar
  unit: string;
  animationDelay?: number;
}

const RANK_COLORS: Record<number, [string, string]> = {
  1: ['#FFD700', '#FFA500'],
  2: ['#C0C0C0', '#A0A0A0'],
  3: ['#CD7F32', '#A0522D'],
};

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

  const rankColors = RANK_COLORS[rank] ?? [theme.colors.primary, theme.colors.primary_light];
  const isTop3 = rank <= 3;

  return (
    <View style={[styles.row, { backgroundColor: rank % 2 === 0 ? theme.colors.glass : 'transparent' }]}>
      {/* Rank */}
      <View style={styles.rankContainer}>
        {isTop3 ? (
          <LinearGradient colors={rankColors} style={styles.rankBadge}>
            <Text style={styles.rankText}>{rank}</Text>
          </LinearGradient>
        ) : (
          <Text style={[textStyles.titleSm, { color: theme.colors.on_surface_variant, width: 28, textAlign: 'center' }]}>
            {rank}
          </Text>
        )}
      </View>

      {/* Avatar + name */}
      <Avatar
        uri={member.user?.avatar_url}
        name={member.user?.display_name}
        size={36}
      />
      <View style={styles.nameSection}>
        <Text
          style={[textStyles.titleMd, { color: theme.colors.on_surface }]}
          numberOfLines={1}
        >
          {member.user?.display_name ?? 'Member'}
        </Text>

        {/* Contribution bar */}
        <View style={styles.barTrack}>
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

      {/* Value */}
      <Text style={[textStyles.titleMd, { color: theme.colors.on_surface, minWidth: 60, textAlign: 'right' }]}>
        {contribution.toFixed(1)} <Text style={{ color: theme.colors.on_surface_variant, fontSize: 12 }}>{unit}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[3],
    borderRadius: radius.md,
  },
  rankContainer: {
    width: 32,
    alignItems: 'center',
  },
  rankBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
  },
  nameSection: {
    flex: 1,
    gap: 5,
  },
  barTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
});
