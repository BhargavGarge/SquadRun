// ─────────────────────────────────────────────────────────────
// Main bottom tab navigator with custom tab bar
// ─────────────────────────────────────────────────────────────

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../contexts/ThemeContext";
import type { MainTabParamList } from "./types";

// Stack navigators per tab
import HomeScreen from "../screens/home/HomeScreen";
import SquadListScreen from "../screens/squad/SquadListScreen";
import LogWorkoutScreen from "../screens/workout/LogWorkoutScreen";
import NotificationsScreen from "../screens/notifications/NotificationsScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";

const Tab = createBottomTabNavigator<MainTabParamList>();

// ─── Custom Tab Bar ──────────────────────────────────────────

function CustomTabBar({ state, descriptors, navigation }: any) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const tabs = [
    { name: "Home", icon: "home", iconOutline: "home-outline" },
    { name: "Squads", icon: "people", iconOutline: "people-outline" },
    { name: "Log", icon: "add-circle", iconOutline: "add-circle-outline" },
    {
      name: "Notifications",
      icon: "notifications",
      iconOutline: "notifications-outline",
    },
    { name: "Profile", icon: "person", iconOutline: "person-outline" },
  ];

  return (
    <View
      style={[
        styles.tabBarWrapper,
        {
          paddingBottom: insets.bottom,
          // Tonal elevation separates tab bar — no border line.
          backgroundColor: theme.colors.surface_container_high,
        },
      ]}
    >
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        const tab = tabs[index];

        const handlePress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={handlePress}
            activeOpacity={0.7}
            style={styles.tabItem}
          >
            <Ionicons
              name={(isFocused ? tab.icon : tab.iconOutline) as any}
              size={22}
              color={
                isFocused
                  ? theme.colors.primary
                  : theme.colors.on_surface_variant
              }
            />
            <Text
              style={[
                styles.tabLabel,
                {
                  color: isFocused
                    ? theme.colors.primary
                    : theme.colors.on_surface_variant,
                },
              ]}
            >
              {tab.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Navigator ───────────────────────────────────────────────

export default function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Squads" component={SquadListScreen} />
      <Tab.Screen name="Log" component={LogWorkoutScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    flexDirection: "row",
    // No hairline border — tonal depth is the separator.
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 56,
  },
  tabLabel: {
    marginTop: 2,
    fontSize: 11,
  },
});
