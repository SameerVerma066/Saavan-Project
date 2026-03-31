import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePlayer } from "@/context/player-context";
import { formatMillis } from "@/utils/time";

export function MiniPlayer() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    currentTrack,
    isPlaying,
    positionMillis,
    durationMillis,
    togglePlayPause,
  } = usePlayer();

  if (!currentTrack) {
    return null;
  }

  const tabBarHeight = 62 + Math.max(insets.bottom, 8);

  return (
    <Pressable
      onPress={() => router.push("/player")}
      style={[styles.container, { bottom: tabBarHeight + 8 }]}
    >
      <Image source={{ uri: currentTrack.artwork }} style={styles.artwork} />

      <View style={styles.center}>
        <Text numberOfLines={1} style={styles.title}>
          {currentTrack.title}
        </Text>
        <Text numberOfLines={1} style={styles.meta}>
          {currentTrack.artist} • {formatMillis(positionMillis)} /{" "}
          {formatMillis(durationMillis)}
        </Text>
      </View>

      <Pressable
        onPress={() => void togglePlayPause()}
        hitSlop={10}
        style={styles.playButton}
      >
        <Ionicons
          name={isPlaying ? "pause" : "play"}
          size={18}
          color="#ffffff"
        />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 72,
    zIndex: 20,
    borderRadius: 16,
    backgroundColor: "#0f172a",
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  artwork: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#1e293b",
  },
  center: {
    flex: 1,
  },
  title: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "700",
  },
  meta: {
    marginTop: 3,
    color: "#94a3b8",
    fontSize: 12,
  },
  playButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0284c7",
  },
});
