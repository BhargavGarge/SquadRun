// ─────────────────────────────────────────────────────────────
// MapView wrapper — centralized map configuration & styling
// Handles Google Maps (Android) + Apple Maps (iOS)
// ─────────────────────────────────────────────────────────────

import React from 'react';
import MapViewRN, { MapViewProps } from 'react-native-maps';
import { useTheme } from '../../contexts/ThemeContext';

interface CustomMapViewProps extends MapViewProps {
  style?: any;
  children?: React.ReactNode;
}

export default function MapView({ style, children, ...props }: CustomMapViewProps) {
  const { theme } = useTheme();

  return (
    <MapViewRN
      style={[{ flex: 1 }, style]}
      showsUserLocation
      showsMyLocationButton
      loadingIndicatorColor={theme.colors.primary}
      {...props}
    >
      {children}
    </MapViewRN>
  );
}
