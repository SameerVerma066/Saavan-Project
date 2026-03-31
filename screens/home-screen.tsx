import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Image } from "expo-image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePlayer } from "@/context/player-context";
import type { Artist } from "@/services/saavn-api";
import { searchSongs } from "@/services/saavn-api";
import { useMusicStore } from "@/store/music-store";
import type { Track } from "@/types/track";

const ACCENT_COLOR = "#FF8A65";
const BACKGROUND = "#1a1a2e";
const SECONDARY_BG = "#262641";
const TEXT_PRIMARY = "#FFFFFF";
const TEXT_SECONDARY = "#b0b0b0";

const TABS = ["Suggested", "Songs", "Artists", "Albums", "Folder"];

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState(0);
  const [tabLayouts, setTabLayouts] = useState<
    Record<number, { x: number; width: number }>
  >({});
  const tabProgress = useRef(new Animated.Value(0)).current;
  const tabIndicatorX = useRef(new Animated.Value(0)).current;
  const tabIndicatorWidth = useRef(new Animated.Value(0)).current;
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
  const moveTrackInQueue = useMusicStore((state) => state.moveTrackInQueue);
  const setQueueAndIndex = useMusicStore((state) => state.setQueueAndIndex);

  // Suggested tab state
  const recentlyPlayed = useMusicStore((state) => state.recentlyPlayed);
  const randomSongs = useMusicStore((state) => state.randomSongs);
  const randomArtists = useMusicStore((state) => state.randomArtists);
  const isLoadingSuggestions = useMusicStore(
    (state) => state.isLoadingSuggestions,
  );
  const loadSuggestedTab = useMusicStore((state) => state.loadSuggestedTab);
  const addToRecentlyPlayed = useMusicStore(
    (state) => state.addToRecentlyPlayed,
  );

  // Liked songs state
  const likedSongs = useMusicStore((state) => state.likedSongs);
  const toggleLike = useMusicStore((state) => state.toggleLike);
  const isLiked = useMusicStore((state) => state.isLiked);

  // Artists tab state
  const artistsList = useMusicStore((state) => state.artistsList);
  const isLoadingArtists = useMusicStore((state) => state.isLoadingArtists);
  const loadArtistsTab = useMusicStore((state) => state.loadArtistsTab);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [artistSongs, setArtistSongs] = useState<Track[]>([]);
  const [isArtistActionVisible, setIsArtistActionVisible] = useState(false);
  const [isLoadingArtistSongs, setIsLoadingArtistSongs] = useState(false);

  const { playTrack } = usePlayer();

  useEffect(() => {
    Animated.timing(tabProgress, {
      toValue: activeTab,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    const layout = tabLayouts[activeTab];
    if (!layout) {
      return;
    }

    Animated.parallel([
      Animated.timing(tabIndicatorX, {
        toValue: layout.x,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(tabIndicatorWidth, {
        toValue: layout.width,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [activeTab, tabLayouts, tabIndicatorWidth, tabIndicatorX, tabProgress]);

  useFocusEffect(
    useCallback(() => {
      setActiveTab(0);
    }, []),
  );

  // Load suggestions when Suggested tab is focused
  useFocusEffect(
    useCallback(() => {
      if (activeTab === 0) {
        void loadSuggestedTab();
      } else if (activeTab === 2) {
        void loadArtistsTab();
      }
    }, [activeTab, loadSuggestedTab, loadArtistsTab]),
  );

  const handlePlayTrack = async (track: any) => {
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

  const handleTabPress = (index: number) => {
    setActiveTab(index);
  };

  const handleArtistPress = async (artist: Artist) => {
    setSelectedArtist(artist);
    setIsArtistActionVisible(true);
    setIsLoadingArtistSongs(true);

    try {
      const result = await searchSongs({
        query: artist.name,
        page: 1,
        limit: 30,
      });

      const normalized = result.tracks.map((track) => ({
        ...track,
        artist:
          track.artist && track.artist.toLowerCase() !== "unknown artist"
            ? track.artist
            : artist.name,
      }));

      setArtistSongs(normalized);
    } catch (error) {
      setArtistSongs([]);
    } finally {
      setIsLoadingArtistSongs(false);
    }
  };

  const closeArtistAction = () => {
    setIsArtistActionVisible(false);
    setSelectedArtist(null);
    setArtistSongs([]);
  };

  const handlePlayArtistNow = async () => {
    if (artistSongs.length === 0) {
      return;
    }

    setQueueAndIndex(artistSongs, 0);
    closeArtistAction();
    await playTrack(0);
  };

  const handlePlayArtistNext = () => {
    if (artistSongs.length === 0) {
      return;
    }

    const nextTrack = artistSongs[0];
    const state = useMusicStore.getState();

    if (state.currentIndex < 0) {
      setQueueAndIndex(artistSongs, 0);
      void playTrack(0);
      closeArtistAction();
      return;
    }

    addTrackToQueue(nextTrack);
    const updated = useMusicStore.getState();
    const insertedIndex = updated.queue.findIndex(
      (item) => item.id === nextTrack.id,
    );
    const targetIndex = Math.min(
      updated.currentIndex + 1,
      updated.queue.length - 1,
    );

    if (insertedIndex >= 0 && insertedIndex !== targetIndex) {
      moveTrackInQueue(insertedIndex, targetIndex);
    }

    closeArtistAction();
  };

  const handleAddArtistToQueue = () => {
    if (artistSongs.length === 0) {
      return;
    }

    for (const track of artistSongs) {
      addTrackToQueue(track);
    }

    closeArtistAction();
  };

  const handleAddArtistToPlaylist = () => {
    if (artistSongs.length === 0) {
      return;
    }

    for (const track of artistSongs.slice(0, 20)) {
      if (!isLiked(track.id)) {
        toggleLike(track);
      }
    }

    closeArtistAction();
  };

  const handleShareArtist = async () => {
    if (!selectedArtist) {
      return;
    }

    await Share.share({
      message: `Listening to ${selectedArtist.name} on Saavan Player`,
    });

    closeArtistAction();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        {/* Logo & Search */}
        <View style={styles.topBar}>
          <View style={styles.logoSection}>
            <Ionicons name="musical-notes" size={24} color={ACCENT_COLOR} />
            <Text style={styles.appName}>Saavan</Text>
          </View>
          <Pressable>
            <Ionicons name="search" size={24} color={TEXT_PRIMARY} />
          </Pressable>
        </View>

        {/* Tab Navigation */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsContainer}
          contentContainerStyle={styles.tabsContent}
        >
          {TABS.map((tab, idx) => (
            <Pressable
              key={idx}
              style={styles.tab}
              onPress={() => handleTabPress(idx)}
              onLayout={(event) => {
                const { x, width } = event.nativeEvent.layout;
                setTabLayouts((prev) => {
                  const existing = prev[idx];
                  if (
                    existing &&
                    existing.x === x &&
                    existing.width === width
                  ) {
                    return prev;
                  }

                  return {
                    ...prev,
                    [idx]: { x, width },
                  };
                });
              }}
            >
              <Animated.Text
                style={[
                  styles.tabText,
                  {
                    color: tabProgress.interpolate({
                      inputRange: [idx - 1, idx, idx + 1],
                      outputRange: [
                        TEXT_SECONDARY,
                        ACCENT_COLOR,
                        TEXT_SECONDARY,
                      ],
                      extrapolate: "clamp",
                    }),
                    transform: [
                      {
                        scale: tabProgress.interpolate({
                          inputRange: [idx - 1, idx, idx + 1],
                          outputRange: [1, 1.05, 1],
                          extrapolate: "clamp",
                        }),
                      },
                    ],
                  },
                ]}
              >
                {tab}
              </Animated.Text>
            </Pressable>
          ))}

          <Animated.View
            pointerEvents="none"
            style={[
              styles.tabIndicator,
              {
                width: tabIndicatorWidth,
                transform: [{ translateX: tabIndicatorX }],
              },
            ]}
          />
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Suggested Tab */}
        {activeTab === 0 && (
          <>
            {/* Loading State */}
            {isLoadingSuggestions && randomSongs.length === 0 && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={ACCENT_COLOR} />
              </View>
            )}

            {/* Recently Played Section - Only show if exists */}
            {recentlyPlayed.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recently Played</Text>
                </View>
                <FlatList
                  data={recentlyPlayed.slice(0, 6)}
                  keyExtractor={(item, idx) => `${item.id}-recent-${idx}`}
                  numColumns={2}
                  scrollEnabled={false}
                  columnWrapperStyle={styles.gridRow}
                  renderItem={({ item }) => (
                    <Pressable
                      style={styles.gridCard}
                      onPress={() => handlePlayTrack(item)}
                    >
                      <Image
                        source={{ uri: item.artwork }}
                        style={styles.gridImage}
                      />
                      <Text numberOfLines={2} style={styles.gridTitle}>
                        {item.title}
                      </Text>
                      <Text numberOfLines={1} style={styles.gridArtist}>
                        {item.artist}
                      </Text>
                    </Pressable>
                  )}
                />
              </View>
            )}

            {/* Artists Section - Circular images like screenshot */}
            {randomArtists.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Artists</Text>
                </View>
                <View style={styles.artistsHorizontalContainer}>
                  {randomArtists.map((item, idx) => (
                    <Pressable
                      key={`${item.id}-artist-${idx}`}
                      style={styles.artistCardCircular}
                      onPress={() => handlePlayTrack(item)}
                    >
                      <Image
                        source={{ uri: item.artwork }}
                        style={styles.artistImageCircular}
                      />
                      <Text numberOfLines={2} style={styles.artistNameCircular}>
                        {item.artist}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Random Songs Section */}
            {randomSongs.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Suggested For You</Text>
                </View>
                <FlatList
                  data={randomSongs}
                  keyExtractor={(item, idx) => `${item.id}-random-${idx}`}
                  numColumns={2}
                  scrollEnabled={false}
                  columnWrapperStyle={styles.gridRow}
                  renderItem={({ item }) => (
                    <Pressable
                      style={styles.gridCard}
                      onPress={() => handlePlayTrack(item)}
                    >
                      <Image
                        source={{ uri: item.artwork }}
                        style={styles.gridImage}
                      />
                      <Text numberOfLines={2} style={styles.gridTitle}>
                        {item.title}
                      </Text>
                      <Text numberOfLines={1} style={styles.gridArtist}>
                        {item.artist}
                      </Text>
                    </Pressable>
                  )}
                />
              </View>
            )}
          </>
        )}

        {/* Songs Tab - Liked Songs List */}
        {activeTab === 1 && (
          <>
            {likedSongs.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="heart-outline"
                  size={64}
                  color={TEXT_SECONDARY}
                />
                <Text style={styles.emptyText}>No liked songs yet</Text>
                <Text style={styles.emptySubtext}>
                  Like songs to see them here
                </Text>
              </View>
            ) : (
              <View style={styles.listContainer}>
                <FlatList
                  data={likedSongs}
                  keyExtractor={(item, idx) => `${item.id}-liked-${idx}`}
                  scrollEnabled={false}
                  renderItem={({ item }) => (
                    <Pressable
                      style={styles.songListItem}
                      onPress={() => handlePlayTrack(item)}
                    >
                      <Image
                        source={{ uri: item.artwork }}
                        style={styles.songListImage}
                      />
                      <View style={styles.songListContent}>
                        <Text numberOfLines={1} style={styles.songListTitle}>
                          {item.title}
                        </Text>
                        <Text numberOfLines={1} style={styles.songListArtist}>
                          {item.artist}
                        </Text>
                      </View>
                      <Pressable
                        style={styles.likeButton}
                        onPress={() => toggleLike(item)}
                      >
                        <Ionicons
                          name={isLiked(item.id) ? "heart" : "heart-outline"}
                          size={24}
                          color={
                            isLiked(item.id) ? ACCENT_COLOR : TEXT_SECONDARY
                          }
                        />
                      </Pressable>
                    </Pressable>
                  )}
                />
              </View>
            )}
          </>
        )}

        {/* Artists Tab - Random Artists List */}
        {activeTab === 2 && (
          <>
            {isLoadingArtists && artistsList.length === 0 && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={ACCENT_COLOR} />
              </View>
            )}

            {artistsList.length === 0 && !isLoadingArtists && (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="person-outline"
                  size={64}
                  color={TEXT_SECONDARY}
                />
                <Text style={styles.emptyText}>No artists found</Text>
                <Text style={styles.emptySubtext}>
                  Try refreshing the Artists tab
                </Text>
              </View>
            )}

            {artistsList.length > 0 && (
              <View style={styles.listContainer}>
                <FlatList
                  data={artistsList}
                  keyExtractor={(item, idx) => `${item.id}-artist-${idx}`}
                  scrollEnabled={false}
                  renderItem={({ item }) => (
                    <Pressable
                      style={styles.songListItem}
                      onPress={() => void handleArtistPress(item)}
                    >
                      <Image
                        source={{ uri: item.image }}
                        style={styles.artistListImage}
                      />
                      <View style={styles.songListContent}>
                        <Text numberOfLines={1} style={styles.songListTitle}>
                          {item.name}
                        </Text>
                        <Text numberOfLines={1} style={styles.songListArtist}>
                          1 Album | Tap for options
                        </Text>
                      </View>
                      <Ionicons
                        name="ellipsis-vertical"
                        size={18}
                        color={TEXT_SECONDARY}
                      />
                    </Pressable>
                  )}
                />
              </View>
            )}
          </>
        )}

        {/* Other Tabs - Search Results */}
        {activeTab !== 0 && activeTab !== 1 && activeTab !== 2 && (
          <>
            {/* Search Bar */}
            <View style={styles.searchRow}>
              <Ionicons
                name="search"
                size={18}
                color={TEXT_SECONDARY}
                style={styles.searchIcon}
              />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search songs..."
                placeholderTextColor={TEXT_SECONDARY}
                style={styles.input}
                onSubmitEditing={() => void loadInitialSongs()}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery("")}>
                  <Ionicons name="close" size={18} color={TEXT_SECONDARY} />
                </Pressable>
              )}
            </View>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <View style={styles.section}>
                <FlatList
                  data={searchResults}
                  keyExtractor={(item, idx) => `${item.id}-search-${idx}`}
                  numColumns={2}
                  scrollEnabled={false}
                  columnWrapperStyle={styles.gridRow}
                  onEndReached={() => void loadMoreSongs()}
                  onEndReachedThreshold={0.3}
                  renderItem={({ item }) => (
                    <Pressable
                      style={styles.gridCard}
                      onPress={() => handlePlayTrack(item)}
                    >
                      <Image
                        source={{ uri: item.artwork }}
                        style={styles.gridImage}
                      />
                      <Text numberOfLines={2} style={styles.gridTitle}>
                        {item.title}
                      </Text>
                      <Text numberOfLines={1} style={styles.gridArtist}>
                        {item.artist}
                      </Text>
                    </Pressable>
                  )}
                />
                {isLoadingSearch && (
                  <ActivityIndicator
                    size="large"
                    color={ACCENT_COLOR}
                    style={styles.loader}
                  />
                )}
              </View>
            )}

            {searchError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{searchError}</Text>
              </View>
            )}
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <Modal
        animationType="slide"
        transparent
        visible={isArtistActionVisible}
        onRequestClose={closeArtistAction}
      >
        <Pressable style={styles.sheetBackdrop} onPress={closeArtistAction}>
          <Pressable style={styles.sheetContainer} onPress={() => {}}>
            {selectedArtist && (
              <View style={styles.sheetArtistRow}>
                <Image
                  source={{ uri: selectedArtist.image }}
                  style={styles.sheetArtistImage}
                />
                <View style={styles.sheetArtistMeta}>
                  <Text numberOfLines={1} style={styles.sheetArtistName}>
                    {selectedArtist.name}
                  </Text>
                  <Text style={styles.sheetArtistInfo}>
                    1 Album | {artistSongs.length} Songs
                  </Text>
                </View>
              </View>
            )}

            {isLoadingArtistSongs ? (
              <ActivityIndicator
                size="large"
                color={ACCENT_COLOR}
                style={styles.loader}
              />
            ) : (
              <View style={styles.sheetActions}>
                <Pressable
                  style={styles.sheetActionRow}
                  onPress={() => void handlePlayArtistNow()}
                >
                  <Ionicons
                    name="play-circle-outline"
                    size={20}
                    color={TEXT_PRIMARY}
                  />
                  <Text style={styles.sheetActionText}>Play</Text>
                </Pressable>

                <Pressable
                  style={styles.sheetActionRow}
                  onPress={handlePlayArtistNext}
                >
                  <Ionicons
                    name="play-forward-outline"
                    size={20}
                    color={TEXT_PRIMARY}
                  />
                  <Text style={styles.sheetActionText}>Play Next</Text>
                </Pressable>

                <Pressable
                  style={styles.sheetActionRow}
                  onPress={handleAddArtistToQueue}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={20}
                    color={TEXT_PRIMARY}
                  />
                  <Text style={styles.sheetActionText}>
                    Add to Playing Queue
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.sheetActionRow}
                  onPress={handleAddArtistToPlaylist}
                >
                  <Ionicons
                    name="heart-outline"
                    size={20}
                    color={TEXT_PRIMARY}
                  />
                  <Text style={styles.sheetActionText}>Add to Playlist</Text>
                </Pressable>

                <Pressable
                  style={styles.sheetActionRow}
                  onPress={() => void handleShareArtist()}
                >
                  <Ionicons
                    name="share-social-outline"
                    size={20}
                    color={TEXT_PRIMARY}
                  />
                  <Text style={styles.sheetActionText}>Share</Text>
                </Pressable>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: SECONDARY_BG,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 12,
  },
  logoSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  appName: {
    fontSize: 20,
    fontWeight: "700",
    color: TEXT_PRIMARY,
  },
  tabsContainer: {
    marginHorizontal: -16,
  },
  tabsContent: {
    paddingHorizontal: 16,
    gap: 4,
    position: "relative",
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
  },
  tabIndicator: {
    position: "absolute",
    left: 0,
    bottom: 0,
    height: 2,
    borderRadius: 1,
    backgroundColor: ACCENT_COLOR,
  },
  content: {
    flex: 1,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SECONDARY_BG,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: TEXT_PRIMARY,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: TEXT_PRIMARY,
  },
  seeAll: {
    fontSize: 13,
    color: ACCENT_COLOR,
    fontWeight: "600",
  },
  gridRow: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  gridCard: {
    width: "48%",
  },
  gridImage: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    marginBottom: 8,
  },
  gridTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: TEXT_PRIMARY,
    marginBottom: 4,
  },
  gridArtist: {
    fontSize: 11,
    color: TEXT_SECONDARY,
  },
  artistRow: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  artistCard: {
    width: "30%",
    alignItems: "center",
  },
  artistImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 100,
    marginBottom: 8,
  },
  artistName: {
    fontSize: 12,
    fontWeight: "600",
    color: TEXT_PRIMARY,
    textAlign: "center",
  },
  // New styles for circular artist layout
  artistsHorizontalContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-start",
    marginBottom: 24,
    paddingHorizontal: 0,
  },
  artistCardCircular: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 8,
  },
  artistImageCircular: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  artistNameCircular: {
    fontSize: 13,
    fontWeight: "600",
    color: TEXT_PRIMARY,
    textAlign: "center",
    width: "100%",
  },
  // Loading and error states
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 400,
  },
  loader: {
    marginVertical: 20,
  },
  errorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: SECONDARY_BG,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 14,
    textAlign: "center",
  },
  // Song list styles
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  songListItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: SECONDARY_BG,
    borderRadius: 12,
  },
  songListImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 12,
  },
  songListContent: {
    flex: 1,
    justifyContent: "center",
  },
  songListTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: TEXT_PRIMARY,
    marginBottom: 4,
  },
  songListArtist: {
    fontSize: 12,
    color: TEXT_SECONDARY,
  },
  likeButton: {
    padding: 8,
  },
  // Empty state styles
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 400,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: TEXT_PRIMARY,
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    marginTop: 8,
    textAlign: "center",
  },
  // Artists grid styles
  artistsGridContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  artistListImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  artistGridCard: {
    width: "48%",
  },
  artistGridImage: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    marginBottom: 8,
  },
  artistGridName: {
    fontSize: 13,
    fontWeight: "600",
    color: TEXT_PRIMARY,
    marginBottom: 4,
  },
  artistSongsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  artistBackButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SECONDARY_BG,
    marginRight: 10,
  },
  artistSongsTitleWrap: {
    flex: 1,
  },
  artistSongsTitle: {
    color: TEXT_PRIMARY,
    fontSize: 18,
    fontWeight: "700",
  },
  artistSongsMeta: {
    color: TEXT_SECONDARY,
    fontSize: 12,
    marginTop: 2,
  },
  songPlayIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 138, 101, 0.12)",
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: "#171824",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: "#2a2c40",
  },
  sheetArtistRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 14,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2c40",
  },
  sheetArtistImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 12,
  },
  sheetArtistMeta: {
    flex: 1,
  },
  sheetArtistName: {
    color: TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: "700",
  },
  sheetArtistInfo: {
    color: TEXT_SECONDARY,
    fontSize: 12,
    marginTop: 2,
  },
  sheetActions: {
    marginTop: 2,
  },
  sheetActionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  sheetActionText: {
    color: TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: "500",
  },
  bottomSpacer: {
    height: 100,
  },
});
