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

import { usePlayer } from "@/context/player-context";
import { useMusicStore } from "@/store/music-store";

export function QueueScreen() {
  const { queue, currentTrackIndex, playTrack } = usePlayer();

  const removeTrackFromQueue = useMusicStore(
    (state) => state.removeTrackFromQueue,
  );
  const moveTrackInQueue = useMusicStore((state) => state.moveTrackInQueue);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.heading}>Queue</Text>
        <Text style={styles.subheading}>
          Reorder and manage your persisted queue
        </Text>

        <FlatList
          data={queue}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.empty}>No songs in queue yet.</Text>
          }
          renderItem={({ item, index }) => {
            const isCurrent = index === currentTrackIndex;

            return (
              <Pressable
                style={[styles.row, isCurrent && styles.rowActive]}
                onPress={() => void playTrack(index)}
              >
                <Image source={{ uri: item.artwork }} style={styles.cover} />
                <View style={styles.textWrap}>
                  <Text numberOfLines={1} style={styles.title}>
                    {item.title}
                  </Text>
                  <Text numberOfLines={1} style={styles.meta}>
                    {item.artist}
                  </Text>
                </View>

                <View style={styles.actions}>
                  <Pressable onPress={() => moveTrackInQueue(index, index - 1)}>
                    <Ionicons name="chevron-up" size={18} color="#334155" />
                  </Pressable>
                  <Pressable onPress={() => moveTrackInQueue(index, index + 1)}>
                    <Ionicons name="chevron-down" size={18} color="#334155" />
                  </Pressable>
                  <Pressable onPress={() => removeTrackFromQueue(index)}>
                    <Ionicons name="trash-outline" size={18} color="#dc2626" />
                  </Pressable>
                </View>
              </Pressable>
            );
          }}
        />
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
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  heading: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0f172a",
  },
  subheading: {
    marginTop: 6,
    color: "#64748b",
    fontSize: 13,
  },
  listContent: {
    paddingTop: 14,
    paddingBottom: 140,
    gap: 10,
  },
  empty: {
    marginTop: 20,
    color: "#64748b",
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    padding: 10,
  },
  rowActive: {
    borderColor: "#0284c7",
    backgroundColor: "#f0f9ff",
  },
  cover: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: "#e2e8f0",
  },
  textWrap: {
    flex: 1,
  },
  title: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "700",
  },
  meta: {
    marginTop: 2,
    color: "#64748b",
    fontSize: 12,
  },
  actions: {
    gap: 8,
    alignItems: "center",
  },
});
