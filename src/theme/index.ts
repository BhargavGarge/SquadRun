// ─────────────────────────────────────────────────────────────
// Theme barrel export — import everything from '@theme'
// ─────────────────────────────────────────────────────────────

export * from './colors';
export * from './typography';
export * from './spacing';

import { dark, light } from './colors';
import { fontFamily, textStyles } from './typography';
import { spacing, radius, shadows, zIndex } from './spacing';

export const themes = { dark, light };

export const createTheme = (isDark: boolean) => ({
  colors: isDark ? dark : light,
  fontFamily,
  textStyles,
  spacing,
  radius,
  shadows,
  zIndex,
  isDark,
});

export type AppTheme = ReturnType<typeof createTheme>;
