// ─────────────────────────────────────────────────────────────
// Typography scale
// Lexend  → display headlines (bold, expressive)
// Manrope → body, labels, UI text (clean, readable)
// ─────────────────────────────────────────────────────────────

export const fontFamily = {
  // Lexend family
  lexend: {
    light: 'Lexend-Light',
    regular: 'Lexend-Regular',
    medium: 'Lexend-Medium',
    semiBold: 'Lexend-SemiBold',
    bold: 'Lexend-Bold',
    extraBold: 'Lexend-ExtraBold',
  },
  // Manrope family
  manrope: {
    light: 'Manrope-Light',
    regular: 'Manrope-Regular',
    medium: 'Manrope-Medium',
    semiBold: 'Manrope-SemiBold',
    bold: 'Manrope-Bold',
    extraBold: 'Manrope-ExtraBold',
  },
};

// Type scale — maps semantic names to size/line-height pairs
export const typeScale = {
  // Display (Lexend) — large hero text
  displayLg: { fontSize: 48, lineHeight: 56, letterSpacing: -1.5 },
  displayMd: { fontSize: 36, lineHeight: 44, letterSpacing: -1.0 },
  displaySm: { fontSize: 28, lineHeight: 36, letterSpacing: -0.5 },

  // Headline (Lexend)
  headlineLg: { fontSize: 24, lineHeight: 32, letterSpacing: -0.3 },
  headlineMd: { fontSize: 20, lineHeight: 28, letterSpacing: -0.2 },
  headlineSm: { fontSize: 18, lineHeight: 26, letterSpacing: -0.1 },

  // Title (Manrope semibold)
  titleLg: { fontSize: 16, lineHeight: 24, letterSpacing: 0 },
  titleMd: { fontSize: 14, lineHeight: 22, letterSpacing: 0.1 },
  titleSm: { fontSize: 13, lineHeight: 20, letterSpacing: 0.1 },

  // Body (Manrope regular)
  bodyLg: { fontSize: 16, lineHeight: 26, letterSpacing: 0.1 },
  bodyMd: { fontSize: 14, lineHeight: 22, letterSpacing: 0.1 },
  bodySm: { fontSize: 12, lineHeight: 18, letterSpacing: 0.2 },

  // Label (Manrope, all-caps for section headers)
  labelLg: { fontSize: 13, lineHeight: 18, letterSpacing: 0.8 },
  labelMd: { fontSize: 11, lineHeight: 16, letterSpacing: 1.0 },
  labelSm: { fontSize: 10, lineHeight: 14, letterSpacing: 1.2 },
};

// Convenience text styles with font families baked in
export const textStyles = {
  displayLg: {
    ...typeScale.displayLg,
    fontFamily: fontFamily.lexend.extraBold,
  },
  displayMd: {
    ...typeScale.displayMd,
    fontFamily: fontFamily.lexend.bold,
  },
  displaySm: {
    ...typeScale.displaySm,
    fontFamily: fontFamily.lexend.bold,
  },
  headlineLg: {
    ...typeScale.headlineLg,
    fontFamily: fontFamily.lexend.semiBold,
  },
  headlineMd: {
    ...typeScale.headlineMd,
    fontFamily: fontFamily.lexend.semiBold,
  },
  headlineSm: {
    ...typeScale.headlineSm,
    fontFamily: fontFamily.lexend.medium,
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
