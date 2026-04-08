// ─────────────────────────────────────────────────────────────
// MilestoneCelebration — full-screen animated overlay shown
// when squad goal hits a milestone (25 / 50 / 75 / 100 %).
//
// Uses react-native-reanimated v4 only — no extra deps.
// Auto-dismisses after 3 s; tapping dismisses early.
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const { width: SW, height: SH } = Dimensions.get('window');

// ── Confetti palette — lime + accent colours ──────────────────
const CONFETTI_COLORS = [
  '#CCFF00', // lime primary
  '#FFFFFF', // white
  '#00E5FF', // cyan
  '#FFD600', // amber
  '#FF6B35', // orange
  '#B4FF39', // light lime
];

const PARTICLE_COUNT = 28;

// ── Single confetti particle ──────────────────────────────────

function ConfettiParticle({ index, delay }: { index: number; delay: number }) {
  const x = (index / PARTICLE_COUNT) * SW * 1.1 - SW * 0.05;
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const size = 6 + (index % 5) * 2; // 6–14 px
  const isSquare = index % 3 !== 0; // mix squares and circles

  const translateY = useSharedValue(-size - 20);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);
  const translateX = useSharedValue(x);

  useEffect(() => {
    const duration = 2000 + (index % 8) * 150;
    const wobble = (index % 2 === 0 ? 1 : -1) * (10 + (index % 4) * 8);

    opacity.value = withDelay(delay, withTiming(1, { duration: 200 }));
    translateY.value = withDelay(
      delay,
      withTiming(SH + 40, { duration, easing: Easing.in(Easing.quad) }),
    );
    translateX.value = withDelay(
      delay,
      withSequence(
        withTiming(x + wobble, { duration: duration / 2 }),
        withTiming(x - wobble / 2, { duration: duration / 2 }),
      ),
    );
    rotate.value = withDelay(
      delay,
      withTiming(720 * (index % 2 === 0 ? 1 : -1), { duration }),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        style,
        {
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: isSquare ? 0 : size / 2,
          left: 0,
        },
      ]}
    />
  );
}

// ── Main overlay ──────────────────────────────────────────────

type Props = {
  milestone: number; // 25 | 50 | 75 | 100
  goalTitle?: string;
  onDismiss: () => void;
};

const MILESTONE_COPY: Record<number, { headline: string; sub: string }> = {
  25:  { headline: '25% REACHED', sub: 'Quarter of the way there — keep pushing!' },
  50:  { headline: 'HALFWAY THERE', sub: "Half the goal done. Squad's fired up." },
  75:  { headline: '75% COMPLETE', sub: 'Final stretch — finish what you started.' },
  100: { headline: 'GOAL CRUSHED', sub: 'The squad did it. Every rep counted.' },
};

export default function MilestoneCelebration({ milestone, goalTitle, onDismiss }: Props) {
  const bgOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.6);
  const cardOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  const dismiss = useCallback(() => {
    bgOpacity.value = withTiming(0, { duration: 300 });
    cardOpacity.value = withTiming(0, { duration: 250 });
    cardScale.value = withTiming(0.8, { duration: 250 });
    // Delay the actual close so animation completes
    setTimeout(onDismiss, 320);
  }, [onDismiss]);

  useEffect(() => {
    // Entrance
    bgOpacity.value = withTiming(1, { duration: 350 });
    cardScale.value = withSpring(1, { damping: 14, stiffness: 180 });
    cardOpacity.value = withTiming(1, { duration: 300 });

    // Gentle pulse on the percent badge
    pulseScale.value = withDelay(
      400,
      withSequence(
        withTiming(1.12, { duration: 400, easing: Easing.out(Easing.quad) }),
        withTiming(1,    { duration: 300, easing: Easing.in(Easing.quad) }),
        withTiming(1.08, { duration: 300 }),
        withTiming(1,    { duration: 250 }),
      ),
    );

    // Auto-dismiss
    const timer = setTimeout(dismiss, 3200);
    return () => clearTimeout(timer);
  }, []);

  const bgStyle = useAnimatedStyle(() => ({ opacity: bgOpacity.value }));
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const copy = MILESTONE_COPY[milestone] ?? MILESTONE_COPY[100];
  const isGoalComplete = milestone === 100;

  return (
    <Modal transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.overlay, bgStyle]}>
        {/* Confetti layer */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
            <ConfettiParticle key={i} index={i} delay={i * 40} />
          ))}
        </View>

        {/* Tap-to-dismiss */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={dismiss}
        />

        {/* Content card */}
        <Animated.View style={[styles.card, cardStyle]}>
          {/* Neon top bar */}
          <View style={styles.topAccent} />

          {/* Percent badge */}
          <Animated.View style={[styles.badge, pulseStyle]}>
            <Text style={styles.badgeText}>{milestone}%</Text>
          </Animated.View>

          <Text style={styles.headline}>{copy.headline}</Text>

          {goalTitle ? (
            <Text style={styles.goalLabel} numberOfLines={1}>
              {goalTitle}
            </Text>
          ) : null}

          <Text style={styles.sub}>{copy.sub}</Text>

          {isGoalComplete && (
            <View style={styles.completePill}>
              <Text style={styles.completePillText}>GOAL COMPLETE</Text>
            </View>
          )}

          <Text style={styles.tapHint}>tap to dismiss</Text>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
    top: 0,
  },
  card: {
    width: SW * 0.82,
    backgroundColor: '#0E1A08', // deep obsidian-green
    borderWidth: 1,
    borderColor: '#CCFF00',
    padding: spacing[6],
    alignItems: 'center',
    // Neon glow shadow
    shadowColor: '#CCFF00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 20,
  },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#CCFF00',
  },
  badge: {
    backgroundColor: '#CCFF00',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2],
    marginBottom: spacing[4],
    marginTop: spacing[2],
  },
  badgeText: {
    fontFamily: 'Lexend-ExtraBold',
    fontSize: 36,
    color: '#0A1400',
    letterSpacing: -1,
  },
  headline: {
    fontFamily: 'Lexend-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  goalLabel: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 13,
    color: '#CCFF00',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: spacing[3],
    opacity: 0.9,
  },
  sub: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing[5],
  },
  completePill: {
    borderWidth: 1,
    borderColor: '#CCFF00',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[1.5],
    marginBottom: spacing[4],
  },
  completePillText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 11,
    color: '#CCFF00',
    letterSpacing: 2,
  },
  tapHint: {
    fontFamily: 'Manrope-Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1,
  },
});
