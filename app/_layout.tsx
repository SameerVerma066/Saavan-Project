import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { PlayerProvider } from "@/context/player-context";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  return (
    <ThemeProvider value={DarkTheme}>
      <PlayerProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="player" options={{ title: "Player" }} />
        </Stack>
      </PlayerProvider>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
