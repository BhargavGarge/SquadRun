// ─────────────────────────────────────────────────────────────
// ActiveWorkoutScreen — Strava-like live GPS tracking.
// Top: full-screen map with live route polyline.
// Bottom: distance, duration, pace, steps + pause/finish controls.
// On finish → pre-fills LogWorkoutScreen.
// ─────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Polyline, Marker } from "react-native-maps";
import * as Location from "expo-location";
import { Pedometer } from "expo-sensors/build/Pedometer";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useNavigation, useRoute } from "@react-navigation/native";

import { useTheme } from "../../contexts/ThemeContext";
import { useAuthContext } from "../../contexts/AuthContext";
import { textStyles } from "../../theme/typography";
import { spacing, radius } from "../../theme/spacing";
import {
  liveLocationApi,
  subscribeToLiveLocations,
} from "../../services/supabase";
import type { WorkoutType, RouteCoord, LiveLocation } from "../../types";

const { height: SCREEN_H } = Dimensions.get("window");

// ─── Helpers ──────────────────────────────────────────────────

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatPace(distanceKm: number, seconds: number): string {
  if (distanceKm < 0.01 || seconds < 1) return "--'--\"";
  const paceSecPerKm = seconds / distanceKm;
  const m = Math.floor(paceSecPerKm / 60);
  const s = Math.floor(paceSecPerKm % 60);
  return `${m}'${String(s).padStart(2, "0")}"`;
}

// Thin the route for the activity feed payload (max 200 points)
function simplifyCoords(coords: RouteCoord[], maxPts = 200): RouteCoord[] {
  if (coords.length <= maxPts) return coords;
  const step = Math.ceil(coords.length / maxPts);
  return coords.filter((_, i) => i % step === 0 || i === coords.length - 1);
}

// Dark Google Maps style
const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#1a1a1a" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6b6b6b" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a1a" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#2c2c2c" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: "#373737" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#3c3c3c" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8a8a8a" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#000000" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#3d3d3d" }],
  },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];

const WORKOUT_EMOJI: Record<string, string> = {
  run: "🏃",
  cycle: "🚴",
  hike: "🥾",
  swim: "🏊",
  other: "⚡",
};

type TrackingStatus = "idle" | "active" | "paused";

// ─── Screen ───────────────────────────────────────────────────

