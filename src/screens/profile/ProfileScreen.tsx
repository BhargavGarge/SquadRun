// Profile screen — avatar, stats, badges, and settings CTA

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "@clerk/clerk-expo";

import GlassCard from "../../components/common/GlassCard";
import Avatar from "../../components/common/Avatar";
import Badge from "../../components/common/Badge";
import GradientButton from "../../components/common/GradientButton";
import ActivityFeedItem from "../../components/squad/ActivityFeedItem";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuthContext } from "../../contexts/AuthContext";
import { useSquadStore } from "../../contexts/SquadContext";
import { usersApi, storageApi } from "../../services/supabase";
import { textStyles } from "../../theme/typography";
import { spacing, radius } from "../../theme/spacing";

// Achievement definitions — badgeKey maps to SVG geometric icon in Badge component
const SAMPLE_BADGES = [
  { badgeKey: "first_run",    name: "First Run",    earned: true  },
  { badgeKey: "streak_7",     name: "7-Day Streak", earned: true  },
  { badgeKey: "distance_100", name: "100km Club",   earned: false },
  { badgeKey: "goal_crusher", name: "Goal Crusher", earned: false },
];

export default function ProfileScreen() {
  const { theme } = useTheme();
  const { dbUser, refreshUser } = useAuthContext();
  const navigation = useNavigation<any>();
  const { signOut } = useAuth();
  const { squads, clearSquad, activity } = useSquadStore();

  const [uploading, setUploading] = useState(false);

  const handlePickAvatar = async () => {
    // Request permission first — required on iOS, no-op on Android
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Allow access to your photo library in Settings to change your profile picture."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",   // v17+: string literal, not MediaType enum
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0] && dbUser) {
      setUploading(true);
      try {
        const localUri = result.assets[0].uri;
        // Upload to Supabase storage and get a permanent public URL.
        // Use clerk_id as folder path — storage RLS checks auth.uid() which
        // returns the Clerk user sub, not the Supabase DB row UUID.
        const publicUrl = await storageApi.uploadAvatar(dbUser.clerk_id, localUri);
        await usersApi.update(dbUser.id, { avatar_url: publicUrl });
        await refreshUser();
      } catch (err: any) {
        console.error("[Profile] avatar upload:", err);
        Alert.alert("Couldn't update photo", err.message ?? "Please try again.");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSignOut = async () => {
    clearSquad();
    await signOut();
  };

  const totalWorkouts = 24; // Would come from DB in production
  const totalKm = 187.5;
  const currentStreak = 5;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: spacing[20] }}
        >
          {/* Header gradient */}
          <LinearGradient
            colors={[theme.colors.gradient_card_start, "transparent"]}
            style={styles.headerGrad}
          >
            {/* Settings button */}
            <TouchableOpacity
              onPress={() => navigation.navigate("Settings")}
              style={[
                styles.settingsBtn,
                { backgroundColor: theme.colors.surface_container_high },
              ]}
            >
              <Ionicons
                name="settings-outline"
                size={20}
                color={theme.colors.on_surface}
              />
            </TouchableOpacity>

            {/* Avatar */}
            <View style={styles.avatarSection}>
              <TouchableOpacity
                onPress={handlePickAvatar}
                activeOpacity={0.8}
                disabled={uploading}
              >
                <Avatar
                  uri={dbUser?.avatar_url}
                  name={dbUser?.display_name}
                  size={88}
                  showBorder
                />
                <View
                  style={[
                    styles.editBadge,
                    { backgroundColor: theme.colors.primary },
                  ]}
                >
                  {uploading ? (
                    <ActivityIndicator size={12} color="#fff" />
                  ) : (
                    <Ionicons name="camera" size={12} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>

              <Text
                style={[
                  textStyles.headlineLg,
                  { color: theme.colors.on_surface, marginTop: spacing[3] },
                ]}
              >
                {dbUser?.display_name ?? "Squad Member"}
              </Text>
              <Text
                style={[
                  textStyles.bodyMd,
                  { color: theme.colors.on_surface_variant, marginTop: 2 },
                ]}
              >
                @{dbUser?.username ?? "member"}
              </Text>
              {dbUser?.fitness_level && (
                <View
                  style={[
                    styles.levelBadge,
                    {
                      backgroundColor: `${theme.colors.primary}22`,
                      borderColor: `${theme.colors.primary}44`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      textStyles.labelSm,
                      { color: theme.colors.primary_light },
                    ]}
                  >
                    {dbUser.fitness_level.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>

          {/* Stats row */}
          <View style={styles.statsRow}>
            {[
              { label: "Workouts", value: totalWorkouts.toString() },
              { label: "Km Total", value: totalKm.toFixed(0) },
              { label: "Squads", value: squads.length.toString() },
              { label: "Streak🔥", value: `${currentStreak}d` },
            ].map((stat, i) => (
              <GlassCard
                key={stat.label}
                style={styles.statCard}
                padding={spacing[1]}
              >
                <Text
                  style={[
                    textStyles.headlineSm,
                    { color: theme.colors.primary_light },
                  ]}
                >
                  {stat.value}
                </Text>
                <Text
                  style={[
                    textStyles.labelSm,
                    { color: theme.colors.on_surface_variant },
                  ]}
                >
                  {stat.label}
                </Text>
              </GlassCard>
            ))}
          </View>

          {/* Badges */}
          <View style={styles.section}>
            <Text
              style={[
                textStyles.labelMd,
                styles.sectionLabel,
                { color: theme.colors.on_surface_variant },
              ]}
            >
              Badges
            </Text>
            {/* Tactical badge grid — 2-column, geometric icons, scan-line animation */}
            <View style={styles.badgesGrid}>
              {SAMPLE_BADGES.map((badge, i) => (
                <Badge
                  key={badge.name}
                  badgeKey={badge.badgeKey as any}
                  name={badge.name}
                  earned={badge.earned}
                  size="md"
                  animationDelay={i * 120}
                />
              ))}
            </View>
          </View>

          {/* Bio */}
          {dbUser?.bio && (
            <View style={styles.section}>
              <Text
                style={[
                  textStyles.labelMd,
                  styles.sectionLabel,
                  { color: theme.colors.on_surface_variant },
                ]}
              >
                Bio
              </Text>
              <GlassCard padding={spacing[4]}>
                <Text
                  style={[
                    textStyles.bodyMd,
                    { color: theme.colors.on_surface },
                  ]}
                >
                  {dbUser.bio}
                </Text>
              </GlassCard>
            </View>
          )}

          {/* Recent activity (from active squad feed, filtered to user) */}
          <View style={styles.section}>
            <Text
              style={[
                textStyles.labelMd,
                styles.sectionLabel,
                { color: theme.colors.on_surface_variant },
              ]}
            >
              Activity
            </Text>
            <GlassCard>
              {squads.length === 0 ? (
                <Text
                  style={[
                    textStyles.bodyMd,
                    { color: theme.colors.on_surface_variant },
                  ]}
                >
                  Join a squad to start logging activity.
                </Text>
              ) : (
                <View style={{ gap: spacing[1] }}>
                  {(activity ?? [])
                    .filter((item) => item.user_id === dbUser?.id)
                    .slice(0, 4)
                    .map((item) => (
                      <ActivityFeedItem key={item.id} item={item} />
                    ))}
                </View>
              )}
            </GlassCard>
          </View>

          {/* Actions */}
          <View style={styles.section}>
            <GradientButton
              label="Sign Out"
              onPress={handleSignOut}
              variant="danger"
              icon={
                <Ionicons
                  name="log-out-outline"
                  size={18}
                  color={theme.colors.error}
                />
              }
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerGrad: {
    paddingBottom: spacing[6],
    paddingTop: spacing[4],
    paddingHorizontal: spacing[4],
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 0,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
  },
  avatarSection: {
    alignItems: "center",
    marginTop: spacing[4],
  },
  editBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  levelBadge: {
    marginTop: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: 0,  // ROUND_NONE
    borderWidth: 1,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: spacing[4],
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  statCard: {
    flex: 1,
    alignItems: "center",
  },
  section: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[5],
  },
  sectionLabel: {
    marginBottom: spacing[3],
  },
  badgesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
    justifyContent: "space-between",
  },
});
