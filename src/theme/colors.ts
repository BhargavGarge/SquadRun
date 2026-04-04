// ─────────────────────────────────────────────────────────────
// Squad Goals — Design System Colors
// Strava-inspired: deep blacks, bold orange (#FC4C02), clean neutrals
// ─────────────────────────────────────────────────────────────

export const palette = {
  // ── Strava Orange (primary brand) ──
  orange50: "#FFF3EE",
  orange100: "#FFE4D6",
  orange200: "#FFC4A8",
  orange300: "#FF9D73",
  orange400: "#FF6B35",
  orange500: "#FC4C02", // Strava orange
  orange600: "#E04000",
  orange700: "#B83300",
  orange800: "#8F2600",
  orange900: "#641A00",

  // ── Emerald (success / running pace) ──
  emerald400: "#34D399",
  emerald500: "#10B981",
  emerald600: "#059669",

  // ── Red (alert / PR) ──
  red400: "#F87171",
  red500: "#EF4444",

  // ── Blue (cycling / swim) ──
  blue400: "#60A5FA",
  blue500: "#3B82F6",

  // ── Yellow (hike / strength) ──
  yellow400: "#FACC15",
  yellow500: "#EAB308",

  // ── Pure neutrals ──
  white: "#FFFFFF",
  neutral100: "#F5F5F5",
  neutral200: "#E5E5E5",
  neutral400: "#A3A3A3",
  neutral500: "#737373",
  neutral600: "#525252",
  neutral700: "#404040",
  neutral800: "#262626",
  neutral900: "#171717",

  // ── Deep darks (app backgrounds) ──
  dark000: "#000000",
  dark100: "#0A0A0A",
  dark150: "#111111",
  dark200: "#161616",
  dark300: "#1C1C1C",
  dark400: "#222222",
  dark500: "#2A2A2A",
  dark600: "#333333",
  dark700: "#3D3D3D",
};

// ─── Dark Theme (default) ────────────────────────────────────
export const dark = {
  // Backgrounds
  background: palette.dark100,

  // Surface hierarchy
  surface: palette.dark150,
  surface_container_lowest: palette.dark000,
  surface_container_low: palette.dark200,
  surface_container: palette.dark300,
  surface_container_high: palette.dark400,
  surface_container_highest: palette.dark500,

  // Primary — Strava orange
  primary: palette.orange500,
  primary_light: palette.orange400,
  primary_container: palette.orange900,
  on_primary: palette.white,
  on_primary_container: palette.orange200,

  // Secondary — muted for supporting elements
  secondary: palette.neutral400,
  secondary_light: palette.neutral200,
  secondary_container: palette.dark500,
  on_secondary: palette.white,

  // Semantic
  success: palette.emerald500,
  success_container: "#052E16",
  warning: palette.yellow400,
  error: palette.red500,
  error_container: "#450A0A",
  info: palette.blue400,

  // Text
  on_surface: "#FFFFFF",
  on_surface_variant: "#9A9A9A",
  on_surface_muted: "#555555",

  // Outline / borders
  outline: palette.dark600,
  outline_variant: palette.dark500,

  // Glass (kept minimal — used for blur overlays only)
  glass: "rgba(255, 255, 255, 0.04)",
  glass_medium: "rgba(255, 255, 255, 0.07)",
  glass_strong: "rgba(255, 255, 255, 0.12)",
  glass_border: "rgba(255, 255, 255, 0.06)",
  glass_border_strong: "rgba(255, 255, 255, 0.12)",

  // Workout type accent colors
  workout_run: palette.orange500,
  workout_cycle: palette.blue400,
  workout_swim: "#22D3EE",
  workout_strength: "#A78BFA",
  workout_yoga: "#F9A8D4",
  workout_hike: palette.yellow400,
  workout_other: palette.neutral400,

  // Gradient stops
  gradient_primary_start: palette.orange500,
  gradient_primary_end: palette.orange700,
  gradient_card_start: "rgba(0, 0, 0, 0.18)",
  gradient_card_end: "rgba(252, 76, 2, 0.04)",
  gradient_progress_start: palette.orange400,
  gradient_progress_end: palette.yellow400,
  gradient_success_start: palette.emerald400,
  gradient_success_end: "#22D3EE",
};

// ─── Light Theme ─────────────────────────────────────────────
export const light = {
  background: palette.neutral100,
  surface: palette.white,
  surface_container_lowest: palette.white,
  surface_container_low: "#F5F5F5",
  surface_container: "#EEEEEE",
  surface_container_high: "#E5E5E5",
  surface_container_highest: "#DDDDDD",

  primary: palette.orange500,
  primary_light: palette.orange600,
  primary_container: palette.orange100,
  on_primary: palette.white,
  on_primary_container: palette.orange900,

  secondary: palette.neutral600,
  secondary_light: palette.neutral500,
  secondary_container: palette.neutral200,
  on_secondary: palette.white,

  success: palette.emerald600,
  success_container: "#D1FAE5",
  warning: palette.yellow500,
  error: palette.red500,
  error_container: "#FEE2E2",
  info: palette.blue500,

  on_surface: "#111111",
  on_surface_variant: "#525252",
  on_surface_muted: "#A3A3A3",

  outline: "#D4D4D4",
  outline_variant: "#E5E5E5",

  glass: "rgba(0,0,0,0.03)",
  glass_medium: "rgba(0,0,0,0.06)",
  glass_strong: "rgba(0,0,0,0.10)",
  glass_border: "rgba(0,0,0,0.06)",
  glass_border_strong: "rgba(0,0,0,0.12)",

  workout_run: palette.orange500,
  workout_cycle: palette.blue500,
  workout_swim: "#06B6D4",
  workout_strength: "#7C3AED",
  workout_yoga: "#EC4899",
  workout_hike: palette.yellow500,
  workout_other: palette.neutral600,

  gradient_primary_start: palette.orange500,
  gradient_primary_end: palette.orange700,
  gradient_card_start: "rgba(252, 76, 2, 0.10)",
  gradient_card_end: "rgba(252, 76, 2, 0.02)",
  gradient_progress_start: palette.orange500,
  gradient_progress_end: palette.yellow400,
  gradient_success_start: palette.emerald500,
  gradient_success_end: "#06B6D4",
};

export type ColorTheme = typeof dark;
