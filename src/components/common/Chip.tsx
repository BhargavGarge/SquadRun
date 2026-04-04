// Selectable chip for workout type filtering and categories

import React from 'react';
import { Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import { useTheme } from '../../contexts/ThemeContext';
import { textStyles } from '../../theme/typography';
import { radius } from '../../theme/spacing';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  color?: string; // accent color when selected
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function Chip({ label, selected = false, onPress, style, color }: ChipProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const accentColor = color ?? theme.colors.primary;

  return (
    <AnimatedPressable
      style={[
        styles.chip,
        {
          backgroundColor: selected
            ? `${accentColor}22`
            : theme.colors.surface_container_high,
          borderColor: selected ? accentColor : theme.colors.outline,
          borderRadius: radius.full,
        },
        animStyle,
        style,
      ]}
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.93, { damping: 12 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 12 }); }}
    >
      <Text
        style={[
          textStyles.labelMd,
          { color: selected ? accentColor : theme.colors.on_surface_variant },
        ]}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
  },
});
