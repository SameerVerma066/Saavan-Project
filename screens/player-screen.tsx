import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useMemo, useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { usePlayer } from "@/context/player-context";
import { useMusicStore } from "@/store/music-store";
import { formatMillis } from "@/utils/time";

export function PlayerScreen() {
  const {
    currentTrack,
    isPlaying,
    positionMillis,
    durationMillis,
    playNext,
    playPrevious,
    togglePlayPause,
    seekTo,
    shuffleEnabled,
    repeatMode,
    toggleShuffle,
    cycleRepeatMode,
  } = usePlayer();

  const toggleLike = useMusicStore((state) => state.toggleLike);
  const isLiked = useMusicStore((state) => state.isLiked);

  const [progressWidth, setProgressWidth] = useState(0);

  const progress = useMemo(() => {
    if (!durationMillis) {
      return 0;
    }

    return Math.max(0, Math.min(1, positionMillis / durationMillis));
  }, [durationMillis, positionMillis]);

  if (!currentTrack) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.empty}>No track selected yet.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const liked = isLiked(currentTrack.id);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.heading}>Now Playing</Text>

        <Image source={{ uri: currentTrack.artwork }} style={styles.artwork} />

        <Text style={styles.title}>{currentTrack.title}</Text>
        <Text style={styles.artist}>
          {currentTrack.artist && currentTrack.artist.trim().length > 0
            ? currentTrack.artist
            : "Unknown Artist"}
        </Text>

        <Pressable
          style={styles.progressTrack}
          onLayout={(event) => setProgressWidth(event.nativeEvent.layout.width)}
          onPress={(event) => {
            if (!durationMillis || progressWidth <= 0) {
              return;
            }

            const ratio = Math.max(
              0,
              Math.min(1, event.nativeEvent.locationX / progressWidth),
            );
            void seekTo(ratio * durationMillis);
          }}
        >
          <View
            style={[styles.progressFill, { width: `${progress * 100}%` }]}
          />
        </Pressable>

        <View style={styles.timeRow}>
          <Text style={styles.time}>{formatMillis(positionMillis)}</Text>
          <Text style={styles.time}>{formatMillis(durationMillis)}</Text>
        </View>

        <View style={styles.controlRow}>
          <Pressable style={styles.modeBtn} onPress={toggleShuffle}>
            <Ionicons
              name="shuffle"
              size={19}
              color={shuffleEnabled ? "#0284c7" : "#64748b"}
            />
          </Pressable>

          <Pressable
            style={styles.roundButton}
            onPress={() => void playPrevious()}
          >
            <Ionicons name="play-skip-back" size={24} color="#0f172a" />
          </Pressable>

          <Pressable
            style={styles.playButton}
            onPress={() => void togglePlayPause()}
          >
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={30}
              color="#ffffff"
            />
          </Pressable>

          <Pressable style={styles.roundButton} onPress={() => void playNext()}>
            <Ionicons name="play-skip-forward" size={24} color="#0f172a" />
          </Pressable>

          <Pressable
            style={styles.modeBtn}
            onPress={() => toggleLike(currentTrack)}
          >
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={19}
              color={liked ? "#FF6B6B" : "#64748b"}
            />
          </Pressable>
        </View>

        <View style={styles.bottomControlRow}>
          <Pressable style={styles.modeBtn} onPress={cycleRepeatMode}>
            <Text
              style={[
                styles.repeatText,
                repeatMode !== "off" && styles.repeatActive,
              ]}
            >
              {repeatMode === "off" ? "R" : repeatMode === "all" ? "RA" : "R1"}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  heading: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 16,
  },
  empty: {
    color: "#64748b",
    marginTop: 20,
  },
  artwork: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 24,
    backgroundColor: "#e2e8f0",
  },
  title: {
    marginTop: 16,
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
  },
  artist: {
    marginTop: 4,
    color: "#475569",
    fontSize: 16,
  },
  progressTrack: {
    marginTop: 22,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#e2e8f0",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#0ea5e9",
  },
  timeRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  time: {
    color: "#64748b",
    fontSize: 13,
  },
  controlRow: {
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  bottomControlRow: {
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  modeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e2e8f0",
  },
  roundButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e2e8f0",
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0284c7",
  },
  repeatText: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "700",
  },
  repeatActive: {
    color: "#0284c7",
  },
});
