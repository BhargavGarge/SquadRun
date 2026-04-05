// ─────────────────────────────────────────────────────────────
// Badge — Tactical Command achievement module.
// No emojis. Pure SVG geometric icons — each one unique.
// Animation: lime scan-line sweeps the card, then icon reveals.
// Earned state: Electric Lime border + repeating pulse glow.
// Unearned: ghost border, icon at 25% opacity, LOCKED stamp.
// ─────────────────────────────────────────────────────────────

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path, Rect, Line, Circle, Polygon } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';
import { textStyles } from '../../theme/typography';

// ─── Badge key → SVG icon map ─────────────────────────────────
// Each icon is a 32×32 SVG geometric mark. No emojis, no circles.

type BadgeSvgProps = { color: string };

/** Double chevron >> — speed, forward momentum */
const FirstRunIcon = ({ color }: BadgeSvgProps) => (
  <Svg width={32} height={32} viewBox="0 0 32 32">
    <Path
      d="M 4 7 L 13 16 L 4 25"
      stroke={color} strokeWidth={2.5} fill="none"
      strokeLinecap="square" strokeLinejoin="miter"
    />
    <Path
      d="M 15 7 L 24 16 L 15 25"
      stroke={color} strokeWidth={2.5} fill="none"
      strokeLinecap="square" strokeLinejoin="miter"
    />
    {/* Short leading speed line */}
    <Line x1={1} y1={16} x2={4} y2={16} stroke={color} strokeWidth={2} strokeLinecap="square" />
  </Svg>
);

/** 7 ascending EQ bars — consistency, frequency, 7-day pulse */
const StreakIcon = ({ color }: BadgeSvgProps) => (
  <Svg width={32} height={32} viewBox="0 0 32 32">
    {/* 7 bars, 2px wide, 2px gap, bottom-aligned at y=28, pyramid heights */}
    <Rect x={3}  y={20} width={2} height={8}  fill={color} />
    <Rect x={7}  y={16} width={2} height={12} fill={color} />
    <Rect x={11} y={11} width={2} height={17} fill={color} />
    <Rect x={15} y={6}  width={2} height={22} fill={color} />
    <Rect x={19} y={11} width={2} height={17} fill={color} />
    <Rect x={23} y={16} width={2} height={12} fill={color} />
    <Rect x={27} y={20} width={2} height={8}  fill={color} />
  </Svg>
);

/** Radar compass — distance covered, range achieved */
const DistanceIcon = ({ color }: BadgeSvgProps) => (
  <Svg width={32} height={32} viewBox="0 0 32 32">
    {/* Outer ring */}
    <Circle cx={16} cy={16} r={12} stroke={color} strokeWidth={2} fill="none" />
    {/* Cardinal tick marks */}
    <Line x1={16} y1={2}  x2={16} y2={6}  stroke={color} strokeWidth={2} strokeLinecap="square" />
    <Line x1={16} y1={26} x2={16} y2={30} stroke={color} strokeWidth={2} strokeLinecap="square" />
    <Line x1={2}  y1={16} x2={6}  y2={16} stroke={color} strokeWidth={2} strokeLinecap="square" />
    <Line x1={26} y1={16} x2={30} y2={16} stroke={color} strokeWidth={2} strokeLinecap="square" />
    {/* Needle — pointing to upper-right (achievement direction) */}
    <Line x1={16} y1={16} x2={23} y2={9} stroke={color} strokeWidth={2} strokeLinecap="square" />
    {/* Center pivot */}
    <Rect x={14} y={14} width={4} height={4} fill={color} />
  </Svg>
);

/** Corner-bracket crosshair — precision, target locked */
const GoalCrusherIcon = ({ color }: BadgeSvgProps) => (
  <Svg width={32} height={32} viewBox="0 0 32 32">
    {/* Corner brackets — top-left */}
    <Path d="M 4 11 L 4 4 L 11 4" stroke={color} strokeWidth={2} fill="none" strokeLinecap="square" strokeLinejoin="miter" />
    {/* Top-right */}
    <Path d="M 21 4 L 28 4 L 28 11" stroke={color} strokeWidth={2} fill="none" strokeLinecap="square" strokeLinejoin="miter" />
    {/* Bottom-right */}
    <Path d="M 28 21 L 28 28 L 21 28" stroke={color} strokeWidth={2} fill="none" strokeLinecap="square" strokeLinejoin="miter" />
    {/* Bottom-left */}
    <Path d="M 11 28 L 4 28 L 4 21" stroke={color} strokeWidth={2} fill="none" strokeLinecap="square" strokeLinejoin="miter" />
    {/* Center crosshair */}
    <Line x1={11} y1={16} x2={21} y2={16} stroke={color} strokeWidth={1.5} strokeLinecap="square" />
    <Line x1={16} y1={11} x2={16} y2={21} stroke={color} strokeWidth={1.5} strokeLinecap="square" />
    {/* Center dot */}
    <Rect x={14.5} y={14.5} width={3} height={3} fill={color} />
  </Svg>
);

/** Play triangle — forward momentum, first action */
const StartIcon = ({ color }: BadgeSvgProps) => (
  <Svg width={32} height={32} viewBox="0 0 32 32">
    <Polygon
      points="6,5 27,16 6,27"
      stroke={color} strokeWidth={2} fill="none"
      strokeLinejoin="miter"
    />
  </Svg>
);

/** Diamond — elite status, precision */
const EliteIcon = ({ color }: BadgeSvgProps) => (
  <Svg width={32} height={32} viewBox="0 0 32 32">
    <Polygon
      points="16,3 29,16 16,29 3,16"
      stroke={color} strokeWidth={2} fill="none"
      strokeLinejoin="miter"
    />
    <Polygon
      points="16,9 23,16 16,23 9,16"
      stroke={color} strokeWidth={1.5} fill="none"
      strokeLinejoin="miter"
    />
  </Svg>
);

