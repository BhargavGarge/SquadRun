// ─────────────────────────────────────────────────────────────
// Avatar — user avatar with fallback initials.
// Supports online indicator, border ring, and press animation.
// ─────────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, Image, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import { useTheme } from '../../contexts/ThemeContext';
import { textStyles } from '../../theme/typography';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
  onPress?: () => void;
  showBorder?: boolean;
  borderColor?: string;
  style?: ViewStyle;
  badgeCount?: number; // notification dot
  isOnline?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

// Deterministic color from name (for fallback background)
const AVATAR_COLORS = [
  ['#7C3AED', '#5B21B6'],
  ['#F59E0B', '#D97706'],
  ['#10B981', '#059669'],
  ['#F43F5E', '#BE123C'],
  ['#06B6D4', '#0284C7'],
  ['#8B5CF6', '#7C3AED'],
];

function getColorFromName(name?: string): [string, string] {
  if (!name) return AVATAR_COLORS[0];
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx] as [string, string];
}

export default function Avatar({
  uri,
  name,
  size = 40,
  onPress,
  showBorder = false,
  borderColor,
  style,
  badgeCount,
  isOnline,
}: AvatarProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const [colors] = React.useState(() => getColorFromName(name));

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) scale.value = withSpring(0.92, { damping: 12 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12 });
  };

  const fontSize = size * 0.36;
  const ringSize = showBorder ? size + 4 : size;

  const inner = (
    <View
      style={[
        styles.container,
        {
          width: ringSize,
          height: ringSize,
          borderRadius: ringSize / 2,
        },
        showBorder && {
          borderWidth: 2,
          borderColor: borderColor ?? theme.colors.primary,
          padding: 2,
        },
      ]}
    >
      {uri ? (
        <Image
          key={uri}
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      ) : (
        <LinearGradient
          colors={colors}
          style={[
            styles.fallback,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        >
          <Text
            style={{
              fontSize,
              fontFamily: 'Lexend-Bold',
              color: '#FFFFFF',
              letterSpacing: -0.5,
            }}
          >
            {getInitials(name)}
          </Text>
        </LinearGradient>
      )}

      {/* Online indicator */}
      {isOnline !== undefined && (
        <View
          style={[
            styles.onlineDot,
            {
              backgroundColor: isOnline ? theme.colors.success : theme.colors.on_surface_muted,
              borderColor: theme.colors.surface,
              width: Math.max(10, size * 0.22),
              height: Math.max(10, size * 0.22),
              borderRadius: Math.max(10, size * 0.22) / 2,
              bottom: 0,
              right: 0,
            },
          ]}
        />
      )}

      {/* Notification badge */}
      {badgeCount !== undefined && badgeCount > 0 && (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: theme.colors.error,
              borderColor: theme.colors.surface,
            },
          ]}
        >
          <Text style={styles.badgeText}>
            {badgeCount > 9 ? '9+' : badgeCount}
          </Text>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[animStyle, style]}
      >
        {inner}
      </AnimatedPressable>
    );
  }

  return (
    <Animated.View style={[animStyle, style]}>
      {inner}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    borderWidth: 2,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Manrope-Bold',
  },
});
