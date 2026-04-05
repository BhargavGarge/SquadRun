// ─────────────────────────────────────────────────────────────
// GlassCard — Tactical Command surface card.
// ROUND_NONE: 0px corners — sharp.
// Ghost border (#484848 / outline_variant) contains, doesn't decorate.
// "Locked-on" state (elevated): lime ghost border + neon bleed shadow.
// ─────────────────────────────────────────────────────────────

import React from 'react';
import { ViewStyle, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';

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
  borderRadius = 0,
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
    scale.value = withSpring(0.98, { damping: 18, stiffness: 350 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 18, stiffness: 350 });
  };

  const cardStyle: ViewStyle = {
    borderRadius: 0,  // ROUND_NONE — always 0 regardless of prop
    padding,
    backgroundColor: elevated
      ? theme.colors.surface_container_high
      : theme.colors.surface_container,
    // Ghost border — outline_variant (#484848) for containment
    borderWidth: 1,
    borderColor: elevated
      ? theme.colors.outline_variant  // #484848
      : theme.colors.outline,          // #282828 (barely perceptible)
    // Neon bleed on elevated — lime glow at low opacity
    ...(elevated
      ? {
          shadowColor: '#CCFF00',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.10,
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
