// ─────────────────────────────────────────────────────────────
// GradientButton — Strava-inspired solid CTA button.
// Primary: bold orange fill. Secondary: dark surface + border.
// Danger: red tint. Tertiary: text only.
// Spring animation on press + haptic feedback.
// ─────────────────────────────────────────────────────────────

import React from 'react';
import {
  Text,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Pressable,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import { useTheme } from '../../contexts/ThemeContext';
import { textStyles } from '../../theme/typography';
import { radius } from '../../theme/spacing';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger';

interface GradientButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function GradientButton({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  labelStyle,
  icon,
  fullWidth = true,
  size = 'md',
}: GradientButtonProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePress = async () => {
    if (disabled || loading) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const heights = { sm: 40, md: 52, lg: 58 };
  const paddingH = { sm: 16, md: 24, lg: 28 };
  const fontStyle = size === 'sm'
    ? textStyles.titleSm
    : size === 'lg'
      ? textStyles.titleLg
      : textStyles.titleMd;

  const getBgColor = () => {
    if (variant === 'primary') return disabled ? `${theme.colors.primary}66` : theme.colors.primary;
    if (variant === 'secondary') return theme.colors.surface_container_high;
    if (variant === 'danger') return theme.colors.error_container;
    return 'transparent';
  };

  const getBorderColor = () => {
    if (variant === 'secondary') return theme.colors.outline;
    if (variant === 'danger') return `${theme.colors.error}66`;
    return 'transparent';
  };

  const getLabelColor = () => {
    if (variant === 'primary') return theme.colors.on_primary;
    if (variant === 'secondary') return theme.colors.on_surface;
    if (variant === 'danger') return theme.colors.error;
    return theme.colors.primary;
  };

  const baseStyle: ViewStyle = {
    height: heights[size],
    paddingHorizontal: paddingH[size],
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled && variant !== 'primary' ? 0.5 : 1,
    backgroundColor: getBgColor(),
    borderWidth: variant === 'secondary' || variant === 'danger' ? 1 : 0,
    borderColor: getBorderColor(),
    ...(fullWidth ? { width: '100%' } : {}),
  };

  return (
    <AnimatedPressable
      style={[animStyle, fullWidth && { width: '100%' }]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
    >
      <View style={[baseStyle, style]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {icon && !loading && icon}
          {loading ? (
            <ActivityIndicator
              color={variant === 'primary' ? theme.colors.on_primary : theme.colors.primary}
              size="small"
            />
          ) : (
            <Text
              style={[
                fontStyle,
                { color: getLabelColor(), letterSpacing: variant === 'primary' ? 0.3 : 0 },
                labelStyle,
              ]}
            >
              {label}
            </Text>
          )}
        </View>
      </View>
    </AnimatedPressable>
  );
}
