// ─────────────────────────────────────────────────────────────
// RouteMapCard — small non-interactive map thumbnail showing a
// GPS route polyline. Used in ActivityFeedItem and workout detail.
// ─────────────────────────────────────────────────────────────

import React, { useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

import { radius } from '../../theme/spacing';
import type { RouteCoord } from '../../types';

interface RouteMapCardProps {
  coords: RouteCoord[];
  strokeColor?: string;
  height?: number;
  borderRadius?: number;
}

// Compute a bounding region with padding so the full route is visible
function boundsFromCoords(coords: RouteCoord[], paddingFactor = 0.35) {
  let minLat = coords[0].latitude;
  let maxLat = coords[0].latitude;
  let minLon = coords[0].longitude;
  let maxLon = coords[0].longitude;

  for (const c of coords) {
    if (c.latitude < minLat) minLat = c.latitude;
    if (c.latitude > maxLat) maxLat = c.latitude;
    if (c.longitude < minLon) minLon = c.longitude;
    if (c.longitude > maxLon) maxLon = c.longitude;
  }

  const latDelta = Math.max((maxLat - minLat) * (1 + paddingFactor), 0.002);
  const lonDelta = Math.max((maxLon - minLon) * (1 + paddingFactor), 0.002);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLon + maxLon) / 2,
    latitudeDelta: latDelta,
    longitudeDelta: lonDelta,
  };
}

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
  { elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c2c2c' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#373737' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

export default function RouteMapCard({
  coords,
  strokeColor = '#FC4C02',
  height = 160,
  borderRadius = radius.lg,
}: RouteMapCardProps) {
  if (coords.length < 2) return null;

  const region = useMemo(() => boundsFromCoords(coords), [coords]);

  return (
    <View style={[styles.container, { height, borderRadius, overflow: 'hidden' }]}>
      <MapView
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        customMapStyle={DARK_MAP_STYLE}
        initialRegion={region}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        moveOnMarkerPress={false}
        pointerEvents="none"
      >
        <Polyline
          coordinates={coords}
          strokeColor={strokeColor}
          strokeWidth={3}
          lineCap="round"
          lineJoin="round"
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#1a1a1a',
  },
});
