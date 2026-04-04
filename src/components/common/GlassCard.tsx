// ─────────────────────────────────────────────────────────────
// GlassCard — Strava-style solid dark surface card.
// Replaces glassmorphism with clean dark fills + subtle borders.
// Press state spring animation (Reanimated).
// ─────────────────────────────────────────────────────────────

import React from 'react';
import { ViewStyle, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';
import { radius } from '../../theme/spacing';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  intensity?: number; // kept for API compat, ignored
  padding?: number;
  borderRadius?: number;
  elevated?: boolean;
  disabled?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function GlassCard({
  children,
  style,
  onPress,
  padding = 16,
  borderRadius = radius.xl,
  elevated = false,
  disabled = false,
}: GlassCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!onPress || disabled) return;
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const cardStyle: ViewStyle = {
    borderRadius,
    padding,
    backgroundColor: theme.colors.surface_container_low,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    ...(elevated
      ? {
          shadowColor: theme.colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 6,
        }
      : {}),
  };

  if (onPress && !disabled) {
    return (
      <AnimatedPressable
        style={[cardStyle, animStyle, style]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return (
    <Animated.View style={[cardStyle, animStyle, style]}>
      {children}
    </Animated.View>
  );
}
