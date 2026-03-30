import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { usePlayer } from "@/context/player-context";
import { useMusicStore } from "@/store/music-store";

export function HomeScreen() {
  const searchQuery = useMusicStore((state) => state.searchQuery);
  const searchResults = useMusicStore((state) => state.searchResults);
  const isLoadingSearch = useMusicStore((state) => state.isLoadingSearch);
  const hasMoreSearchResults = useMusicStore(
    (state) => state.hasMoreSearchResults,
  );
  const searchError = useMusicStore((state) => state.searchError);
  const setSearchQuery = useMusicStore((state) => state.setSearchQuery);
  const loadInitialSongs = useMusicStore((state) => state.loadInitialSongs);
  const loadMoreSongs = useMusicStore((state) => state.loadMoreSongs);
  const playSearchTrackNow = useMusicStore((state) => state.playSearchTrackNow);
  const addTrackToQueue = useMusicStore((state) => state.addTrackToQueue);

  const { playTrack, queue } = usePlayer();

  useEffect(() => {
    if (searchResults.length === 0) {
      void loadInitialSongs();
    }
  }, [loadInitialSongs, searchResults.length]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.heading}>Home</Text>
        <Text style={styles.subheading}>
          Search songs from JioSaavn and add to queue
        </Text>

        <View style={styles.searchRow}>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search songs, artist, album"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            onSubmitEditing={() => void loadInitialSongs()}
            returnKeyType="search"
          />
          <Pressable
            style={styles.searchButton}
            onPress={() => void loadInitialSongs()}
          >
            <Ionicons name="search" size={18} color="#ffffff" />
          </Pressable>
        </View>

        {searchError ? (
          <Text style={styles.errorText}>{searchError}</Text>
        ) : null}

        <FlatList
          data={searchResults}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          contentContainerStyle={styles.listContent}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (!isLoadingSearch && hasMoreSearchResults) {
              void loadMoreSongs();
            }
          }}
          ListFooterComponent={
            isLoadingSearch ? (
              <ActivityIndicator color="#0284c7" size="small" />
            ) : null
          }
          renderItem={({ item }) => {
            const queueIndex = queue.findIndex((track) => track.id === item.id);

            return (
              <Pressable
                style={styles.row}
                onPress={async () => {
                  playSearchTrackNow(item);
                  const state = useMusicStore.getState();
                  await playTrack(state.currentIndex);
                }}
              >
                <Image source={{ uri: item.artwork }} style={styles.cover} />

                <View style={styles.textWrap}>
                  <Text numberOfLines={1} style={styles.title}>
                    {item.title}
                  </Text>
                  <Text numberOfLines={1} style={styles.meta}>
                    {item.artist} • {item.album}
                  </Text>
                </View>

                <View style={styles.actions}>
                  <Text style={styles.duration}>{item.durationLabel}</Text>
                  <Pressable
                    style={styles.addButton}
                    onPress={() => {
                      if (queueIndex < 0) {
                        addTrackToQueue(item);
                      }
                    }}
                  >
                    <Ionicons
                      name={queueIndex >= 0 ? "checkmark" : "add"}
                      size={16}
                      color={queueIndex >= 0 ? "#16a34a" : "#0284c7"}
                    />
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
  searchRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    color: "#0f172a",
    fontSize: 14,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0284c7",
  },
  errorText: {
    marginTop: 8,
    color: "#dc2626",
    fontSize: 12,
  },
  listContent: {
    paddingTop: 14,
    paddingBottom: 140,
    gap: 10,
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
  cover: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: "#e2e8f0",
  },
  textWrap: {
    flex: 1,
  },
  title: {
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "700",
  },
  meta: {
    marginTop: 3,
    color: "#64748b",
    fontSize: 12,
  },
  actions: {
    alignItems: "flex-end",
    gap: 8,
  },
  duration: {
    color: "#475569",
    fontSize: 12,
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e2e8f0",
  },
});
