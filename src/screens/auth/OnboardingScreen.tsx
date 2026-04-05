// ─────────────────────────────────────────────────────────────
// OnboardingScreen — 4-step post-signup personalisation flow.
// Strava-style: name/dob/gender → sports → notifications → welcome.
// ─────────────────────────────────────────────────────────────

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TextInput,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ImageBackground,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Notifications from "expo-notifications";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

import GradientButton from "../../components/common/GradientButton";
import { useAuthContext } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { textStyles } from "../../theme/typography";
import { spacing } from "../../theme/spacing";
import { usersApi } from "../../services/supabase";

const { width, height } = Dimensions.get("window");
const TOTAL_STEPS = 4;
const WELCOME_BG = require("../../../assets/bg.jpg");

// ── Data ─────────────────────────────────────────────────────

const SPORTS = [
  { id: "run", emoji: "🏃", label: "Running" },
  { id: "cycle", emoji: "🚴", label: "Cycling" },
  { id: "swim", emoji: "🏊", label: "Swimming" },
  { id: "strength", emoji: "🏋️", label: "Gym" },
  { id: "yoga", emoji: "🧘", label: "Yoga" },
  { id: "hike", emoji: "🥾", label: "Hiking" },
  { id: "tennis", emoji: "🎾", label: "Tennis" },
  { id: "other", emoji: "⚡", label: "Other" },
];

const GENDERS = ["Man", "Woman", "Non-binary", "Prefer not to say"];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// ── Component ─────────────────────────────────────────────────

