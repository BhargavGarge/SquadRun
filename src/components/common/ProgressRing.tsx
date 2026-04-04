// ─────────────────────────────────────────────────────────────
// ProgressRing — animated SVG arc progress indicator.
// Animates from 0 → target percent on mount.
// Supports gradient stroke via SVG defs.
// ─────────────────────────────────────────────────────────────

import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { useTheme } from '../../contexts/ThemeContext';
import { textStyles } from '../../theme/typography';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  progress: number;      // 0–100
  size?: number;         // diameter in px
  strokeWidth?: number;
  showLabel?: boolean;
  label?: string;        // custom center label (overrides %)
  sublabel?: string;     // smaller text below label
  colorStart?: string;
  colorEnd?: string;
  trackColor?: string;
  animationDuration?: number;
}

export default function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 10,
  showLabel = true,
  label,
  sublabel,
  colorStart,
  colorEnd,
  trackColor,
  animationDuration = 1200,
}: ProgressRingProps) {
  const { theme } = useTheme();

  const c = colorStart ?? theme.colors.gradient_progress_start;
  const c2 = colorEnd ?? theme.colors.gradient_progress_end;
  const track = trackColor ?? theme.colors.surface_container_high;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  // Animated dash offset drives the progress arc
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(Math.min(progress, 100), {
      duration: animationDuration,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference - (animatedProgress.value / 100) * circumference,
  }));

  const gradId = `ring-grad-${size}`;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <SvgLinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={c} />
            <Stop offset="100%" stopColor={c2} />
          </SvgLinearGradient>
        </Defs>

        {/* Background track */}
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={track}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Animated progress arc */}
        <AnimatedCircle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          // Start from top
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </Svg>

      {/* Center label */}
      {showLabel && (
        <View style={{ alignItems: 'center' }}>
          <Text
            style={[
              label ? textStyles.headlineSm : textStyles.headlineMd,
              { color: theme.colors.on_surface },
            ]}
          >
            {label ?? `${Math.round(progress)}%`}
          </Text>
          {sublabel && (
            <Text
              style={[textStyles.labelMd, { color: theme.colors.on_surface_variant }]}
            >
              {sublabel}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
