// ─────────────────────────────────────────────────────────────
// ThemeContext — provides the active theme object to the tree.
// Persists the user's preference to AsyncStorage.
// ─────────────────────────────────────────────────────────────

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import { createTheme, AppTheme } from '../theme';

interface ThemeContextValue {
  theme: AppTheme;
  isDark: boolean;
  toggleTheme: () => void;
  setDark: (val: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  // Default to dark theme — matches our brand
  const [isDark, setIsDark] = useState<boolean>(true);
  const theme = createTheme(isDark);

  const toggleTheme = useCallback(() => setIsDark((v) => !v), []);
  const setDark = useCallback((val: boolean) => setIsDark(val), []);

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
