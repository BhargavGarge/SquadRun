// ─────────────────────────────────────────────────────────────
// AppNavigator — root navigator.
// Decides between Auth and Main flows based on Clerk auth state.
// ─────────────────────────────────────────────────────────────

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';

import { useAuthContext } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';
import OnboardingScreen from '../screens/auth/OnboardingScreen';

// Modal / overlay screens that can be pushed from anywhere
import SquadDetailScreen from '../screens/squad/SquadDetailScreen';
import CreateSquadScreen from '../screens/squad/CreateSquadScreen';
import JoinSquadScreen from '../screens/squad/JoinSquadScreen';
import CreateGoalScreen from '../screens/goals/CreateGoalScreen';
import LogWorkoutScreen from '../screens/workout/LogWorkoutScreen';
import ActiveWorkoutScreen from '../screens/workout/ActiveWorkoutScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

const Root = createNativeStackNavigator();

export default function AppNavigator() {
  const { isLoaded, isSignedIn, onboardingComplete } = useAuthContext();
  const { theme } = useTheme();

  // Show a splash/loading screen while Clerk hydrates
  if (!isLoaded) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer
      theme={{
        dark: theme.isDark,
        colors: {
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.on_surface,
          border: theme.colors.outline,
          notification: theme.colors.error,
        },
      }}
    >
      <Root.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        {!isSignedIn ? (
          // Not authenticated → Auth flow
          <Root.Screen
            name="Auth"
            component={AuthNavigator}
            options={{ animationTypeForReplace: 'pop' }}
          />
        ) : !onboardingComplete ? (
          // Authenticated but first-time user → Onboarding
          <Root.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={{ gestureEnabled: false, animation: 'fade' }}
          />
        ) : (
          // Authenticated + onboarded → Main app
          <>
            <Root.Screen name="Main" component={TabNavigator} />

            {/* Modal screens accessible from anywhere */}
            <Root.Screen
              name="SquadDetail"
              component={SquadDetailScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
            <Root.Screen
              name="CreateSquad"
              component={CreateSquadScreen}
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <Root.Screen
              name="JoinSquad"
              component={JoinSquadScreen}
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <Root.Screen
              name="CreateGoal"
              component={CreateGoalScreen}
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <Root.Screen
              name="LogWorkout"
              component={LogWorkoutScreen}
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <Root.Screen
              name="ActiveWorkout"
              component={ActiveWorkoutScreen}
              options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
            />
            <Root.Screen
              name="Settings"
              component={SettingsScreen}
              options={{ animation: 'slide_from_right' }}
            />
          </>
        )}
      </Root.Navigator>
    </NavigationContainer>
  );
}
