import { Tabs } from "expo-router";
import React from "react";
import { View } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { MiniPlayer } from "@/components/mini-player";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";

const TAB_SCREEN_OPTIONS = {
  tabBarActiveTintColor: Colors.dark.tint,
  tabBarInactiveTintColor: Colors.dark.tabIconDefault,
  tabBarStyle: {
    backgroundColor: Colors.dark.background,
    borderTopColor: "#262641",
    borderTopWidth: 1,
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
              <IconSymbol size={28} name="house.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: "Queue",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="music.note.list" color={color} />
            ),
          }}
        />
      </Tabs>
      <MiniPlayer />
    </View>
  );
}