const ICON_MAP: Record<string, React.FC<BadgeSvgProps>> = {
  first_run:     FirstRunIcon,
  streak_7:      StreakIcon,
  distance_100:  DistanceIcon,
  goal_crusher:  GoalCrusherIcon,
  start:         StartIcon,
  elite:         EliteIcon,
  // Fallback for unknown keys
  default:       GoalCrusherIcon,
};

// ─── Badge component ──────────────────────────────────────────

export type BadgeKey = keyof typeof ICON_MAP;

interface BadgeProps {
  badgeKey?: BadgeKey | string;
  /** @deprecated Pass badgeKey instead — emoji icon is no longer used */
  icon?: string;
  name: string;
  description?: string;
  earned?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  animationDelay?: number;
}

const CARD_H = { sm: 96, md: 112, lg: 128 };
const ICON_SIZE = { sm: 28, md: 34, lg: 42 };

export default function Badge({
  badgeKey,
  name,
  earned = true,
  size = 'md',
  style,
  animationDelay = 0,
}: BadgeProps) {
  const { theme } = useTheme();
  const cardH = CARD_H[size];

  // ── Animation values ──────────────────────────────────────
  const containerOpacity = useSharedValue(0);
  const scanTranslateY   = useSharedValue(0);
  const scanOpacity      = useSharedValue(0);
  const iconOpacity      = useSharedValue(0);
  const glowOpacity      = useSharedValue(0);

  useEffect(() => {
    // 1. Card fades in
    containerOpacity.value = withDelay(
      animationDelay,
      withTiming(1, { duration: 250 }),
    );

    // 2. Scan line sweeps top → bottom
    scanOpacity.value = withDelay(
      animationDelay + 120,
      withSequence(
        withTiming(1, { duration: 80 }),
        withDelay(380, withTiming(0, { duration: 120 })),
      ),
    );
    scanTranslateY.value = withDelay(
      animationDelay + 120,
      withTiming(cardH + 2, { duration: 440, easing: Easing.linear }),
    );

    // 3. Icon reveals after scan passes center
    iconOpacity.value = withDelay(
      animationDelay + 380,
      withTiming(earned ? 1 : 0.25, { duration: 200 }),
    );

    // 4. Earned badge: slow repeating lime pulse on the border glow
    if (earned) {
      glowOpacity.value = withDelay(
        animationDelay + 700,
        withRepeat(
          withSequence(
            withTiming(0.7, { duration: 2200, easing: Easing.inOut(Easing.sine) }),
            withTiming(0.15, { duration: 2200, easing: Easing.inOut(Easing.sine) }),
          ),
          -1,
          false,
        ),
      );
    }
  }, [earned]);

  const containerStyle = useAnimatedStyle(() => ({ opacity: containerOpacity.value }));
  const scanStyle      = useAnimatedStyle(() => ({
    opacity: scanOpacity.value,
    transform: [{ translateY: scanTranslateY.value }],
  }));
  const iconStyle      = useAnimatedStyle(() => ({ opacity: iconOpacity.value }));
  const glowStyle      = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  // ── Resolve icon ──────────────────────────────────────────
  const IconComponent = ICON_MAP[badgeKey ?? 'default'] ?? ICON_MAP.default;
  const iconColor  = earned ? theme.colors.primary : theme.colors.on_surface_muted;
  const iconSize   = ICON_SIZE[size];
  const borderColor = earned ? theme.colors.primary : theme.colors.outline_variant;

  return (
    <Animated.View style={[styles.card, { height: cardH, borderColor }, containerStyle, style]}>

      {/* Lime scan line — absolute, sweeps full card height */}
      <Animated.View
        style={[styles.scanLine, { backgroundColor: theme.colors.primary }, scanStyle]}
        pointerEvents="none"
      />

      {/* Earned glow border overlay — faint lime border pulse */}
      {earned && (
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.glowBorder, glowStyle]}
          pointerEvents="none"
        />
      )}

      {/* Top accent bar — solid lime for earned */}
      <View
        style={[
          styles.topAccent,
          { backgroundColor: earned ? theme.colors.primary : theme.colors.outline_variant },
        ]}
      />

      {/* Icon zone */}
      <Animated.View style={[styles.iconZone, iconStyle]}>
        <IconComponent color={iconColor} />
      </Animated.View>

      {/* Info strip */}
      <View
        style={[
          styles.infoStrip,
          { backgroundColor: theme.colors.surface_container_highest },
        ]}
      >
        <Text
          style={[
            textStyles.labelSm,
            styles.badgeName,
            { color: earned ? theme.colors.on_surface : theme.colors.on_surface_variant },
          ]}
          numberOfLines={1}
        >
          {name}
        </Text>
        <Text
          style={[
            textStyles.labelSm,
            {
              color: earned ? theme.colors.primary : theme.colors.on_surface_muted,
              fontSize: 9,
              letterSpacing: 0.8,
            },
          ]}
        >
          {earned ? '● ON' : '○ OFF'}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 0,
    overflow: 'hidden',
    position: 'relative',
  },
  topAccent: {
    height: 2,
    width: '100%',
  },
  iconZone: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoStrip: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeName: {
    flex: 1,
    marginRight: 4,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1.5,
    top: 0,
    zIndex: 10,
  },
  glowBorder: {
    borderWidth: 1,
    borderColor: '#CCFF00',
    borderRadius: 0,
    zIndex: 5,
  },
});
