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
    toggleShuffle,
  } = usePlayer();

  const toggleLike = useMusicStore((state) => state.toggleLike);
  const currentTrackId = currentTrack?.id ?? null;
  const liked = useMusicStore((state) =>
    currentTrackId
      ? state.likedSongs.some((track) => track.id === currentTrackId)
      : false,
  );

  const [progressWidth, setProgressWidth] = useState(0);

  const progress = useMemo(() => {
    if (!durationMillis) {
      return 0;
    }

    return Math.max(0, Math.min(1, positionMillis / durationMillis));
  }, [durationMillis, positionMillis]);

  const handleSeekByPosition = (locationX: number) => {
    if (!durationMillis || progressWidth <= 0) {
      return;
    }

    const ratio = Math.max(0, Math.min(1, locationX / progressWidth));
    void seekTo(ratio * durationMillis);
  };

  if (!currentTrack) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.empty}>No track selected yet.</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          onPress={(event) => handleSeekByPosition(event.nativeEvent.locationX)}
          onStartShouldSetResponder={() => true}
          onResponderGrant={(event) =>
            handleSeekByPosition(event.nativeEvent.locationX)
          }
          onResponderMove={(event) =>
            handleSeekByPosition(event.nativeEvent.locationX)
          }
        >
          <View
            style={[styles.progressFill, { width: `${progress * 100}%` }]}
          />
          <View
            style={[styles.progressThumb, { left: `${progress * 100}%` }]}
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
            style={({ pressed }) => [
              styles.modeBtn,
              styles.likeBtn,
              liked && styles.likeBtnActive,
              pressed && styles.modeBtnPressed,
            ]}
            hitSlop={8}
            onPress={() => toggleLike(currentTrack)}
          >
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={21}
              color={liked ? "#ef4444" : "#94a3b8"}
            />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f1220",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  heading: {
    fontSize: 28,
    fontWeight: "800",
    color: "#f8fafc",
    marginBottom: 16,
  },
  empty: {
    color: "#8B8FA8",
    marginTop: 20,
  },
  artwork: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 24,
    backgroundColor: "#1f2937",
  },
  title: {
    marginTop: 16,
    fontSize: 24,
    fontWeight: "800",
    color: "#f8fafc",
  },
  artist: {
    marginTop: 4,
    color: "#9CA3AF",
    fontSize: 16,
  },
  progressTrack: {
    marginTop: 22,
    height: 12,
    borderRadius: 999,
    backgroundColor: "#2a2c40",
    overflow: "hidden",
    justifyContent: "center",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#0ea5e9",
  },
  progressThumb: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#ffffff",
    borderWidth: 3,
    borderColor: "#0ea5e9",
    marginLeft: -9,
    elevation: 3,
  },
  timeRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  time: {
    color: "#8B8FA8",
    fontSize: 13,
  },
  controlRow: {
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  modeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1f2937",
  },
  modeBtnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  likeBtn: {
    borderWidth: 1,
    borderColor: "#334155",
  },
  likeBtnActive: {
    backgroundColor: "#450a0a",
    borderColor: "#7f1d1d",
  },
  roundButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1f2937",
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0284c7",
  },
});