export default function OnboardingScreen() {
  const { theme } = useTheme();
  const { dbUser, completeOnboarding } = useAuthContext();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 0 — personal info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<string | null>(null);

  // Step 1 — sports
  const [sports, setSports] = useState<string[]>([]);

  // Slide animation
  const slideX = useSharedValue(0);
  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }],
  }));

  // Welcome screen: orange tide rises from bottom while image loads,
  // then image fades in and tide recedes.
  const bgOpacity    = useSharedValue(0);          // bg.jpg opacity
  const tideY        = useSharedValue(height);      // orange tide — starts below screen
  const tideFade     = useSharedValue(1);           // fades out once image is ready

  const bgImageStyle = useAnimatedStyle(() => ({ opacity: bgOpacity.value }));
  const tideStyle    = useAnimatedStyle(() => ({
    transform: [{ translateY: tideY.value }],
    opacity: tideFade.value,
  }));

  // Kick off the rising tide the moment user reaches the welcome step
  useEffect(() => {
    if (step === 3) {
      tideY.value    = height;   // reset (in case they navigate back/forward)
      tideFade.value = 1;
      bgOpacity.value = 0;
      // Rise up from bottom over 1 second
      tideY.value = withTiming(0, { duration: 1000, easing: Easing.out(Easing.cubic) });
    }
  }, [step]);

  const onBgLoaded = () => {
    // Image ready — fade it in, then recede the tide
    bgOpacity.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.quad) });
    tideFade.value  = withDelay(400, withTiming(0, { duration: 600 }));
  };

  // ── Helpers ─────────────────────────────────────────────────

  const animate = (dir: "fwd" | "back") => {
    slideX.value = dir === "fwd" ? width : -width;
    slideX.value = withTiming(0, {
      duration: 340,
      easing: Easing.out(Easing.cubic),
    });
  };

  const goNext = () => {
    animate("fwd");
    setStep((s) => s + 1);
  };
  const goBack = () => {
    animate("back");
    setStep((s) => s - 1);
  };

  const toggleSport = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSports((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  // Birthdate auto-format: MM/DD/YYYY
  const handleBirthDate = (text: string) => {
    const digits = text.replace(/\D/g, "");
    let formatted = digits;
    if (digits.length > 2)
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    if (digits.length > 4)
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
    setBirthDate(formatted);
  };

  const handlePersonalNext = async () => {
    const name = `${firstName.trim()} ${lastName.trim()}`.trim();
    const usernameBase =
      firstName.trim().toLowerCase() +
      (lastName.trim() ? "." + lastName.trim().toLowerCase() : "");
    setSaving(true);
    try {
      if (dbUser) {
        await usersApi.update(dbUser.id, {
          display_name: name || dbUser.display_name,
          username: usernameBase.replace(/[^a-z0-9_.]/g, "") || dbUser.username,
        });
      }
    } catch (_) {
    } finally {
      setSaving(false);
      goNext();
    }
  };

  const handleNotificationRequest = async () => {
    try {
      await Notifications.requestPermissionsAsync();
    } catch (_) {}
    goNext();
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await completeOnboarding();
    } finally {
      setSaving(false);
    }
  };

  // ── Progress & accent ────────────────────────────────────────

  const progressPct = ((step + 1) / TOTAL_STEPS) * 100;

  // ── Step 0 — Tell us who you are ────────────────────────────

  const canContinuePersonal = firstName.trim().length > 0;

  const renderPersonal = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.heading, { color: theme.colors.on_surface }]}>
          Tell us who{"\n"}you are.
        </Text>
        <Text
          style={[styles.subText, { color: theme.colors.on_surface_variant }]}
        >
          Your squad will see this name on the leaderboard.
        </Text>

        {/* Name row */}
        <View style={styles.nameRow}>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.fieldLabel,
                { color: theme.colors.on_surface_variant },
              ]}
            >
              First name
            </Text>
            <TextInput
              style={[
                styles.field,
                {
                  color: theme.colors.on_surface,
                  backgroundColor: theme.colors.surface_container,
                  borderColor: firstName
                    ? theme.colors.primary
                    : theme.colors.outline,
                },
              ]}
              placeholder="Alex"
              placeholderTextColor={theme.colors.on_surface_variant + "55"}
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              autoFocus
              returnKeyType="next"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.fieldLabel,
                { color: theme.colors.on_surface_variant },
              ]}
            >
              Last name
            </Text>
            <TextInput
              style={[
                styles.field,
                {
                  color: theme.colors.on_surface,
                  backgroundColor: theme.colors.surface_container,
                  borderColor: lastName
                    ? theme.colors.primary
                    : theme.colors.outline,
                },
              ]}
              placeholder="Johnson"
              placeholderTextColor={theme.colors.on_surface_variant + "55"}
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>
        </View>

        {/* Birthdate */}
        <View style={styles.fieldGroup}>
          <Text
            style={[
              styles.fieldLabel,
              { color: theme.colors.on_surface_variant },
            ]}
          >
            Date of birth
          </Text>
          <TextInput
            style={[
              styles.field,
              {
                color: theme.colors.on_surface,
                backgroundColor: theme.colors.surface_container,
                borderColor:
                  birthDate.length === 10
                    ? theme.colors.primary
                    : theme.colors.outline,
              },
            ]}
            placeholder="MM / DD / YYYY"
            placeholderTextColor={theme.colors.on_surface_variant + "55"}
            value={birthDate}
            onChangeText={handleBirthDate}
            keyboardType="number-pad"
            maxLength={10}
            returnKeyType="next"
          />
        </View>

        {/* Gender */}
        <View style={styles.fieldGroup}>
          <Text
            style={[
              styles.fieldLabel,
              { color: theme.colors.on_surface_variant },
            ]}
          >
            Gender
          </Text>
          <View style={styles.genderPills}>
            {GENDERS.map((g) => {
              const selected = gender === g;
              return (
                <Pressable
                  key={g}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setGender(g);
                  }}
                  style={[
                    styles.genderPill,
                    {
                      backgroundColor: selected
                        ? theme.colors.primary
                        : theme.colors.surface_container,
                      borderColor: selected
                        ? theme.colors.primary
                        : theme.colors.outline,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.genderPillText,
                      {
                        color: selected
                          ? theme.colors.on_primary
                          : theme.colors.on_surface_variant,
                      },
                    ]}
                  >
                    {g}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.ctaBlock}>
          <GradientButton
            label={saving ? "Saving…" : "Continue"}
            onPress={handlePersonalNext}
            size="lg"
            disabled={!canContinuePersonal || saving}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  // ── Step 1 — Sports ──────────────────────────────────────────

  const renderSports = () => (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.heading, { color: theme.colors.on_surface }]}>
        Which sports{"\n"}do you do?
      </Text>
      <Text
        style={[styles.subText, { color: theme.colors.on_surface_variant }]}
      >
        Select all that apply. This helps your squad build relevant goals.
      </Text>

      <View style={styles.sportsGrid}>
        {SPORTS.map((sport) => {
          const sel = sports.includes(sport.id);
          return (
            <Pressable
              key={sport.id}
              onPress={() => toggleSport(sport.id)}
              style={[
                styles.sportTile,
                {
                  backgroundColor: sel
                    ? theme.colors.primary + "18"
                    : theme.colors.surface_container,
                  borderColor: sel
                    ? theme.colors.primary
                    : theme.colors.outline,
                },
              ]}
            >
              <Text style={styles.sportEmoji}>{sport.emoji}</Text>
              <Text
                style={[
                  styles.sportLabel,
                  {
                    color: sel ? theme.colors.primary : theme.colors.on_surface,
                  },
                ]}
              >
                {sport.label}
              </Text>
              {sel && (
                <View
                  style={[
                    styles.sportCheck,
                    { backgroundColor: theme.colors.primary },
                  ]}
                >
                  <Ionicons
                    name="checkmark"
                    size={10}
                    color={theme.colors.on_primary}
                  />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.ctaBlock}>
        <GradientButton
          label={
            sports.length > 0
              ? `Continue  (${sports.length} selected)`
              : "Continue"
          }
          onPress={goNext}
          size="lg"
        />
        {sports.length === 0 && (
          <TouchableOpacity
            onPress={goNext}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text
              style={[
                styles.skipText,
                { color: theme.colors.on_surface_variant },
              ]}
            >
              Skip for now
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );

  // ── Step 2 — Notifications ───────────────────────────────────

  const renderNotifications = () => (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { flexGrow: 1 }]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.notifIconWrap,
            { backgroundColor: theme.colors.primary + "18" },
          ]}
        >
          <Ionicons
            name="notifications-outline"
            size={34}
            color={theme.colors.primary}
          />
        </View>

        <Text style={[styles.heading, { color: theme.colors.on_surface }]}>
          Stay connected{"\n"}to what matters.
        </Text>
        <Text
          style={[styles.subText, { color: theme.colors.on_surface_variant }]}
        >
          The best squads stay in sync. Enable notifications so you never fall
          behind.
        </Text>

        <View style={styles.notifList}>
          {[
            { icon: "barbell-outline", text: "When a teammate logs a workout" },
            {
              icon: "trending-up-outline",
              text: "When your squad hits a milestone",
            },
            {
              icon: "flame-outline",
              text: "Daily nudges to protect your streak",
            },
            { icon: "trophy-outline", text: "Goal completions and squad wins" },
          ].map((item, i) => (
            <View key={i} style={styles.notifItem}>
              <View
                style={[
                  styles.notifDot,
                  { backgroundColor: theme.colors.primary + "20" },
                ]}
              >
                <Ionicons
                  name={item.icon as any}
                  size={18}
                  color={theme.colors.primary}
                />
              </View>
              <Text
                style={[
                  textStyles.bodyMd,
                  { color: theme.colors.on_surface, flex: 1, lineHeight: 22 },
                ]}
              >
                {item.text}
              </Text>
            </View>
          ))}
        </View>

        <View
          style={[
            styles.ctaBlock,
            { marginTop: "auto", paddingTop: spacing[6] },
          ]}
        >
          <GradientButton
            label="Turn on notifications"
            onPress={handleNotificationRequest}
            size="lg"
          />
          <TouchableOpacity
            onPress={goNext}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text
              style={[
                styles.skipText,
                { color: theme.colors.on_surface_variant },
              ]}
            >
              Not now
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  // ── Step 3 — Welcome ─────────────────────────────────────────

  const renderWelcome = () => {
    const name = firstName.trim() || "Athlete";
    const sportEmojis = SPORTS.filter((s) => sports.includes(s.id))
      .map((s) => s.emoji)
      .slice(0, 5)
      .join("  ");

    return (
      <SafeAreaView edges={["bottom"]} style={{ flex: 1 }}>
        {/* Layer 1: instant dark base — shows immediately, no wait */}
        <LinearGradient
          colors={[theme.colors.background, "#1a0a00"]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />

        {/* Layer 2: orange tide rising from bottom while image loads */}
        <Animated.View style={[StyleSheet.absoluteFill, tideStyle]} pointerEvents="none">
          <LinearGradient
            colors={["transparent", theme.colors.primary + "55", theme.colors.primary]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        </Animated.View>

        {/* Layer 3: bg.jpg — fades in when ready, tide recedes behind it */}
        <Animated.View style={[StyleSheet.absoluteFill, bgImageStyle]}>
          <ImageBackground
            source={WELCOME_BG}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            onLoad={onBgLoaded}
          >
            {/* Dark scrim so text stays legible over any image */}
            <LinearGradient
              colors={["rgba(0,0,0,0.35)", "rgba(0,0,0,0.72)"]}
              style={StyleSheet.absoluteFill}
            />
          </ImageBackground>
        </Animated.View>

        {/* All content pushed to bottom, just above the button */}
        <View style={styles.welcomeOuter}>
          <View style={styles.welcomeBody}>
            <Text style={[styles.welcomeTitle, { color: "#fff" }]}>
              Welcome,{"\n"}
              <Text style={{ color: theme.colors.primary }}>{name}.</Text>
            </Text>

            <Text style={[styles.welcomeSub, { color: "rgba(255,255,255,0.75)" }]}>
              Your squad is waiting. Every rep, every run, every session — it all counts here.
            </Text>

            <View style={[styles.statsRow, {
              backgroundColor: "rgba(0,0,0,0.40)",
              borderColor: "rgba(255,255,255,0.12)",
            }]}>
              {[
                { v: "2.4M", l: "Athletes" },
                { v: "847K", l: "Squads" },
                { v: "18M",  l: "Workouts" },
              ].map((s, i) => (
                <React.Fragment key={i}>
                  {i > 0 && (
                    <View style={[styles.statDivider, { backgroundColor: "rgba(255,255,255,0.12)" }]} />
                  )}
                  <View style={styles.statCell}>
                    <Text style={[styles.statVal, { color: "#fff" }]}>{s.v}</Text>
                    <Text style={[textStyles.labelSm, { color: "rgba(255,255,255,0.55)" }]}>{s.l}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
          </View>

          <View
            style={[
              styles.ctaBlock,
              { paddingHorizontal: spacing[6], paddingBottom: spacing[4] },
            ]}
          >
            <GradientButton
              label={saving ? "Setting up…" : "Start Training"}
              onPress={handleFinish}
              size="lg"
              disabled={saving}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return renderPersonal();
      case 1:
        return renderSports();
      case 2:
        return renderNotifications();
      case 3:
        return renderWelcome();
      default:
        return null;
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" />

      {step < 3 && (
        <SafeAreaView edges={["top"]} style={styles.topBar}>
          {/* Progress */}
          <View
            style={[
              styles.progressTrack,
              { backgroundColor: theme.colors.surface_container_high },
            ]}
          >
            <Animated.View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.colors.primary,
                  width: `${progressPct}%` as any,
                },
              ]}
            />
          </View>

          {/* Nav row */}
          <View style={styles.navRow}>
            {step > 0 && step < 3 ? (
              <TouchableOpacity
                onPress={goBack}
                style={styles.backBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons
                  name="arrow-back"
                  size={22}
                  color={theme.colors.on_surface}
                />
              </TouchableOpacity>
            ) : (
              <View style={styles.backBtn} />
            )}
            <Text
              style={[
                styles.stepCount,
                { color: theme.colors.on_surface_variant },
              ]}
            >
              {step + 1} / {TOTAL_STEPS}
            </Text>
          </View>
        </SafeAreaView>
      )}

      <Animated.View style={[{ flex: 1 }, slideStyle]}>
        {renderStep()}
      </Animated.View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────

const TILE_SIZE = (width - spacing[6] * 2 - spacing[3] * 3) / 4;

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Top bar
  topBar: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[1],
  },
  progressTrack: {
    height: 3,
    borderRadius: 0,
    overflow: "hidden",
    marginTop: spacing[3],
  },
  progressFill: {
    height: 3,
    borderRadius: 0,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 48,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
  },
  stepCount: {
    fontSize: 13,
    fontFamily: "Manrope-Medium",
    letterSpacing: 0.5,
  },

  // Shared content
  scrollContent: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[10],
  },
  heading: {
    fontSize: 38,
    fontFamily: "Lexend-ExtraBold",
    lineHeight: 44,
    letterSpacing: -0.5,
    marginBottom: spacing[3],
  },
  subText: {
    fontSize: 15,
    fontFamily: "Manrope-Regular",
    lineHeight: 23,
    marginBottom: spacing[8],
  },
  ctaBlock: {
    gap: spacing[4],
    marginTop: spacing[4],
  },
  skipText: {
    textAlign: "center",
    fontSize: 14,
    fontFamily: "Manrope-Medium",
    paddingVertical: spacing[2],
  },

  // Personal step
  nameRow: {
    flexDirection: "row",
    gap: spacing[3],
    marginBottom: spacing[5],
  },
  fieldGroup: {
    marginBottom: spacing[5],
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: "Manrope-SemiBold",
    letterSpacing: 0.8,
    marginBottom: spacing[2],
    textTransform: "uppercase",
  },
  field: {
    height: 52,
    borderRadius: 0,
    borderWidth: 1.5,
    paddingHorizontal: spacing[4],
    fontSize: 16,
    fontFamily: "Manrope-Medium",
  },
  genderPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  genderPill: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: 0,
    borderWidth: 1.5,
  },
  genderPillText: {
    fontSize: 14,
    fontFamily: "Manrope-Medium",
  },

  // Sports step
  sportsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  sportTile: {
    width: TILE_SIZE,
    height: TILE_SIZE + 10,
    borderRadius: 0,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  sportEmoji: {
    fontSize: 26,
  },
  sportLabel: {
    fontSize: 11,
    fontFamily: "Manrope-SemiBold",
  },
  sportCheck: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  // Notifications step
  notifIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 0,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[6],
  },
  notifList: {
    gap: spacing[4],
    marginBottom: spacing[2],
  },
  notifItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[4],
  },
  notifDot: {
    width: 40,
    height: 40,
    borderRadius: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  // Welcome step
  welcomeOuter: {
    flex: 1,
    justifyContent: "flex-end",
  },
  welcomeBody: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[5],
  },
  welcomeTitle: {
    fontSize: 44,
    fontFamily: "Lexend-ExtraBold",
    lineHeight: 52,
    letterSpacing: -1,
    marginBottom: spacing[3],
  },
  welcomeSub: {
    fontSize: 15,
    fontFamily: "Manrope-Regular",
    lineHeight: 23,
    marginBottom: spacing[5],
  },
  sportsBadge: {
    borderRadius: 0,
    borderWidth: 1,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  statsRow: {
    flexDirection: "row",
    borderRadius: 0,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: spacing[2],
  },
  statCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing[4],
    gap: 2,
  },
  statDivider: {
    width: 1,
    marginVertical: spacing[3],
  },
  statVal: {
    fontSize: 17,
    fontFamily: "Lexend-Bold",
  },
});
