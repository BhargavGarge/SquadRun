// ─────────────────────────────────────────────────────────────
// Squad Goals — Design System: Tactical Command / Technical Noir
// Primary: Electric Lime (#CCFF00) — a laser, not a paint bucket.
// Foundation: pitch-black void (#000000 / #0e0e0e).
// Rule: tonal stacking defines depth, not borders or shadows.
// Ghost border: outline_variant (#484848) for containment only.
// ─────────────────────────────────────────────────────────────

export const palette = {
  // ── Electric Lime ──
  lime100: '#f4ffcc',   // light tint — on-dark readable accents
  lime200: '#e6ff99',
  lime300: '#d9ff55',
  lime400: '#CCFF00',   // PRIMARY — the laser. Use sparingly, high impact.
  lime500: '#a8d400',   // dim state
  lime600: '#86aa00',
  lime700: '#648000',
  lime800: '#425600',
  lime900: '#1a3000',   // on-primary (text on lime surfaces)

  // ── Soft Lime (Tertiary — trend indicators) ──
  softLime: '#b0ff96',

  // ── Emerald (success) ──
  emerald400: '#34D399',
  emerald500: '#10B981',
  emerald600: '#059669',

  // ── Error — warm red per spec ──
  red400: '#ff9175',
  red500: '#ff7351',    // warm tactical red

  // ── Blue (cycling) ──
  blue400: '#60A5FA',
  blue500: '#3B82F6',

  // ── Amber (hike) ──
  amber400: '#FACC15',
  amber500: '#EAB308',

  // ── Neutrals ──
  white:       '#FFFFFF',
  neutral200:  '#e5e2e1',
  neutral400:  '#adaaaa',
  neutral500:  '#737373',
  neutral600:  '#525252',

  // ── Tactical surface tiers (obsidian chassis) ──
  // Level 0: The void.
  void:         '#000000',
  // Level 0.5: Background
  background:   '#0e0e0e',
  // Level 1: Primary work area
  surface:      '#131313',
  // Level 1.5: Blocks
  block:        '#191919',
  // Level 2: Actionable / interactive zones
  module:       '#1f1f1f',
  // Level 2.5: Highest surfaces
  elevated:     '#262626',
  // Level 3: Top-level interactive
  top:          '#313131',

  // ── Ghost border ──
  ghost:        '#484848',  // outline_variant — the only permitted structural border
  ghostFaint:   '#282828',  // outline — barely there
};

