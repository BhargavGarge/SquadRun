// Achievement badge component with pop-in animation

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';
import { textStyles } from '../../theme/typography';
import { radius } from '../../theme/spacing';

interface BadgeProps {
  icon: string;      // emoji
  name: string;
  description?: string;
  earned?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  animationDelay?: number;
}

export default function Badge({
  icon,
  name,
  description,
  earned = true,
  size = 'md',
  style,
  animationDelay = 0,
}: BadgeProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(animationDelay, withSpring(1, { damping: 12, stiffness: 200 }));
    opacity.value = withDelay(animationDelay, withSpring(1));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const sizes = {
    sm: { iconBox: 40, icon: 20, gap: 6 },
    md: { iconBox: 56, icon: 28, gap: 8 },
    lg: { iconBox: 72, icon: 36, gap: 10 },
  };
  const s = sizes[size];

  return (
    <Animated.View style={[styles.wrapper, style, animStyle]}>
      <LinearGradient
        colors={
          earned
            ? [theme.colors.gradient_primary_start, theme.colors.gradient_primary_end]
            : [theme.colors.surface_container_high, theme.colors.surface_container_highest]
        }
        style={[
          styles.iconBox,
          {
            width: s.iconBox,
            height: s.iconBox,
            borderRadius: s.iconBox / 2,
            opacity: earned ? 1 : 0.4,
          },
        ]}
      >
        <Text style={{ fontSize: s.icon }}>{icon}</Text>
      </LinearGradient>

      <Text
        style={[
          textStyles.titleSm,
          {
            color: earned ? theme.colors.on_surface : theme.colors.on_surface_variant,
            marginTop: s.gap,
            textAlign: 'center',
          },
        ]}
        numberOfLines={2}
      >
        {name}
      </Text>

      {description && size === 'lg' && (
        <Text
          style={[
            textStyles.bodySm,
            { color: theme.colors.on_surface_variant, textAlign: 'center', marginTop: 2 },
          ]}
          numberOfLines={2}
        >
          {description}
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    maxWidth: 80,
  },
  iconBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
