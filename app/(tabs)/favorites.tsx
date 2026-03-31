import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import {
    FlatList,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePlayer } from "@/context/player-context";
import { useMusicStore } from "@/store/music-store";

export default function FavoritesTab() {
  const insets = useSafeAreaInsets();
  const likedSongs = useMusicStore((state) => state.likedSongs);
  const playSearchTrackNow = useMusicStore((state) => state.playSearchTrackNow);
  const addToRecentlyPlayed = useMusicStore(
    (state) => state.addToRecentlyPlayed,
  );
  const toggleLike = useMusicStore((state) => state.toggleLike);

  const { playTrack } = usePlayer();

  const handlePlayTrack = async (track: (typeof likedSongs)[number]) => {
    const stateBefore = useMusicStore.getState();
    const existingIndex = stateBefore.queue.findIndex(
      (item) => item.id === track.id,
    );
    const targetIndex =
      existingIndex >= 0 ? existingIndex : stateBefore.queue.length;

    playSearchTrackNow(track);
    addToRecentlyPlayed(track);
    await playTrack(targetIndex);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.content, { paddingTop: Math.max(insets.top, 16) }]}>
        <Text style={styles.title}>Favorites</Text>

        {likedSongs.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="heart-outline" size={56} color="#8B8FA8" />
            <Text style={styles.emptyTitle}>No liked songs yet</Text>
            <Text style={styles.emptyText}>
              Like songs and they will appear here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={likedSongs}
            keyExtractor={(item, idx) => `${item.id}-fav-${idx}`}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <Pressable
                style={styles.row}
                onPress={() => void handlePlayTrack(item)}
              >
                <Image source={{ uri: item.artwork }} style={styles.artwork} />

                <View style={styles.metaWrap}>
                  <Text numberOfLines={1} style={styles.songTitle}>
                    {item.title}
                  </Text>
                  <Text numberOfLines={1} style={styles.songMeta}>
                    {item.artist}
                  </Text>
                </View>

                <Pressable
                  style={styles.actionBtn}
                  onPress={() => toggleLike(item)}
                >
                  <Ionicons name="heart" size={20} color="#FF8A65" />
                </Pressable>
              </Pressable>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 140,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2a2c40",
    backgroundColor: "#171824",
    padding: 10,
  },
  artwork: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: "#1e293b",
  },
  metaWrap: {
    flex: 1,
  },
  songTitle: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "700",
  },
  songMeta: {
    marginTop: 2,
    color: "#94a3b8",
    fontSize: 12,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 138, 101, 0.14)",
  },
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: -40,
  },
  emptyTitle: {
    marginTop: 14,
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  emptyText: {
    marginTop: 6,
    color: "#8B8FA8",
    fontSize: 14,
    textAlign: "center",
  },
});