export default function ActiveWorkoutScreen() {
  const { theme } = useTheme();
  const { dbUser } = useAuthContext();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { type = "run", squadId, goalId } = route.params ?? {};

  const [status, setStatus] = useState<TrackingStatus>("idle");
  const [coords, setCoords] = useState<RouteCoord[]>([]);
  const [distanceKm, setDistanceKm] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [steps, setSteps] = useState(0);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [pedometerAvailable, setPedometerAvailable] = useState(false);
  const [squadLocations, setSquadLocations] = useState<
    Record<string, LiveLocation>
  >({});

  const mapRef = useRef<MapView>(null);
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);
  const pedometerSubRef = useRef<ReturnType<
    typeof Pedometer.watchStepCount
  > | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCoordRef = useRef<RouteCoord | null>(null);
  const distanceRef = useRef(0);
  const stepOffsetRef = useRef(0);
  const stepsRef = useRef(0);
  const lastBroadcastRef = useRef(0);
  const headingRef = useRef<number | null>(null);

  const clearLiveLocation = useCallback(() => {
    if (!dbUser?.id || !squadId) return;
    liveLocationApi.clearForUser(dbUser.id, squadId).catch(() => {
      // Non-critical cleanup failure
    });
  }, [dbUser?.id, squadId]);

  // ── Permission + initial location on mount ──────────────────
  useEffect(() => {
    (async () => {
      const { status: locStatus } =
        await Location.requestForegroundPermissionsAsync();
      if (locStatus !== "granted") {
        setLocationError(
          "Location permission denied — enable it in Settings to track your route.",
        );
        return;
      }
      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setCurrentLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      } catch {
        setLocationError("Could not get your location. Check GPS signal.");
      }
      const available = await Pedometer.isAvailableAsync();
      setPedometerAvailable(available);
    })();
  }, []);

  useEffect(() => {
    return () => {
      stopAll();
      clearLiveLocation();
    };
  }, [stopAll, clearLiveLocation]);

  useEffect(() => {
    if (!squadId || !dbUser?.id) return;

    let isMounted = true;

    (async () => {
      try {
        const rows = await liveLocationApi.getBySquad(squadId);
        if (!isMounted) return;
        const map: Record<string, LiveLocation> = {};
        for (const row of rows) {
          if (row.user_id === dbUser.id) continue;
          map[row.user_id] = row;
        }
        setSquadLocations(map);
      } catch {
        // Initial live locations are non-critical
      }
    })();

    const unsubscribe = subscribeToLiveLocations(
      squadId,
      (loc) => {
        if (loc.user_id === dbUser.id) return;
        setSquadLocations((prev) => ({
          ...prev,
          [loc.user_id]: loc,
        }));
      },
      (id) => {
        setSquadLocations((prev) => {
          const next = { ...prev };
          for (const key of Object.keys(next)) {
            if (next[key].id === id) {
              delete next[key];
              break;
            }
          }
          return next;
        });
      },
    );

    return () => {
      isMounted = false;
      unsubscribe();
      setSquadLocations({});
    };
  }, [squadId, dbUser?.id]);

  // ── Core tracking helpers ────────────────────────────────────

  const stopAll = useCallback(() => {
    locationSubRef.current?.remove();
    pedometerSubRef.current?.remove();
    if (timerRef.current) clearInterval(timerRef.current);
    locationSubRef.current = null;
    pedometerSubRef.current = null;
    timerRef.current = null;
  }, []);

  const startTracking = useCallback(async () => {
    // Timer
    timerRef.current = setInterval(() => {
      setDurationSeconds((prev) => prev + 1);
    }, 1000);

    // GPS
    locationSubRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 5, // metres moved before next update
        timeInterval: 1000,
      },
      (loc) => {
        const newCoord: RouteCoord = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          timestamp: loc.timestamp,
        };
        setCurrentLocation({
          latitude: newCoord.latitude,
          longitude: newCoord.longitude,
        });
        setCoords((prev) => [...prev, newCoord]);

        if (lastCoordRef.current) {
          distanceRef.current += haversineKm(
            lastCoordRef.current.latitude,
            lastCoordRef.current.longitude,
            newCoord.latitude,
            newCoord.longitude,
          );
          setDistanceKm(distanceRef.current);
        }
        lastCoordRef.current = newCoord;

        // Track heading for pace-alert direction inference
        if (loc.coords.heading != null && loc.coords.heading >= 0) {
          headingRef.current = loc.coords.heading;
        }

        if (dbUser?.id && squadId) {
          const now = Date.now();
          if (now - lastBroadcastRef.current > 3000) {
            lastBroadcastRef.current = now;
            liveLocationApi
              .upsertLocation({
                userId: dbUser.id,
                squadId,
                workoutId: null,
                lat: newCoord.latitude,
                lon: newCoord.longitude,
                heading: loc.coords.heading ?? null,
                speedMps: loc.coords.speed ?? null,
              })
              .catch(() => {
                // Ignore transient network errors during live sync
              });
          }
        }

        // Keep map centered
        mapRef.current?.animateToRegion(
          { ...newCoord, latitudeDelta: 0.004, longitudeDelta: 0.004 },
          400,
        );
      },
    );

    // Pedometer
    if (pedometerAvailable) {
      const offset = stepOffsetRef.current;
      pedometerSubRef.current = Pedometer.watchStepCount((result) => {
        const total = offset + result.steps;
        stepsRef.current = total;
        setSteps(total);
      });
    }
  }, [pedometerAvailable, dbUser?.id, squadId]);

  // ── Controls ─────────────────────────────────────────────────

  const handleStart = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStatus("active");
    await startTracking();
  };

  const handlePause = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    stopAll();
    stepOffsetRef.current = stepsRef.current;
    lastCoordRef.current = null; // don't bridge the pause gap
    setStatus("paused");
  };

  const handleResume = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStatus("active");
    await startTracking();
  };

  const handleFinish = () => {
    const dist = distanceRef.current;
    Alert.alert(
      "Finish Workout?",
      `${dist.toFixed(2)} km · ${formatDuration(durationSeconds)}`,
      [
        { text: "Keep going", style: "cancel" },
        {
          text: "Finish",
          style: "destructive",
          onPress: async () => {
            stopAll();
            clearLiveLocation();
            await Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success,
            );
            navigation.replace("LogWorkout", {
              squadId,
              goalId,
              prefill: {
                type,
                distance_km: parseFloat(dist.toFixed(2)),
                duration_minutes: Math.max(1, Math.round(durationSeconds / 60)),
                steps: stepsRef.current,
                route_coords: simplifyCoords(coords),
              },
            });
          },
        },
      ],
    );
  };

  const handleClose = () => {
    if (status !== "idle") {
      Alert.alert("End Workout?", "Your progress will be lost.", [
        { text: "Keep going", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => {
            stopAll();
            clearLiveLocation();
            navigation.goBack();
          },
        },
      ]);
    } else {
      navigation.goBack();
    }
  };

  // ── Derived ──────────────────────────────────────────────────

  const accentColor =
    (theme.colors as any)[`workout_${type}`] ?? theme.colors.primary;
  const mapStyle = theme.isDark ? DARK_MAP_STYLE : [];
  const liveSquadCount = Object.keys(squadLocations).length;

  // Pace alert — nearest squad member + direction relative to heading
  const paceAlert = React.useMemo(() => {
    if (!currentLocation || liveSquadCount === 0 || status !== "active") return null;

    const alerts = Object.values(squadLocations)
      .map((loc) => {
        const distKm = haversineKm(
          currentLocation.latitude,
          currentLocation.longitude,
          loc.lat,
          loc.lon,
        );
        const distM = Math.round(distKm * 1000);
        // Infer direction from heading
        let direction: "ahead" | "behind" | null = null;
        if (headingRef.current != null) {
          const dLon = ((loc.lon - currentLocation.longitude) * Math.PI) / 180;
          const y = Math.sin(dLon) * Math.cos((loc.lat * Math.PI) / 180);
          const x =
            Math.cos((currentLocation.latitude * Math.PI) / 180) *
              Math.sin((loc.lat * Math.PI) / 180) -
            Math.sin((currentLocation.latitude * Math.PI) / 180) *
              Math.cos((loc.lat * Math.PI) / 180) *
              Math.cos(dLon);
          const bearing = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
          const diff = Math.abs(((bearing - headingRef.current + 180) % 360) - 180);
          direction = diff < 90 ? "ahead" : "behind";
        }
        return {
          name: loc.user?.display_name ?? "Squadmate",
          distM,
          direction,
          speedMps: loc.speed_mps,
        };
      })
      .filter((a) => a.distM > 20); // ignore people right next to me

    if (alerts.length === 0) return null;
    // Show the furthest apart member — most actionable alert
    return alerts.sort((a, b) => b.distM - a.distM)[0];
  }, [currentLocation, squadLocations, status, liveSquadCount]);

  // ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* ── Map ──────────────────────────────────────────────── */}
      <View style={styles.mapContainer}>
        {currentLocation ? (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            customMapStyle={mapStyle}
            initialRegion={{
              ...currentLocation,
              latitudeDelta: 0.004,
              longitudeDelta: 0.004,
            }}
            showsUserLocation
            showsMyLocationButton={false}
            showsCompass={false}
            rotateEnabled={false}
            pitchEnabled={false}
          >
            {coords.length >= 2 && (
              <Polyline
                coordinates={coords}
                strokeColor={accentColor}
                strokeWidth={5}
                lineCap="round"
                lineJoin="round"
              />
            )}
            {squadId &&
              Object.values(squadLocations).map((loc) => (
                <Marker
                  key={loc.user_id}
                  coordinate={{
                    latitude: loc.lat,
                    longitude: loc.lon,
                  }}
                  tracksViewChanges={false}
                >
                  <View style={styles.squadMarker}>
                    <View
                      style={[
                        styles.squadMarkerDot,
                        { backgroundColor: accentColor },
                      ]}
                    />
                    <Text style={styles.squadMarkerLabel} numberOfLines={1}>
                      {loc.user?.display_name ?? "Squadmate"}
                    </Text>
                  </View>
                </Marker>
              ))}
          </MapView>
        ) : (
          <View
            style={[
              styles.mapFallback,
              { backgroundColor: theme.colors.surface_container },
            ]}
          >
            <Ionicons
              name="map-outline"
              size={40}
              color={theme.colors.on_surface_variant}
            />
            <Text
              style={[
                textStyles.bodySm,
                {
                  color: theme.colors.on_surface_variant,
                  marginTop: spacing[2],
                  textAlign: "center",
                  paddingHorizontal: spacing[6],
                },
              ]}
            >
              {locationError ?? "Getting your location…"}
            </Text>
          </View>
        )}

        {/* Map top bar */}
        <SafeAreaView style={styles.mapOverlay} edges={["top"]}>
          <TouchableOpacity onPress={handleClose} style={styles.mapBtn}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>

          <View
            style={[styles.typePill, { backgroundColor: "rgba(0,0,0,0.55)" }]}
          >
            <Text style={{ fontSize: 20 }}>{WORKOUT_EMOJI[type] ?? "⚡"}</Text>
            <Text
              style={[
                textStyles.titleMd,
                {
                  color: "#fff",
                  marginLeft: spacing[2],
                  textTransform: "capitalize",
                },
              ]}
            >
              {type}
            </Text>
          </View>

          {/* Live pulse when active */}
          {status === "active" && (
            <View style={[styles.liveDot, { backgroundColor: accentColor }]}>
              <View style={styles.liveDotInner} />
            </View>
          )}
        </SafeAreaView>
      </View>

      {/* ── Stats + controls panel ────────────────────────────── */}
      <View
        style={[styles.panel, { backgroundColor: theme.colors.background }]}
      >
        {/* Live squad run pill */}
        {squadId && dbUser?.id && (
          <View style={styles.livePillRow}>
            <View
              style={[
                styles.livePill,
                { backgroundColor: theme.colors.surface_container_high },
              ]}
            >
              <View
                style={[styles.livePillDot, { backgroundColor: accentColor }]}
              />
              <Text
                style={[textStyles.labelSm, { color: theme.colors.on_surface }]}
              >
                LIVE SQUAD RUN
              </Text>
              {liveSquadCount > 0 && (
                <Text
                  style={[
                    textStyles.labelSm,
                    {
                      color: theme.colors.on_surface_variant,
                      marginLeft: spacing[1],
                    },
                  ]}
                >
                  · {liveSquadCount} online
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Pace alert — shown when squadmate is >20m away during active run */}
        {paceAlert && (
          <PaceAlertBanner
            name={paceAlert.name}
            distM={paceAlert.distM}
            direction={paceAlert.direction}
            accentColor={accentColor}
            theme={theme}
          />
        )}

        {/* Primary stats */}
        <View style={styles.primaryRow}>
          <StatBlock
            value={distanceRef.current.toFixed(2)}
            unit="km"
            label="Distance"
            theme={theme}
            accent={accentColor}
            large
          />
          <View
            style={[styles.divider, { backgroundColor: theme.colors.outline }]}
          />
          <StatBlock
            value={formatDuration(durationSeconds)}
            unit=""
            label="Duration"
            theme={theme}
            large
          />
        </View>

        {/* Secondary stats */}
        <View style={styles.secondaryRow}>
          <StatBlock
            value={formatPace(distanceRef.current, durationSeconds)}
            unit=""
            label="Pace /km"
            theme={theme}
          />
          <StatBlock
            value={steps.toLocaleString()}
            unit=""
            label="Steps"
            theme={theme}
          />
          <StatBlock
            value={Math.round(steps * 0.04).toString()}
            unit="kcal"
            label="~Calories"
            theme={theme}
          />
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {status === "idle" && (
            <TouchableOpacity
              style={[
                styles.startBtn,
                {
                  backgroundColor: accentColor,
                  opacity: locationError ? 0.4 : 1,
                },
              ]}
              onPress={handleStart}
              disabled={!!locationError || !currentLocation}
            >
              <Ionicons name="play" size={30} color="black" />
              <Text
                style={[
                  textStyles.titleLg,
                  { color: "black", marginLeft: spacing[2] },
                ]}
              >
                Start {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          )}

          {status === "active" && (
            <View style={styles.dualControls}>
              <TouchableOpacity
                style={[
                  styles.roundBtn,
                  { backgroundColor: theme.colors.surface_container_high },
                ]}
                onPress={handlePause}
              >
                <Ionicons
                  name="pause"
                  size={28}
                  color={theme.colors.on_surface}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.finishBtn, { backgroundColor: accentColor }]}
                onPress={handleFinish}
              >
                <Ionicons name="stop" size={22} color="#fff" />
                <Text
                  style={[
                    textStyles.titleLg,
                    { color: "#fff", marginLeft: spacing[2] },
                  ]}
                >
                  Finish
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {status === "paused" && (
            <View style={styles.dualControls}>
              <TouchableOpacity
                style={[styles.roundBtn, { backgroundColor: accentColor }]}
                onPress={handleResume}
              >
                <Ionicons name="play" size={28} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.finishBtn,
                  {
                    borderColor: theme.colors.error,
                    borderWidth: 2,
                    backgroundColor: "transparent",
                  },
                ]}
                onPress={handleFinish}
              >
                <Ionicons name="stop" size={22} color={theme.colors.error} />
                <Text
                  style={[
                    textStyles.titleLg,
                    { color: theme.colors.error, marginLeft: spacing[2] },
                  ]}
                >
                  End Run
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// ─── StatBlock ────────────────────────────────────────────────

function StatBlock({
  value,
  unit,
  label,
  theme,
  accent,
  large,
}: {
  value: string;
  unit: string;
  label: string;
  theme: any;
  accent?: string;
  large?: boolean;
}) {
  return (
    <View style={statStyles.block}>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 3 }}>
        <Text
          style={[
            large ? textStyles.displaySm : textStyles.headlineLg,
            { color: accent ?? theme.colors.on_surface },
          ]}
        >
          {value}
        </Text>
        {unit ? (
          <Text
            style={[
              textStyles.bodyMd,
              { color: theme.colors.on_surface_variant },
            ]}
          >
            {unit}
          </Text>
        ) : null}
      </View>
      <Text
        style={[
          textStyles.labelSm,
          { color: theme.colors.on_surface_variant, marginTop: 2 },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },

  // Map
  mapContainer: { height: SCREEN_H * 0.55 },
  mapFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  mapOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[3],
    gap: spacing[3],
  },
  mapBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  typePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: radius.full,
  },
  liveDot: {
    marginLeft: "auto" as any,
    width: 12,
    height: 12,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  liveDotInner: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#fff",
    opacity: 0.8,
  },

  squadMarker: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.75)",
  },
  squadMarkerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  squadMarkerLabel: {
    ...textStyles.labelSm,
    color: "#fff",
    maxWidth: 80,
  },

  // Stats panel
  panel: {
    flex: 1,
    paddingTop: spacing[5],
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[4],
  },
  livePillRow: {
    alignItems: "center",
    marginBottom: spacing[4],
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
  },
  livePillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing[2],
  },
  primaryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing[5],
  },
  divider: {
    width: 1,
    height: 50,
    marginHorizontal: spacing[5],
  },
  secondaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing[6],
  },

  // Controls
  controls: { alignItems: "center" },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[10],
    paddingVertical: spacing[4],
    borderRadius: radius.full,
    gap: spacing[2],
  },
  dualControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[4],
  },
  roundBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  finishBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[4],
    borderRadius: radius.full,
    gap: spacing[2],
  },
});

const statStyles = StyleSheet.create({
  block: { alignItems: "flex-start" },
});

// ─── PaceAlertBanner ─────────────────────────────────────────

function formatDistM(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`;
}

function PaceAlertBanner({
  name,
  distM,
  direction,
  accentColor,
  theme,
}: {
  name: string;
  distM: number;
  direction: "ahead" | "behind" | null;
  accentColor: string;
  theme: any;
}) {
  const dirLabel =
    direction === "ahead" ? " ahead" : direction === "behind" ? " behind" : "";
  const icon: any =
    direction === "ahead"
      ? "arrow-up-circle-outline"
      : direction === "behind"
        ? "arrow-down-circle-outline"
        : "navigate-circle-outline";
  const msg = `${name} is ${formatDistM(distM)}${dirLabel}`;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(204,255,0,0.08)",
        borderLeftWidth: 2,
        borderLeftColor: accentColor,
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[2],
        marginBottom: spacing[3],
        gap: spacing[2],
      }}
    >
      <Ionicons name={icon} size={16} color={accentColor} />
      <Text
        style={[textStyles.labelSm, { color: theme.colors.on_surface, flex: 1 }]}
        numberOfLines={1}
      >
        {msg}
      </Text>
    </View>
  );
}
