import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { MiniPlayer } from "@/components/mini-player";

const ACTIVE_TINT = "#FF8A65";
const INACTIVE_TINT = "#8B8FA8";

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  const tabBarHeight = 62 + Math.max(insets.bottom, 8);

  return (
    <View style={{ flex: 1, backgroundColor: "#111322" }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: ACTIVE_TINT,
          tabBarInactiveTintColor: INACTIVE_TINT,
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontSize: 11,
            marginBottom: 2,
          },
          tabBarStyle: {
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "#111322",
            borderTopColor: "#262641",
            borderTopWidth: 1,
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            height: tabBarHeight,
            paddingTop: 6,
            paddingBottom: Math.max(insets.bottom, 8),
          },
          sceneStyle: {
            backgroundColor: "#1a1a2e",
          },
          headerShown: false,
          tabBarButton: HapticTab,
        }}
      >
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
