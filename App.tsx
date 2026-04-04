// ─────────────────────────────────────────────────────────────
// Squad Goals — App Entry Point
//
// Initialization order:
//   1. Load custom fonts (Lexend + Manrope)
//   2. Hide native splash screen
//   3. Wrap with ClerkProvider (auth)
//   4. Wrap with ThemeProvider (design system)
//   5. Wrap with AuthProvider (Supabase user sync)
//   6. Render AppNavigator
// ─────────────────────────────────────────────────────────────

import 'react-native-gesture-handler';
import React, { useEffect, useCallback } from 'react';
import { View, StatusBar } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import Constants from 'expo-constants';
import { ClerkProvider } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';

import { ThemeProvider } from './src/contexts/ThemeContext';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

// Keep splash screen up while fonts load
SplashScreen.preventAutoHideAsync();

// Clerk token cache — persists the JWT in expo-secure-store
const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // ignore
    }
  },
};

const clerkPublishableKey =
  Constants.expoConfig?.extra?.clerkPublishableKey ??
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ??
  '';

export default function App() {
  const [fontsLoaded] = useFonts({
    'Lexend-Light': require('./assets/fonts/Lexend-Light.ttf'),
    'Lexend-Regular': require('./assets/fonts/Lexend-Regular.ttf'),
    'Lexend-Medium': require('./assets/fonts/Lexend-Medium.ttf'),
    'Lexend-SemiBold': require('./assets/fonts/Lexend-SemiBold.ttf'),
    'Lexend-Bold': require('./assets/fonts/Lexend-Bold.ttf'),
    'Lexend-ExtraBold': require('./assets/fonts/Lexend-ExtraBold.ttf'),
    'Manrope-Light': require('./assets/fonts/Manrope-Light.ttf'),
    'Manrope-Regular': require('./assets/fonts/Manrope-Regular.ttf'),
    'Manrope-Medium': require('./assets/fonts/Manrope-Medium.ttf'),
    'Manrope-SemiBold': require('./assets/fonts/Manrope-SemiBold.ttf'),
    'Manrope-Bold': require('./assets/fonts/Manrope-Bold.ttf'),
    'Manrope-ExtraBold': require('./assets/fonts/Manrope-ExtraBold.ttf'),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null; // Splash screen is still visible
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <ClerkProvider
        publishableKey={clerkPublishableKey}
        tokenCache={tokenCache}
      >
        <ThemeProvider>
          <AuthProvider>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            <AppNavigator />
          </AuthProvider>
        </ThemeProvider>
      </ClerkProvider>
    </View>
  );
}
