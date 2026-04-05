// ─────────────────────────────────────────────────────────────
// WelcomeScreen — Tactical Command landing.
// Full-screen video, electric lime headline accent, sharp CTA.
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Video, ResizeMode } from "expo-av";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from "react-native-reanimated";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import GradientButton from "../../components/common/GradientButton";
import { useTheme } from "../../contexts/ThemeContext";
import { textStyles } from "../../theme/typography";
import { spacing } from "../../theme/spacing";
import type { AuthStackParamList } from "../../navigation/types";

const STATS = [
  { value: "2.4M",  label: "Athletes" },
  { value: "18M",   label: "Workouts" },
  { value: "847K",  label: "Squads" },
  { value: "340M+", label: "km Logged" },
];

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, "Welcome">;
};

export default function WelcomeScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const videoRef = useRef<Video>(null);

  const heroOpacity  = useSharedValue(0);
  const heroY        = useSharedValue(24);
  const statsOpacity = useSharedValue(0);
  const ctaOpacity   = useSharedValue(0);
  const ctaY         = useSharedValue(20);
  const logoScale    = useSharedValue(0.7);

  useEffect(() => {
    logoScale.value  = withSpring(1, { damping: 14 });
    heroOpacity.value = withDelay(150, withTiming(1, { duration: 600 }));
    heroY.value = withDelay(150, withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }));
    statsOpacity.value = withDelay(500, withTiming(1, { duration: 500 }));
    ctaOpacity.value = withDelay(750, withTiming(1, { duration: 500 }));
    ctaY.value = withDelay(750, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }));
  }, []);

  const logoStyle  = useAnimatedStyle(() => ({ transform: [{ scale: logoScale.value }] }));
  const heroStyle  = useAnimatedStyle(() => ({ opacity: heroOpacity.value, transform: [{ translateY: heroY.value }] }));
  const statsStyle = useAnimatedStyle(() => ({ opacity: statsOpacity.value }));
  const ctaStyle   = useAnimatedStyle(() => ({ opacity: ctaOpacity.value, transform: [{ translateY: ctaY.value }] }));

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <Video
        ref={videoRef}
        source={require("../../../assets/5310749-uhd_3840_2160_25fps.mp4")}
        style={StyleSheet.absoluteFill}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        isMuted
      />

      {/* Dark scrim — deep enough to anchor the lime */}
      <LinearGradient
        colors={["rgba(0,0,0,0.62)", "rgba(0,0,0,0.80)"]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safe}>
        {/* ── Logo ─────────────────────────────────────────── */}
        <Animated.View style={[styles.logoRow, logoStyle]}>
          {/* ROUND_NONE logomark — sharp square */}
          <View style={[styles.logoMark, { backgroundColor: theme.colors.primary }]}>
            <Text style={[styles.logoGlyph, { color: theme.colors.on_primary }]}>SG</Text>
          </View>
          <Text style={[textStyles.labelLg, { color: theme.colors.on_surface, letterSpacing: 2.5 }]}>
            SQUAD GOALS
          </Text>
        </Animated.View>

        {/* ── Main headline ─────────────────────────────── */}
        <Animated.View style={[styles.heroSection, heroStyle]}>
          {/* Data-stamp — top tactical metadata */}
          <Text style={[textStyles.labelMd, { color: theme.colors.primary, marginBottom: spacing[3] }]}>
            ● PERFORMANCE NETWORK
          </Text>
          <Text style={[styles.heroHeadline, { color: theme.colors.on_surface }]}>
            Every PR{"\n"}starts with{"\n"}
            <Text style={{ color: theme.colors.primary }}>your squad.</Text>
          </Text>
          <Text style={[textStyles.bodyMd, styles.heroSub, { color: theme.colors.on_surface_variant }]}>
            Track together. Push harder. Go further.
          </Text>
        </Animated.View>

        {/* ── Live stats — tonal surface block, no border lines ── */}
        <Animated.View style={[styles.statsBlock, { backgroundColor: 'rgba(19,19,19,0.70)' }, statsStyle]}>
          {STATS.map((s, i) => (
            <View key={i} style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.on_surface, fontFamily: 'Lexend-Bold' }]}>
                {s.value}
              </Text>
              <Text style={[textStyles.labelSm, { color: theme.colors.on_surface_variant }]}>
                {s.label}
              </Text>
            </View>
          ))}
        </Animated.View>

        {/* ── CTAs ──────────────────────────────────────── */}
        <Animated.View style={[styles.ctas, ctaStyle]}>
          <GradientButton
            label="Get Started"
            onPress={() => navigation.navigate("SignUp")}
            variant="primary"
            size="lg"
          />
          <TouchableOpacity
            onPress={() => navigation.navigate("SignIn")}
            style={styles.signInLink}
          >
            <Text style={[textStyles.bodyMd, { color: theme.colors.on_surface_variant }]}>
              Already have an account?{" "}
              <Text style={{ color: theme.colors.primary }}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  safe: {
    flex: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
    justifyContent: "space-between",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 0,   // ROUND_NONE
    alignItems: "center",
    justifyContent: "center",
  },
  logoGlyph: {
    fontSize: 13,
    fontFamily: 'Lexend-ExtraBold',
    letterSpacing: -0.5,
  },
  heroSection: {
    flex: 1,
    justifyContent: "center",
  },
  heroHeadline: {
    fontSize: 52,
    fontFamily: 'Lexend-ExtraBold',  // correct font name
    lineHeight: 54,
    letterSpacing: -2.60,            // -0.05em at 52px
  },
  heroSub: {
    marginTop: spacing[5],
  },
  // Tonal block — no border lines, surface tier creates separation
  statsBlock: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[3],
    marginBottom: spacing[6],
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -1.0,
    marginBottom: 2,
  },
  ctas: {
    gap: spacing[4],
  },
  signInLink: {
    alignItems: "center",
    paddingVertical: spacing[2],
  },
});
