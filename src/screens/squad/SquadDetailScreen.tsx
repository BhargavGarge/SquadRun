// ─────────────────────────────────────────────────────────────
// SquadDetailScreen — full squad view with:
//   • Goal progress ring + bar
//   • Member leaderboard
//   • Activity feed
//   • Quick-log CTA
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import GlassCard from '../../components/common/GlassCard';
import ProgressRing from '../../components/common/ProgressRing';
import AnimatedProgressBar from '../../components/common/AnimatedProgressBar';
import MemberRow from '../../components/squad/MemberRow';
import ActivityFeedItem from '../../components/squad/ActivityFeedItem';
import GradientButton from '../../components/common/GradientButton';
import Avatar from '../../components/common/Avatar';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuthContext } from '../../contexts/AuthContext';
import { useSquadStore } from '../../contexts/SquadContext';
import { textStyles } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { formatValue, getDaysLeft } from '../../utils/helpers';
import { workoutsApi } from '../../services/supabase';
import type { SquadMember } from '../../types';

export default function SquadDetailScreen() {
  const { theme } = useTheme();
  const { dbUser } = useAuthContext();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { squadId } = route.params;

  const { activeSquad, activeGoal, goalProgress, activity, selectSquad, workouts } = useSquadStore();
  const [contributions, setContributions] = useState<Record<string, number>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'activity'>('leaderboard');

  useEffect(() => {
    if (activeSquad?.id !== squadId) {
      // Load the squad if not already active
      const squadsState = useSquadStore.getState();
      const squad = squadsState.squads.find(s => s.id === squadId);
      if (squad) selectSquad(squad);
    }
  }, [squadId]);

  useEffect(() => {
    if (activeGoal) loadContributions();
  }, [activeGoal?.id]);

  const loadContributions = async () => {
    if (!activeGoal) return;
    try {
      const rows = await workoutsApi.getMemberContributions(activeGoal.id);
      const map: Record<string, number> = {};
      for (const row of rows) {
        const val = activeGoal.unit === 'km' ? (row.distance_km ?? 0)
          : activeGoal.unit === 'hours' ? (row.duration_minutes ?? 0) / 60
          : activeGoal.unit === 'calories' ? (row.calories ?? 0)
          : 1;
        map[row.user_id] = (map[row.user_id] ?? 0) + val;
      }
      setContributions(map);
    } catch (err) {
      console.error('[SquadDetail] loadContributions:', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    const squadsState = useSquadStore.getState();
    const squad = squadsState.squads.find(s => s.id === squadId);
    if (squad) await selectSquad(squad);
    await loadContributions();
    setRefreshing(false);
  };

  const handleShare = async () => {
    if (!activeSquad) return;
    try {
      await Share.share({
        message: `Join my Squad Goals squad "${activeSquad.name}"! Use code: ${activeSquad.invite_code}`,
        title: 'Join my Squad Goals squad',
      });
    } catch (err) {
      // User cancelled share
    }
  };

  // Sort members by contribution descending for leaderboard
  const sortedMembers = (activeSquad?.members ?? [])
    .map(m => ({ ...m, contrib: contributions[m.user_id] ?? 0 }))
    .sort((a, b) => b.contrib - a.contrib);

  const maxContrib = Math.max(...sortedMembers.map(m => m.contrib), 0.1);
  const daysLeft = activeGoal ? getDaysLeft(activeGoal.ends_at) : 0;

  if (!activeSquad) {
    return (
      <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[textStyles.bodyMd, { color: theme.colors.on_surface_variant }]}>
            Loading squad...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: spacing[24] }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary_light} />
          }
        >
          {/* ── Header ───────────────────────────────────────── */}
          <LinearGradient
            colors={[theme.colors.gradient_card_start, 'transparent']}
            style={styles.headerGrad}
          >
            <View style={styles.topBar}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                <Ionicons name="arrow-back" size={22} color={theme.colors.on_surface} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShare} style={styles.iconBtn}>
                <Ionicons name="share-outline" size={22} color={theme.colors.on_surface} />
              </TouchableOpacity>
            </View>

            {/* Squad info */}
            <View style={styles.squadInfo}>
              <Text style={[textStyles.displaySm, { color: theme.colors.on_surface }]}>
                {activeSquad.name}
              </Text>
              {activeSquad.description ? (
                <Text style={[textStyles.bodyMd, { color: theme.colors.on_surface_variant, marginTop: 4 }]}>
                  {activeSquad.description}
                </Text>
              ) : null}

              {/* Member avatars */}
              <View style={styles.memberAvatars}>
                {(activeSquad.members ?? []).slice(0, 6).map((m, i) => (
                  <Avatar
                    key={m.id}
                    uri={m.user?.avatar_url}
                    name={m.user?.display_name}
                    size={36}
                    showBorder
                    borderColor={theme.colors.surface_container}
                    style={{ marginLeft: i === 0 ? 0 : -10, zIndex: 6 - i }}
                  />
                ))}
                <Text style={[textStyles.bodySm, { color: theme.colors.on_surface_variant, marginLeft: 10 }]}>
                  {activeSquad.members?.length ?? 0} / {activeSquad.max_members} members
                </Text>
              </View>

              {/* Invite code */}
              <GlassCard
                style={styles.inviteCode}
                padding={12}
                onPress={handleShare}
              >
                <Ionicons name="link-outline" size={16} color={theme.colors.primary_light} />
                <Text style={[textStyles.titleMd, { color: theme.colors.on_surface }]}>
                  Invite code:
                </Text>
                <Text style={[textStyles.headlineSm, { color: theme.colors.primary_light, letterSpacing: 4 }]}>
                  {activeSquad.invite_code}
                </Text>
              </GlassCard>
            </View>
          </LinearGradient>

          {/* ── Active goal ───────────────────────────────────── */}
          <View style={styles.section}>
            {activeGoal ? (
              <GlassCard elevated style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[textStyles.labelMd, { color: theme.colors.primary_light }]}>
                      Active Goal
                    </Text>
                    <Text style={[textStyles.headlineSm, { color: theme.colors.on_surface, marginTop: 4 }]}>
                      {activeGoal.title}
                    </Text>
                    {daysLeft > 0 && (
                      <Text style={[textStyles.bodySm, { color: theme.colors.on_surface_variant, marginTop: 2 }]}>
                        {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining
                      </Text>
                    )}
                  </View>
                  <ProgressRing
                    progress={goalProgress}
                    size={88}
                    strokeWidth={8}
                    sublabel={activeGoal.unit}
                  />
                </View>

                <AnimatedProgressBar
                  progress={goalProgress}
                  height={10}
                  showLabel
                  labelLeft={`${formatValue(activeGoal.current_value ?? 0, activeGoal.unit)}`}
                  labelRight={`${formatValue(activeGoal.target_value, activeGoal.unit)}`}
                  style={{ marginTop: spacing[3] }}
                />
              </GlassCard>
            ) : (
              <GlassCard
                style={styles.noGoalCard}
                onPress={() => navigation.navigate('CreateGoal', { squadId: activeSquad.id })}
              >
                <Ionicons name="flag-outline" size={24} color={theme.colors.primary_light} />
                <View style={{ flex: 1 }}>
                  <Text style={[textStyles.titleLg, { color: theme.colors.on_surface }]}>
                    Set a squad goal
                  </Text>
                  <Text style={[textStyles.bodySm, { color: theme.colors.on_surface_variant }]}>
                    Rally your squad around a shared challenge
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.on_surface_variant} />
              </GlassCard>
            )}
          </View>

          {/* ── Quick log button ──────────────────────────────── */}
          <View style={[styles.section, { paddingTop: 0 }]}>
            <GradientButton
              label="Log a Workout"
              onPress={() =>
                navigation.navigate('LogWorkout', {
                  squadId: activeSquad.id,
                  goalId: activeGoal?.id,
                })
              }
              icon={<Ionicons name="add-circle-outline" size={20} color="#fff" />}
            />
          </View>

          {/* ── Tabs — tonal separation, no border line ──────── */}
          <View style={styles.tabs}>
            {(['leaderboard', 'activity'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tab,
                  { backgroundColor: activeTab === tab ? theme.colors.surface_container_high : 'transparent' },
                ]}
                onPress={() => setActiveTab(tab)}
              >
                {/* Active indicator bar — lime bottom accent */}
                {activeTab === tab && (
                  <View style={[styles.tabAccent, { backgroundColor: theme.colors.primary }]} />
                )}
                <Text
                  style={[
                    textStyles.labelMd,
                    {
                      color: activeTab === tab
                        ? theme.colors.primary
                        : theme.colors.on_surface_variant,
                    },
                  ]}
                >
                  {tab === 'leaderboard' ? 'LEADERBOARD' : 'ACTIVITY'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Leaderboard ───────────────────────────────────── */}
          {activeTab === 'leaderboard' && (
            <View style={styles.section}>
              {sortedMembers.map((m, i) => (
                <MemberRow
                  key={m.id}
                  member={m}
                  rank={i + 1}
                  contribution={m.contrib}
                  maxContribution={maxContrib}
                  unit={activeGoal?.unit ?? 'pts'}
                  animationDelay={i * 80}
                />
              ))}
            </View>
          )}

          {/* ── Activity feed ─────────────────────────────────── */}
          {activeTab === 'activity' && (
            <View style={styles.section}>
              {activity.length === 0 ? (
                <View style={{ paddingVertical: spacing[8] }}>
                  <Text style={[textStyles.labelMd, { color: theme.colors.primary, marginBottom: spacing[2] }]}>
                    ● STANDBY
                  </Text>
                  <Text style={[textStyles.bodyMd, { color: theme.colors.on_surface_variant }]}>
                    No activity yet — log a workout.
                  </Text>
                </View>
              ) : (
                activity.map((item) => (
                  // Zero-Divider Rule: 8px dead space separates items, no horizontal lines
                  <View key={item.id} style={{ marginBottom: spacing[2] }}>
                    <ActivityFeedItem item={item} />
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerGrad: {
    paddingBottom: spacing[6],
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  squadInfo: {
    paddingHorizontal: spacing[4],
    gap: spacing[3],
    marginTop: spacing[2],
  },
  memberAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[1],
  },
  inviteCode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginTop: spacing[2],
    alignSelf: 'flex-start',
  },
  section: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
  },
  goalCard: {
    marginBottom: spacing[2],
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[4],
  },
  noGoalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  // Tabs — tonal stacking separates, no border line
  tabs: {
    flexDirection: 'row',
    marginHorizontal: spacing[4],
    marginTop: spacing[6],
    gap: spacing[1],
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[3],
    position: 'relative',
  },
  tabAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },
});
