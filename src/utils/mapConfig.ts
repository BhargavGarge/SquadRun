// ─────────────────────────────────────────────────────────────
// Maps configuration — iOS only, Apple Maps
// ─────────────────────────────────────────────────────────────

import Constants from 'expo-constants';

// ─── Apple Maps API Key (optional, basic maps work without it) ────

export const APPLE_MAPS_API_KEY =
  Constants.expoConfig?.extra?.appleMapsApiKey ??
  process.env.EXPO_PUBLIC_APPLE_MAPS_API_KEY ??
  '';

// ─── Default Region (San Francisco) ────────────────────────────

export const DEFAULT_REGION = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

// ─── Map Styling (Light/Dark) ─────────────────────────────────

// Apple Maps uses native styling; custom JSON styles not supported
// These are unused but kept for reference if switching providers

export const LIGHT_MAP_STYLE = [];

export const DARK_MAP_STYLE = [];

// ─── Utilities ────────────────────────────────────────────────

export function getMapStyle(isDark: boolean) {
  return isDark ? DARK_MAP_STYLE : LIGHT_MAP_STYLE;
}

