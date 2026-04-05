// ─────────────────────────────────────────────────────────────
// GradientButton — Tactical Command CTA.
// ROUND_NONE: 0px. Sharp corners. No softness.
// Primary: Electric Lime (#CCFF00) fill, deep olive text.
// Secondary: outline_variant border + lime text.
// Tactile press: slight scale + translateY offset (physical key feel).
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
  const scale    = useSharedValue(1);
  const offsetY  = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: offsetY.value }],
  }));

  const handlePressIn = () => {
    scale.value  = withSpring(0.97, { damping: 18, stiffness: 450 });
    // Physical key press: element sinks down 1px
    offsetY.value = withSpring(1, { damping: 18, stiffness: 450 });
  };

  const handlePressOut = () => {
    scale.value  = withSpring(1,  { damping: 18, stiffness: 450 });
    offsetY.value = withSpring(0, { damping: 18, stiffness: 450 });
  };

  const handlePress = async () => {
    if (disabled || loading) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const heights  = { sm: 42, md: 54, lg: 60 };
  const paddingH = { sm: 16, md: 24, lg: 28 };
  // Labels are all uppercase (tactical metadata style)
  const fontStyle = textStyles.labelMd;

  const getBgColor = () => {
    if (variant === 'primary')   return disabled ? `${theme.colors.primary}44` : theme.colors.primary;
    if (variant === 'secondary') return theme.colors.surface_container_high;
    if (variant === 'danger')    return theme.colors.error_container;
    return 'transparent';
  };

  const getBorderColor = () => {
    if (variant === 'primary')   return 'transparent';
    if (variant === 'secondary') return theme.colors.outline_variant;  // #484848 ghost border
    if (variant === 'danger')    return `${theme.colors.error}66`;
    return 'transparent';
  };

  const getLabelColor = () => {
    if (variant === 'primary')   return theme.colors.on_primary;   // #1a3000 deep olive on lime
    if (variant === 'secondary') return theme.colors.primary;      // lime text on dark
    if (variant === 'danger')    return theme.colors.error;
    return theme.colors.primary; // tertiary: lime text
  };

  const baseStyle: ViewStyle = {
    height: heights[size],
    paddingHorizontal: paddingH[size],
    borderRadius: 0,   // ROUND_NONE — never rounded
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled && variant !== 'primary' ? 0.45 : 1,
    backgroundColor: getBgColor(),
    borderWidth: variant !== 'primary' ? 1 : 0,
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
            <Text style={[fontStyle, { color: getLabelColor() }, labelStyle]}>
              {label}
            </Text>
          )}
        </View>
      </View>
    </AnimatedPressable>
  );
}
