// ─────────────────────────────────────────────────────────────
// Spacing & layout tokens — Tactical Command system
// Base unit: 4px grid
// Radius: ROUND_NONE — 0px everywhere. Every corner cuts.
// Shadows: neon bleed (lime glow), never grey.
// ─────────────────────────────────────────────────────────────

export const spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
};

// Border radius — ROUND_NONE system.
// Every interactive corner is 0px (sharp enough to cut).
// `full` exists only for Chip-type elements (not buttons).
export const radius = {
  none: 0,
  xs:   0,  // buttons, inputs — sharp corners per spec
  sm:   0,  // small interactive elements
  md:   0,  // containers
  lg:   0,  // cards
  xl:   0,  // large cards
  '2xl': 0,
  '3xl': 0,
  full: 9999, // chips ONLY — never for buttons
};

// Shadows — "Neon Bleed" not physical elevation.
// Floating elements use a lime glow at low opacity (CRT monitor effect).
// DON'T use grey shadows — they're muddy against the obsidian.
export const shadows = {
  none: {},
  sm: {
    shadowColor: '#CCFF00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#CCFF00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: '#CCFF00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
  },
  xl: {
    // Floating tooltip/modal — 4px blur at 15% (CRT glow spec)
    shadowColor: '#CCFF00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 12,
  },
  glow: {
    // Locked-on active state glow
    shadowColor: '#CCFF00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 16,
  },
};

// Z-index stack
export const zIndex = {
  base: 0,
  card: 1,
  overlay: 10,
  modal: 20,
  toast: 30,
  tooltip: 40,
};
