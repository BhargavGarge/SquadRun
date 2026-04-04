// ─────────────────────────────────────────────────────────────
// Input — Strava-style dark text input.
// Clean dark surface, orange focus border, label + error states.
// ─────────────────────────────────────────────────────────────

import React, { useRef, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../contexts/ThemeContext';
import { textStyles } from '../../theme/typography';
import { radius } from '../../theme/spacing';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
}

export default function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  isPassword = false,
  style,
  ...rest
}: InputProps) {
  const { theme } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const focusBorder = useSharedValue(0);

  const focusBorderStyle = useAnimatedStyle(() => ({
    opacity: focusBorder.value,
  }));

  const handleFocus = () => {
    setIsFocused(true);
    focusBorder.value = withTiming(1, { duration: 150 });
    rest.onFocus?.(undefined as any);
  };

  const handleBlur = () => {
    setIsFocused(false);
    focusBorder.value = withTiming(0, { duration: 150 });
    rest.onBlur?.(undefined as any);
  };

  const hasError = !!error;
  const borderColor = hasError
    ? theme.colors.error
    : isFocused
      ? theme.colors.primary
      : theme.colors.outline;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <Text
          style={[
            textStyles.labelMd,
            {
              color: hasError ? theme.colors.error : theme.colors.on_surface_variant,
              marginBottom: 8,
            },
          ]}
        >
          {label}
        </Text>
      )}

      <Pressable onPress={() => inputRef.current?.focus()}>
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: theme.colors.surface_container,
              borderColor,
              borderRadius: radius.lg,
            },
          ]}
        >
          {/* Focus ring overlay */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              focusBorderStyle,
              {
                borderRadius: radius.lg,
                borderWidth: 1.5,
                borderColor: hasError ? theme.colors.error : theme.colors.primary,
              },
            ]}
          />

          {leftIcon && (
            <Ionicons
              name={leftIcon}
              size={17}
              color={isFocused ? theme.colors.primary : theme.colors.on_surface_variant}
              style={styles.leftIcon}
            />
          )}

          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              {
                color: theme.colors.on_surface,
                fontFamily: 'Manrope_400Regular',
                fontSize: 15,
                paddingLeft: leftIcon ? 0 : 16,
                paddingRight: rightIcon || isPassword ? 0 : 16,
              },
              style,
            ]}
            placeholderTextColor={theme.colors.on_surface_muted}
            onFocus={handleFocus}
            onBlur={handleBlur}
            secureTextEntry={isPassword && !showPassword}
            {...rest}
          />

          {isPassword && (
            <Pressable onPress={() => setShowPassword((v) => !v)} style={styles.rightIcon}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={theme.colors.on_surface_variant}
              />
            </Pressable>
          )}

          {rightIcon && !isPassword && (
            <Pressable onPress={onRightIconPress} style={styles.rightIcon}>
              <Ionicons name={rightIcon} size={18} color={theme.colors.on_surface_variant} />
            </Pressable>
          )}
        </View>
      </Pressable>

      {(error || hint) && (
        <Text
          style={[
            textStyles.bodySm,
            {
              color: hasError ? theme.colors.error : theme.colors.on_surface_variant,
              marginTop: 5,
              marginLeft: 2,
            },
          ]}
        >
          {error ?? hint}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 0 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    height: 54,
    overflow: 'hidden',
  },
  leftIcon: {
    paddingLeft: 14,
    paddingRight: 10,
  },
  rightIcon: {
    paddingHorizontal: 14,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
  },
});
