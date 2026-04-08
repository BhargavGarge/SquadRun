// Activity feed item — shows workouts, achievements, joins

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";

import Avatar from "../common/Avatar";
import RouteMapCard from "../workout/RouteMapCard";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuthContext } from "../../contexts/AuthContext";
import { textStyles } from "../../theme/typography";
import { spacing, radius } from "../../theme/spacing";
import type { ActivityItem, WorkoutType, RouteCoord } from "../../types";

interface ActivityFeedItemProps {
  item: ActivityItem;
}

const WORKOUT_ICONS: Record<
  WorkoutType,
  { icon: keyof typeof Ionicons.glyphMap; emoji: string }
> = {
  run: { icon: "walk-outline", emoji: "🏃" },
  cycle: { icon: "bicycle-outline", emoji: "🚴" },
  swim: { icon: "water-outline", emoji: "🏊" },
  strength: { icon: "barbell-outline", emoji: "💪" },
  yoga: { icon: "body-outline", emoji: "🧘" },
  hike: { icon: "trail-sign-outline", emoji: "🥾" },
  other: { icon: "fitness-outline", emoji: "⚡" },
};

export default function ActivityFeedItem({ item }: ActivityFeedItemProps) {
  const { theme } = useTheme();
  const { dbUser } = useAuthContext();
  const distanceUnit = dbUser?.preferred_units === "miles" ? "miles" : "km";

  const getContent = () => {
    switch (item.kind) {
      case "workout": {
        const w = item.payload as any;
        const typeInfo =
          WORKOUT_ICONS[w.type as WorkoutType] ?? WORKOUT_ICONS.other;
        const parts: string[] = [];
        if (w.distance_km) {
          const distanceKm = Number(w.distance_km) || 0;
          const distance =
            distanceUnit === "km" ? distanceKm : distanceKm * 0.621371;
          const unitLabel = distanceUnit === "km" ? "km" : "mi";
          parts.push(`${distance.toFixed(1)} ${unitLabel}`);
        }
        if (w.duration_minutes) parts.push(`${w.duration_minutes} min`);
        if (w.steps) parts.push(`${Number(w.steps).toLocaleString()} steps`);
        return {
          icon: typeInfo.emoji,
          title: `${item.user?.display_name ?? "Someone"} logged a ${w.type}`,
          subtitle: parts.join(" · ") || "Workout logged",
          accent:
            (theme.colors as any)[`workout_${w.type}`] ?? theme.colors.success,
          routeCoords: (w.route_coords as RouteCoord[] | undefined) ?? null,
        };
      }
      case "achievement":
        return {
          icon: "🏆",
          title: `${item.user?.display_name ?? "Someone"} earned a badge!`,
          subtitle: (item.payload as any).badge_name ?? "Achievement unlocked",
          accent: theme.colors.secondary,
          routeCoords: null,
        };
      case "joined":
        return {
          icon: "👋",
          title: `${item.user?.display_name ?? "Someone"} joined the squad!`,
          subtitle: "Welcome to the crew",
          accent: theme.colors.primary_light,
          routeCoords: null,
        };
      case "goal_set":
        return {
          icon: "🎯",
          title: "New squad goal set",
          subtitle:
            (item.payload as any).goal_title ?? "Let's crush it together!",
          accent: theme.colors.info,
          routeCoords: null,
        };
      default:
        return {
          icon: "⚡",
          title: "Activity",
          subtitle: "",
          accent: theme.colors.on_surface_variant,
          routeCoords: null,
        };
    }
  };

  const { icon, title, subtitle, accent, routeCoords } = getContent();
  const timeAgo = formatDistanceToNow(new Date(item.created_at), {
    addSuffix: true,
  });

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        {/* Left: avatar with activity icon overlay */}
        <View style={styles.avatarWrapper}>
          <Avatar
            uri={item.user?.avatar_url}
            name={item.user?.display_name}
            size={40}
          />
          <View style={[styles.activityDot, { backgroundColor: accent }]}>
            <Text style={{ fontSize: 10 }}>{icon}</Text>
          </View>
        </View>

        {/* Right: text content */}
        <View style={styles.content}>
          <Text style={[textStyles.bodyMd, { color: theme.colors.on_surface }]}>
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[
                textStyles.bodySm,
                { color: theme.colors.on_surface_variant, marginTop: 1 },
              ]}
            >
              {subtitle}
            </Text>
          ) : null}
          <Text
            style={[
              textStyles.labelSm,
              { color: theme.colors.on_surface_muted, marginTop: 3 },
            ]}
          >
            {timeAgo}
          </Text>
        </View>
      </View>

      {/* Route map thumbnail — only for GPS-tracked workouts */}
      {routeCoords && routeCoords.length >= 2 && (
        <View style={styles.mapWrapper}>
          <RouteMapCard
            coords={routeCoords}
            strokeColor={accent}
            height={140}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[3],
  },
  mapWrapper: {
    borderRadius: 14,
    overflow: "hidden",
  },
  avatarWrapper: {
    position: "relative",
  },
  activityDot: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
});
