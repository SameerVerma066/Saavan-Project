import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { MiniPlayer } from "@/components/mini-player";

const ACTIVE_TINT = "#FF8A65";
const INACTIVE_TINT = "#8B8FA8";

const TAB_SCREEN_OPTIONS = {
  tabBarActiveTintColor: ACTIVE_TINT,
  tabBarInactiveTintColor: INACTIVE_TINT,
  tabBarShowLabel: true,
  tabBarLabelStyle: {
    fontSize: 11,
    marginBottom: 4,
  },
  tabBarStyle: {
    backgroundColor: "#111322",
    borderTopColor: "#262641",
    borderTopWidth: 1,
    height: 66,
    paddingTop: 6,
  },
  headerShown: false,
  tabBarButton: HapticTab,
} as const;

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs screenOptions={TAB_SCREEN_OPTIONS}>
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <Ionicons size={20} name="home" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="favorites"
          options={{
            title: "Favorites",
            tabBarIcon: ({ color }) => (
              <Ionicons size={20} name="heart-outline" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: "Playlists",
            tabBarIcon: ({ color }) => (
              <Ionicons size={20} name="list" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color }) => (
              <Ionicons size={20} name="settings-outline" color={color} />
            ),
          }}
        />
      </Tabs>
      <MiniPlayer />
    </View>
  );
}
