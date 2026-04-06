// ─────────────────────────────────────────────────────────────
// WorkoutMapViewer — Display workout route on map
// Used in WorkoutDetailScreen and route playback
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import MapViewRN from 'react-native-maps';
import { useTheme } from '../../contexts/ThemeContext';
import MapView from './MapView';
import RoutePolyline from './RoutePolyline';
import { DEFAULT_REGION, getMapStyle } from '../../utils/mapConfig';
import type { RouteCoord } from '../../types';

interface WorkoutMapViewerProps {
  route: RouteCoord[] | null;
  title?: string;
  isLoading?: boolean;
  height?: number;
}

export default function WorkoutMapViewer({
  route,
  title,
  isLoading = false,
  height = 400,
}: WorkoutMapViewerProps) {
  const { theme } = useTheme();
  const mapRef = useRef<MapViewRN>(null);

  // Fit map to route bounds
  useEffect(() => {
    if (route && route.length > 0 && mapRef.current) {
      // Calculate bounding box
      const lats = route.map(c => c.latitude);
      const lons = route.map(c => c.longitude);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLon = Math.min(...lons);
      const maxLon = Math.max(...lons);

      const latDelta = maxLat - minLat;
      const lonDelta = maxLon - minLon;

      mapRef.current.animateToRegion(
        {
          latitude: (minLat + maxLat) / 2,
          longitude: (minLon + maxLon) / 2,
          latitudeDelta: latDelta * 1.2,
          longitudeDelta: lonDelta * 1.2,
        },
        500
      );
    }
  }, [route]);

  return (
    <View style={[styles.container, { height }]}>
      {/* Header */}
      {title && (
        <View
          style={[
            styles.header,
            { backgroundColor: theme.colors.surface_container },
          ]}
        >
          <Text
            style={[
              styles.title,
              { color: theme.colors.on_surface },
            ]}
          >
            {title}
          </Text>
        </View>
      )}

      {/* Map */}
      {isLoading ? (
        <View style={[styles.loadingContainer, { flex: 1 }]}>
          <ActivityIndicator
            size="large"
            color={theme.colors.primary}
          />
        </View>
      ) : route && route.length > 0 ? (
        <MapView
          ref={mapRef}
          initialRegion={DEFAULT_REGION}
          customMapStyle={getMapStyle(theme.isDark)}
          zoomControlEnabled
          showsCompass
        >
          <RoutePolyline
            route={route}
            color={theme.colors.primary}
            strokeWidth={3}
            showMarkers
          />
        </MapView>
      ) : (
        <View style={[styles.emptyContainer, { flex: 1 }]}>
          <Text
            style={[
              styles.emptyText,
              { color: theme.colors.on_surface_variant },
            ]}
          >
            No route data available
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Lexend-SemiBold',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
});
