// ─────────────────────────────────────────────────────────────
// AnimatedProgressBar — horizontal gradient progress bar.
// Animates width on mount and when progress changes.
// ─────────────────────────────────────────────────────────────

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { useTheme } from '../../contexts/ThemeContext';
import { textStyles } from '../../theme/typography';
import { radius } from '../../theme/spacing';

interface AnimatedProgressBarProps {
  progress: number;       // 0–100
  height?: number;
  showLabel?: boolean;
  labelLeft?: string;
  labelRight?: string;
  colorStart?: string;
  colorEnd?: string;
  trackColor?: string;
  style?: ViewStyle;
  animationDuration?: number;
  milestone?: number;     // milestone marker at this % (optional)
}

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function AnimatedProgressBar({
  progress,
  height = 10,
  showLabel = true,
  labelLeft,
  labelRight,
  colorStart,
  colorEnd,
  trackColor,
  style,
  animationDuration = 1000,
  milestone,
}: AnimatedProgressBarProps) {
  const { theme } = useTheme();

  const cStart = colorStart ?? theme.colors.gradient_progress_start;
  const cEnd = colorEnd ?? theme.colors.gradient_progress_end;
  const track = trackColor ?? theme.colors.surface_container_high;

  const animatedWidth = useSharedValue(0);

  useEffect(() => {
    animatedWidth.value = withTiming(Math.min(progress, 100), {
      duration: animationDuration,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${animatedWidth.value}%`,
  }));

  return (
    <View style={style}>
      {showLabel && (labelLeft || labelRight) && (
        <View style={styles.labelRow}>
          {labelLeft ? (
            <Text style={[textStyles.labelMd, { color: theme.colors.on_surface_variant }]}>
              {labelLeft}
            </Text>
          ) : <View />}
          {labelRight ? (
            <Text style={[textStyles.bodyMd, { color: theme.colors.on_surface }]}>
              {labelRight}
            </Text>
          ) : null}
        </View>
      )}

      {/* Track — no rounded caps (ROUND_NONE system) */}
      <View
        style={[
          styles.track,
          { height, borderRadius: 0, backgroundColor: track },
        ]}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            barStyle,
            { borderRadius: 0, overflow: 'hidden' },
          ]}
        >
          <LinearGradient
            colors={[cStart, cEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* Milestone marker */}
        {milestone !== undefined && milestone > 0 && milestone < 100 && (
          <View
            style={[
              styles.milestone,
              {
                left: `${milestone}%`,
                height: height + 4,
                top: -2,
                backgroundColor: theme.colors.primary,
              },
            ]}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  track: {
    width: '100%',
    overflow: 'visible',
    position: 'relative',
  },
  milestone: {
    position: 'absolute',
    width: 2,
    borderRadius: 1,
  },
});