// ─── Dark Theme (default — Tactical Command) ─────────────────
export const dark = {
  // Backgrounds
  background: palette.background,

  // Surface hierarchy — tonal stacking creates depth, not shadows/borders
  surface:                    palette.surface,    // #131313
  surface_container_lowest:   palette.void,       // #000000
  surface_container_low:      palette.surface,    // #131313
  surface_container:          palette.block,      // #191919
  surface_container_high:     palette.module,     // #1f1f1f
  surface_container_highest:  palette.elevated,   // #262626

  // Primary — Electric Lime
  primary:              palette.lime400,  // #CCFF00 — THE laser
  primary_light:        palette.softLime, // #b0ff96 — tertiary/trend indicator
  primary_dim:          palette.lime500,  // #a8d400 — hover/pressed state
  primary_container:    palette.lime400,  // #CCFF00 — CTA fills
  on_primary:           palette.lime900,  // #1a3000 — text on lime surfaces
  on_primary_container: palette.lime900,

  // Tertiary — soft lime for trend indicators, secondary accents
  tertiary:             palette.softLime,
  on_tertiary:          palette.lime900,

  // Secondary — refined neutrals
  secondary:           palette.neutral200,
  secondary_light:     palette.white,
  secondary_container: palette.elevated,
  on_secondary:        palette.background,

  // Semantic
  success:           palette.emerald500,
  success_container: '#052E16',
  warning:           palette.amber400,
  error:             palette.red500,      // warm red #ff7351
  error_container:   '#3d0a00',
  info:              palette.blue400,

  // Text hierarchy
  on_surface:         '#ffffff',
  on_surface_variant: palette.neutral400,   // #adaaaa
  on_surface_muted:   '#555555',

  // Outline — ghost borders ONLY. Never for generic sectioning.
  outline:         palette.ghostFaint,  // #282828 — barely perceptible
  outline_variant: palette.ghost,       // #484848 — ghost border, felt not painted

  // Glass — for navigation bars and overlays (20px blur per spec)
  glass:              'rgba(19, 19, 19, 0.80)',
  glass_medium:       'rgba(25, 25, 25, 0.88)',
  glass_strong:       'rgba(31, 31, 31, 0.94)',
  glass_border:       'rgba(204, 255, 0, 0.08)',    // lime ghost at 8%
  glass_border_strong:'rgba(204, 255, 0, 0.20)',    // lime ghost active/locked-on

  // Workout type accents
  workout_run:      palette.lime400,       // Electric Lime — primary action
  workout_cycle:    palette.blue400,
  workout_swim:     '#22D3EE',
  workout_strength: '#A78BFA',
  workout_yoga:     '#F9A8D4',
  workout_hike:     palette.amber400,
  workout_other:    palette.neutral400,

  // Gradients — Electric Lime hero gradient (135°)
  gradient_primary_start: palette.lime400,  // #CCFF00
  gradient_primary_end:   palette.lime500,  // #a8d400 — prevents flat vector look
  gradient_card_start:    'rgba(0, 0, 0, 0.20)',
  gradient_card_end:      'rgba(204, 255, 0, 0.04)',
  gradient_progress_start: palette.lime400,
  gradient_progress_end:   palette.lime300,
  gradient_success_start:  palette.emerald400,
  gradient_success_end:    '#22D3EE',
};

// ─── Light Theme ─────────────────────────────────────────────
export const light = {
  background: '#f5f5f5',
  surface:                    '#ffffff',
  surface_container_lowest:   '#ffffff',
  surface_container_low:      '#F5F5F5',
  surface_container:          '#EEEEEE',
  surface_container_high:     '#E5E5E5',
  surface_container_highest:  '#DDDDDD',

  primary:              palette.lime700,
  primary_light:        palette.lime600,
  primary_dim:          palette.lime800,
  primary_container:    palette.lime400,
  on_primary:           palette.white,
  on_primary_container: palette.lime900,

  tertiary:    palette.softLime,
  on_tertiary: palette.lime900,

  secondary:           palette.neutral600,
  secondary_light:     palette.neutral500,
  secondary_container: palette.neutral200,
  on_secondary:        palette.white,

  success:           palette.emerald600,
  success_container: '#D1FAE5',
  warning:           palette.amber500,
  error:             '#e55530',
  error_container:   '#FEE2E2',
  info:              palette.blue500,

  on_surface:         '#111111',
  on_surface_variant: '#525252',
  on_surface_muted:   '#A3A3A3',

  outline:         '#D4D4D4',
  outline_variant: '#BEBEBE',

  glass:              'rgba(0,0,0,0.03)',
  glass_medium:       'rgba(0,0,0,0.06)',
  glass_strong:       'rgba(0,0,0,0.10)',
  glass_border:       'rgba(0,0,0,0.08)',
  glass_border_strong:'rgba(0,0,0,0.15)',

  workout_run:      palette.lime600,
  workout_cycle:    palette.blue500,
  workout_swim:     '#06B6D4',
  workout_strength: '#7C3AED',
  workout_yoga:     '#EC4899',
  workout_hike:     palette.amber500,
  workout_other:    palette.neutral600,

  gradient_primary_start: palette.lime400,
  gradient_primary_end:   palette.lime600,
  gradient_card_start:    'rgba(204, 255, 0, 0.10)',
  gradient_card_end:      'rgba(204, 255, 0, 0.02)',
  gradient_progress_start: palette.lime400,
  gradient_progress_end:   palette.lime200,
  gradient_success_start:  palette.emerald500,
  gradient_success_end:    '#06B6D4',
};

export type ColorTheme = typeof dark;
