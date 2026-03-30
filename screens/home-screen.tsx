import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useState } from "react";
import {
    FlatList,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from "react-native";

import { usePlayer } from "@/context/player-context";
import { useMusicStore } from "@/store/music-store";

const ACCENT_COLOR = "#FF8A65";
const BACKGROUND = "#1a1a2e";
const SECONDARY_BG = "#262641";
const TEXT_PRIMARY = "#FFFFFF";
const TEXT_SECONDARY = "#b0b0b0";

const TABS = ["Suggested", "Songs", "Artists", "Albums"];

export function HomeScreen() {
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

  const { playTrack, queue } = usePlayer();

  // Get different sections
  const recentlyPlayed = searchResults.slice(0, 6);
  const artists = searchResults.slice(0, 3);
  const mostPlayed = searchResults.slice(0, 6);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {/* Logo & Search */}
        <View style={styles.topBar}>
          <View style={styles.logoSection}>
            <Ionicons name="musical-notes" size={24} color={ACCENT_COLOR} />
            <Text style={styles.appName}>Mume</Text>
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

        {/* Recently Played Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recently Played</Text>
            <Pressable>
              <Text style={styles.seeAll}>See All</Text>
            </Pressable>
          </View>
          <FlatList
            data={recentlyPlayed}
            keyExtractor={(item, idx) => `${item.id}-recent-${idx}`}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={styles.gridRow}
            renderItem={({ item }) => (
              <Pressable
                style={styles.gridCard}
                onPress={async () => {
                  playSearchTrackNow(item);
                  const state = useMusicStore.getState();
                  await playTrack(state.currentIndex);
                }}
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

        {/* Artists Section */}
        {artists.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Artists</Text>
              <Pressable>
                <Text style={styles.seeAll}>See All</Text>
              </Pressable>
            </View>
            <FlatList
              data={artists}
              keyExtractor={(item, idx) => `${item.id}-artist-${idx}`}
              numColumns={3}
              scrollEnabled={false}
              columnWrapperStyle={styles.artistRow}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.artistCard}
                  onPress={async () => {
                    playSearchTrackNow(item);
                    const state = useMusicStore.getState();
                    await playTrack(state.currentIndex);
                  }}
                >
                  <Image
                    source={{ uri: item.artwork }}
                    style={styles.artistImage}
                  />
                  <Text numberOfLines={1} style={styles.artistName}>
                    {item.artist}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        )}

        {/* Most Played Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Most Played</Text>
            <Pressable>
              <Text style={styles.seeAll}>See All</Text>
            </Pressable>
          </View>
          <FlatList
            data={mostPlayed}
            keyExtractor={(item, idx) => `${item.id}-most-${idx}`}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={styles.gridRow}
            renderItem={({ item }) => (
              <Pressable
                style={styles.gridCard}
                onPress={async () => {
                  playSearchTrackNow(item);
                  const state = useMusicStore.getState();
                  await playTrack(state.currentIndex);
                }}
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
  bottomSpacer: {
    height: 100,
  },
});
