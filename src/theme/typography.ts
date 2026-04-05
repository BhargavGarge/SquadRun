// ─────────────────────────────────────────────────────────────
// Typography — Tactical Command system
// Lexend  → display / headlines (architectural density)
// Manrope → body, labels, UI text (blueprint precision)
//
// Display/Headline: -0.05em letter-spacing = maximum "Technical Noir" density.
// Labels: UPPERCASE + +0.1em tracking = engineering schematic annotations.
// Body: spacious, variant color for secondary hierarchy.
// Font sizes increased ~2px from previous system for tactical readability.
// ─────────────────────────────────────────────────────────────

export const fontFamily = {
  lexend: {
    light:     'Lexend-Light',
    regular:   'Lexend-Regular',
    medium:    'Lexend-Medium',
    semiBold:  'Lexend-SemiBold',
    bold:      'Lexend-Bold',
    extraBold: 'Lexend-ExtraBold',
  },
  manrope: {
    light:     'Manrope-Light',
    regular:   'Manrope-Regular',
    medium:    'Manrope-Medium',
    semiBold:  'Manrope-SemiBold',
    bold:      'Manrope-Bold',
    extraBold: 'Manrope-ExtraBold',
  },
};

// Type scale — dense headlines, spacious body.
// -0.05em on display/headline = ~1px/20px density push.
export const typeScale = {
  // Display — "Sledgehammer" sizes
  displayLg: { fontSize: 52, lineHeight: 54, letterSpacing: -2.60 }, // -0.05em
  displayMd: { fontSize: 40, lineHeight: 42, letterSpacing: -2.00 }, // -0.05em
  displaySm: { fontSize: 32, lineHeight: 34, letterSpacing: -1.60 }, // -0.05em

  // Headline — tactical forward-lean
  headlineLg: { fontSize: 28, lineHeight: 30, letterSpacing: -1.40 }, // -0.05em
  headlineMd: { fontSize: 24, lineHeight: 26, letterSpacing: -1.20 }, // -0.05em
  headlineSm: { fontSize: 20, lineHeight: 22, letterSpacing: -1.00 }, // -0.05em

  // Title — supporting hierarchy
  titleLg: { fontSize: 18, lineHeight: 26, letterSpacing: -0.36 },
  titleMd: { fontSize: 16, lineHeight: 24, letterSpacing: -0.32 },
  titleSm: { fontSize: 15, lineHeight: 22, letterSpacing: -0.30 },

  // Body — legible, spacious
  bodyLg: { fontSize: 18, lineHeight: 30, letterSpacing: 0.1 },
  bodyMd: { fontSize: 16, lineHeight: 26, letterSpacing: 0.1 },
  bodySm: { fontSize: 14, lineHeight: 22, letterSpacing: 0.2 },

  // Label — "TACTICAL METADATA" — uppercase + +0.1em
  labelLg: { fontSize: 14, lineHeight: 18, letterSpacing: 1.40 }, // +0.1em
  labelMd: { fontSize: 12, lineHeight: 16, letterSpacing: 1.20 }, // +0.1em
  labelSm: { fontSize: 11, lineHeight: 14, letterSpacing: 1.10 }, // +0.1em
};

export const textStyles = {
  displayLg: {
    ...typeScale.displayLg,
    fontFamily: fontFamily.lexend.extraBold,
  },
  displayMd: {
    ...typeScale.displayMd,
    fontFamily: fontFamily.lexend.extraBold,
  },
  displaySm: {
    ...typeScale.displaySm,
    fontFamily: fontFamily.lexend.bold,
  },
  headlineLg: {
    ...typeScale.headlineLg,
    fontFamily: fontFamily.lexend.bold,
  },
  headlineMd: {
    ...typeScale.headlineMd,
    fontFamily: fontFamily.lexend.bold,
  },
  headlineSm: {
    ...typeScale.headlineSm,
    fontFamily: fontFamily.lexend.semiBold,
  },
  titleLg: {
    ...typeScale.titleLg,
    fontFamily: fontFamily.manrope.semiBold,
  },
  titleMd: {
    ...typeScale.titleMd,
    fontFamily: fontFamily.manrope.semiBold,
  },
  titleSm: {
    ...typeScale.titleSm,
    fontFamily: fontFamily.manrope.medium,
  },
  bodyLg: {
    ...typeScale.bodyLg,
    fontFamily: fontFamily.manrope.regular,
  },
  bodyMd: {
    ...typeScale.bodyMd,
    fontFamily: fontFamily.manrope.regular,
  },
  bodySm: {
    ...typeScale.bodySm,
    fontFamily: fontFamily.manrope.regular,
  },
  labelLg: {
    ...typeScale.labelLg,
    fontFamily: fontFamily.manrope.semiBold,
    textTransform: 'uppercase' as const,
  },
  labelMd: {
    ...typeScale.labelMd,
    fontFamily: fontFamily.manrope.semiBold,
    textTransform: 'uppercase' as const,
  },
  labelSm: {
    ...typeScale.labelSm,
    fontFamily: fontFamily.manrope.bold,
    textTransform: 'uppercase' as const,
  },
};
