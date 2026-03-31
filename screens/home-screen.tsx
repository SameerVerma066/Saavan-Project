import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Image } from "expo-image";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePlayer } from "@/context/player-context";
import { useMusicStore } from "@/store/music-store";

const ACCENT_COLOR = "#FF8A65";
const BACKGROUND = "#1a1a2e";
const SECONDARY_BG = "#262641";
const TEXT_PRIMARY = "#FFFFFF";
const TEXT_SECONDARY = "#b0b0b0";

const TABS = ["Suggested", "Songs", "Artists", "Albums", "Folder"];

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState(0);
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

  const { playTrack } = usePlayer();

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
    playSearchTrackNow(track);
    addToRecentlyPlayed(track);
    const state = useMusicStore.getState();
    await playTrack(state.currentIndex);
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
              style={[styles.tab, activeTab === idx && styles.tabActive]}
              onPress={() => setActiveTab(idx)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === idx && styles.tabTextActive,
                ]}
              >
                {tab}
              </Text>
            </Pressable>
          ))}
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
                <Ionicons name="person-outline" size={64} color={TEXT_SECONDARY} />
                <Text style={styles.emptyText}>No artists found</Text>
                <Text style={styles.emptySubtext}>
                  Try refreshing the Artists tab
                </Text>
              </View>
            )}

            {artistsList.length > 0 && (
              <View style={styles.artistsGridContainer}>
                <FlatList
                  data={artistsList}
                  keyExtractor={(item, idx) => `${item.id}-artist-${idx}`}
                  numColumns={2}
                  scrollEnabled={false}
                  columnWrapperStyle={styles.gridRow}
                  renderItem={({ item }) => (
                    <Pressable style={styles.artistGridCard}>
                      <Image
                        source={{ uri: item.image }}
                        style={styles.artistGridImage}
                      />
                      <Text numberOfLines={2} style={styles.artistGridName}>
                        {item.name}
                      </Text>
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
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: ACCENT_COLOR,
  },
  tabText: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    fontWeight: "500",
  },
  tabTextActive: {
    color: ACCENT_COLOR,
    fontWeight: "700",
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
  bottomSpacer: {
    height: 100,
  },
});
