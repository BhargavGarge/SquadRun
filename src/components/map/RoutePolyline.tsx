// ─────────────────────────────────────────────────────────────
// RoutePolyline — Display route as polyline on map
// ─────────────────────────────────────────────────────────────

import React from 'react';
import { Polyline, Marker } from 'react-native-maps';
import type { RouteCoord } from '../../types';

interface RoutePolylineProps {
  route: RouteCoord[];
  color?: string;
  strokeWidth?: number;
  showMarkers?: boolean;
  startMarkerColor?: string;
  endMarkerColor?: string;
}

export default function RoutePolyline({
  route,
  color = '#FF6B35',
  strokeWidth = 3,
  showMarkers = true,
  startMarkerColor = '#22C55E',
  endMarkerColor = '#EF4444',
}: RoutePolylineProps) {
  if (!route || route.length === 0) {
    return null;
  }

  const startPoint = route[0];
  const endPoint = route[route.length - 1];

  // Convert coords to polyline format
  const coordinates = route.map(coord => ({
    latitude: coord.latitude,
    longitude: coord.longitude,
  }));

  return (
    <>
      {/* Route polyline */}
      <Polyline
        coordinates={coordinates}
        strokeColor={color}
        strokeWidth={strokeWidth}
        lineDashPattern={[1]}
        geodesic
      />

      {/* Start marker (green) */}
      {showMarkers && startPoint && (
        <Marker
          coordinate={{
            latitude: startPoint.latitude,
            longitude: startPoint.longitude,
          }}
          title="Start"
          pinColor={startMarkerColor}
        />
      )}

      {/* End marker (red) */}
      {showMarkers && endPoint && (
        <Marker
          coordinate={{
            latitude: endPoint.latitude,
            longitude: endPoint.longitude,
          }}
          title="End"
          pinColor={endMarkerColor}
        />
      )}
    </>
  );
}
