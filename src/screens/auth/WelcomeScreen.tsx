// ─────────────────────────────────────────────────────────────
// WelcomeScreen — Strava-style full-screen landing.
// Bold athlete headline, animated live stats bar, orange CTA.
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

// Live community stats shown in the ticker
const STATS = [
  { value: "2.4M", label: "Athletes" },
  { value: "18M", label: "Workouts" },
  { value: "847K", label: "Squads" },
  { value: "340M", label: "km Logged" },
];

// Sport icons row

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, "Welcome">;
};

export default function WelcomeScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const videoRef = useRef<Video>(null);

  const heroOpacity = useSharedValue(0);
  const heroY = useSharedValue(30);
  const statsOpacity = useSharedValue(0);
  const ctaOpacity = useSharedValue(0);
  const ctaY = useSharedValue(24);
  const logoScale = useSharedValue(0.6);

  useEffect(() => {
    logoScale.value = withSpring(1, { damping: 12 });
    heroOpacity.value = withDelay(150, withTiming(1, { duration: 700 }));
    heroY.value = withDelay(
      150,
      withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) }),
    );
    statsOpacity.value = withDelay(500, withTiming(1, { duration: 600 }));
    ctaOpacity.value = withDelay(800, withTiming(1, { duration: 500 }));
    ctaY.value = withDelay(
      800,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }),
    );
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));
  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ translateY: heroY.value }],
  }));
  const statsStyle = useAnimatedStyle(() => ({ opacity: statsOpacity.value }));
  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
    transform: [{ translateY: ctaY.value }],
  }));

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Full-screen looping background video */}
      <Video
        ref={videoRef}
        source={require("../../../assets/5310749-uhd_3840_2160_25fps.mp4")}
        style={StyleSheet.absoluteFill}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        isMuted
      />

      {/* Dark scrim so text stays readable */}
      <LinearGradient
        colors={["rgba(0,0,0,0.55)", "rgba(0,0,0,0.72)"]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safe}>
        {/* ── Logo ──────────────────────────────────────────── */}
        <Animated.View style={[styles.logoRow, logoStyle]}>
          <View
            style={[styles.logoMark, { backgroundColor: theme.colors.primary }]}
          >
            <Text style={styles.logoEmoji}>⚡</Text>
          </View>
          <Text
            style={[
              textStyles.titleLg,
              { color: theme.colors.on_surface, letterSpacing: 1.5 },
            ]}
          >
            SQUAD GOALS
          </Text>
        </Animated.View>

        {/* ── Sports strip ─────────────────────────────────── */}

        {/* ── Main headline ────────────────────────────────── */}
        <Animated.View style={[styles.heroSection, heroStyle]}>
          <Text
            style={[styles.heroHeadline, { color: theme.colors.on_surface }]}
          >
            Every PR{"\n"}starts with{"\n"}
            <Text style={{ color: theme.colors.primary }}>your squad.</Text>
          </Text>
          <Text
            style={[
              textStyles.bodyLg,
              styles.heroSub,
              { color: theme.colors.on_surface_variant },
            ]}
          >
            Track together. Push harder. Go further.
          </Text>
        </Animated.View>

        {/* ── Live stats ticker ────────────────────────────── */}
        <Animated.View style={[styles.statsRow, statsStyle]}>
          {STATS.map((s, i) => (
            <View key={i} style={styles.statItem}>
              <Text
                style={[styles.statValue, { color: theme.colors.on_surface }]}
              >
                {s.value}
              </Text>
              <Text
                style={[
                  textStyles.labelSm,
                  { color: theme.colors.on_surface_variant },
                ]}
              >
                {s.label}
              </Text>
            </View>
          ))}
        </Animated.View>

        {/* ── CTAs ─────────────────────────────────────────── */}
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
            <Text
              style={[
                textStyles.bodyMd,
                { color: theme.colors.on_surface_variant },
              ]}
            >
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
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  logoEmoji: {
    fontSize: 20,
  },
  sportsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing[4],
  },
  sportEmoji: {
    fontSize: 28,
  },
  heroSection: {
    flex: 1,
    justifyContent: "center",
  },
  heroHeadline: {
    fontSize: 52,
    fontFamily: "Lexend_800ExtraBold",
    lineHeight: 58,
    letterSpacing: -1,
  },
  heroSub: {
    marginTop: spacing[4],
    lineHeight: 26,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing[5],
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: spacing[6],
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontFamily: "Lexend_700Bold",
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
