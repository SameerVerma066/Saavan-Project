import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
    getRandomArtists,
    getRandomSongs,
    searchSongs,
} from "@/services/saavn-api";
import type { Track } from "@/types/track";

type RepeatMode = "off" | "one" | "all";

type MusicState = {
  searchQuery: string;
  isLoadingSearch: boolean;
  searchError: string | null;
  searchResults: Track[];
  searchPage: number;
  hasMoreSearchResults: boolean;
  totalSearchResults: number;
  queue: Track[];
  currentIndex: number;
  isPlaying: boolean;
  positionMillis: number;
  durationMillis: number;
  shuffleEnabled: boolean;
  repeatMode: RepeatMode;
  // Suggested tab state
  recentlyPlayed: Track[];
  randomSongs: Track[];
  randomArtists: Track[];
  isLoadingSuggestions: boolean;
  suggestionsError: string | null;
  // Methods
  setSearchQuery: (query: string) => void;
  loadInitialSongs: () => Promise<void>;
  loadMoreSongs: () => Promise<void>;
  playSearchTrackNow: (track: Track) => void;
  addTrackToQueue: (track: Track) => void;
  removeTrackFromQueue: (index: number) => void;
  moveTrackInQueue: (from: number, to: number) => void;
  setQueueAndIndex: (queue: Track[], index: number) => void;
  setCurrentIndex: (index: number) => void;
  setPlaybackState: (value: boolean) => void;
  setPlaybackPosition: (positionMillis: number, durationMillis: number) => void;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
  sanitizeQueue: () => void;
  // Suggested tab methods
  loadSuggestedTab: () => Promise<void>;
  addToRecentlyPlayed: (track: Track) => void;
};

const SEARCH_PAGE_LIMIT = 20;

function dedupeTracksById(tracks: Track[]) {
  const seen = new Set<string>();
  const unique: Track[] = [];

  for (const track of tracks) {
    if (seen.has(track.id)) {
      continue;
    }

    seen.add(track.id);
    unique.push(track);
  }

  return unique;
}

export const useMusicStore = create<MusicState>()(
  persist(
    (set, get) => ({
      searchQuery: "",
      isLoadingSearch: false,
      searchError: null,
      searchResults: [],
      searchPage: 0,
      hasMoreSearchResults: true,
      totalSearchResults: 0,
      queue: [],
      currentIndex: -1,
      isPlaying: false,
      positionMillis: 0,
      durationMillis: 0,
      shuffleEnabled: false,
      repeatMode: "off",
      // Suggested tab state
      recentlyPlayed: [],
      randomSongs: [],
      randomArtists: [],
      isLoadingSuggestions: false,
      suggestionsError: null,

      setSearchQuery: (query) => set({ searchQuery: query }),

      loadInitialSongs: async () => {
        const query = get().searchQuery;

        set({ isLoadingSearch: true, searchError: null });

        try {
          const result = await searchSongs({
            query,
            page: 1,
            limit: SEARCH_PAGE_LIMIT,
          });

          const uniqueTracks = dedupeTracksById(result.tracks);

          set({
            searchResults: uniqueTracks,
            searchPage: 1,
            hasMoreSearchResults: result.hasMore,
            totalSearchResults: result.total,
            isLoadingSearch: false,
            searchError: null,
          });

          if (get().queue.length === 0 && uniqueTracks.length > 0) {
            set({ queue: uniqueTracks, currentIndex: 0 });
          }
        } catch (error) {
          set({
            isLoadingSearch: false,
            searchError:
              error instanceof Error ? error.message : "Failed to fetch songs",
          });
        }
      },

      loadMoreSongs: async () => {
        if (get().isLoadingSearch || !get().hasMoreSearchResults) {
          return;
        }

        const nextPage = get().searchPage + 1;
        const query = get().searchQuery;

        set({ isLoadingSearch: true, searchError: null });

        try {
          const result = await searchSongs({
            query,
            page: nextPage,
            limit: SEARCH_PAGE_LIMIT,
          });

          set((state) => ({
            searchResults: dedupeTracksById([
              ...state.searchResults,
              ...result.tracks,
            ]),
            searchPage: nextPage,
            hasMoreSearchResults: result.hasMore,
            totalSearchResults: result.total,
            isLoadingSearch: false,
            searchError: null,
          }));
        } catch (error) {
          set({
            isLoadingSearch: false,
            searchError:
              error instanceof Error ? error.message : "Failed to fetch songs",
          });
        }
      },

      playSearchTrackNow: (track) => {
        const existingIndex = get().queue.findIndex(
          (item) => item.id === track.id,
        );
        if (existingIndex >= 0) {
          set({ currentIndex: existingIndex });
          return;
        }

        set((state) => ({
          queue: [...state.queue, track],
          currentIndex: state.queue.length,
        }));
      },

      addTrackToQueue: (track) => {
        set((state) => {
          const alreadyExists = state.queue.some(
            (item) => item.id === track.id,
          );
          if (alreadyExists) {
            return state;
          }

          return {
            queue: [...state.queue, track],
          };
        });
      },

      removeTrackFromQueue: (index) => {
        set((state) => {
          if (index < 0 || index >= state.queue.length) {
            return state;
          }

          const nextQueue = state.queue.filter(
            (_, itemIndex) => itemIndex !== index,
          );
          if (nextQueue.length === 0) {
            return {
              queue: [],
              currentIndex: -1,
              isPlaying: false,
              positionMillis: 0,
              durationMillis: 0,
            };
          }

          let nextCurrentIndex = state.currentIndex;
          if (state.currentIndex === index) {
            nextCurrentIndex = Math.min(index, nextQueue.length - 1);
          } else if (state.currentIndex > index) {
            nextCurrentIndex = state.currentIndex - 1;
          }

          return {
            queue: nextQueue,
            currentIndex: nextCurrentIndex,
          };
        });
      },

      moveTrackInQueue: (from, to) => {
        set((state) => {
          if (
            from < 0 ||
            from >= state.queue.length ||
            to < 0 ||
            to >= state.queue.length ||
            from === to
          ) {
            return state;
          }

          const next = [...state.queue];
          const [moved] = next.splice(from, 1);
          next.splice(to, 0, moved);

          let nextCurrentIndex = state.currentIndex;
          if (state.currentIndex === from) {
            nextCurrentIndex = to;
          } else if (from < state.currentIndex && to >= state.currentIndex) {
            nextCurrentIndex -= 1;
          } else if (from > state.currentIndex && to <= state.currentIndex) {
            nextCurrentIndex += 1;
          }

          return {
            queue: next,
            currentIndex: nextCurrentIndex,
          };
        });
      },

      setQueueAndIndex: (queue, index) => {
        const uniqueQueue = dedupeTracksById(queue);

        if (uniqueQueue.length === 0) {
          set({
            queue: [],
            currentIndex: -1,
            isPlaying: false,
            positionMillis: 0,
            durationMillis: 0,
          });
          return;
        }

        set({
          queue: uniqueQueue,
          currentIndex: Math.max(0, Math.min(index, uniqueQueue.length - 1)),
        });
      },

      setCurrentIndex: (index) => {
        const queue = get().queue;
        if (index < 0 || index >= queue.length) {
          return;
        }

        set({
          currentIndex: index,
          positionMillis: 0,
          durationMillis: queue[index].durationMillis,
        });
      },

      setPlaybackState: (value) => set({ isPlaying: value }),

      setPlaybackPosition: (positionMillis, durationMillis) =>
        set({ positionMillis, durationMillis }),

      toggleShuffle: () =>
        set((state) => ({ shuffleEnabled: !state.shuffleEnabled })),

      cycleRepeatMode: () =>
        set((state) => {
          if (state.repeatMode === "off") {
            return { repeatMode: "all" };
          }

          if (state.repeatMode === "all") {
            return { repeatMode: "one" };
          }

          return { repeatMode: "off" };
        }),

      sanitizeQueue: () => {
        set((state) => {
          if (state.queue.length === 0) {
            return state;
          }

          const currentTrackId = state.queue[state.currentIndex]?.id;

          // Deduplicate tracks
          const uniqueQueue = dedupeTracksById(state.queue);

          // Ensure all tracks have proper artist names
          const cleanedQueue = uniqueQueue.map((track) => ({
            ...track,
            artist:
              track.artist && track.artist.trim().length > 0
                ? track.artist
                : "Unknown Artist",
          }));

          if (
            cleanedQueue.length === state.queue.length &&
            cleanedQueue.every(
              (track, idx) => track.artist === state.queue[idx]?.artist,
            )
          ) {
            return state;
          }

          const nextIndex = currentTrackId
            ? cleanedQueue.findIndex((track) => track.id === currentTrackId)
            : -1;

          return {
            queue: cleanedQueue,
            currentIndex:
              nextIndex >= 0
                ? nextIndex
                : Math.min(state.currentIndex, cleanedQueue.length - 1),
          };
        });
      },

      loadSuggestedTab: async () => {
        set({ isLoadingSuggestions: true, suggestionsError: null });

        try {
          const [suggestions, artists] = await Promise.all([
            getRandomSongs(6),
            getRandomArtists(3),
          ]);

          set({
            randomSongs: suggestions,
            randomArtists: artists,
            isLoadingSuggestions: false,
            suggestionsError: null,
          });
        } catch (error) {
          set({
            isLoadingSuggestions: false,
            suggestionsError:
              error instanceof Error
                ? error.message
                : "Failed to load suggestions",
          });
        }
      },

      addToRecentlyPlayed: (track) => {
        set((state) => {
          // Remove if already exists, then add to front
          const filtered = state.recentlyPlayed.filter(
            (item) => item.id !== track.id,
          );
          const updated = [track, ...filtered];

          // Keep only last 10 recently played tracks
          return {
            recentlyPlayed: updated.slice(0, 10),
          };
        });
      },
    }),
    {
      name: "music-store-v1",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        queue: state.queue,
        currentIndex: state.currentIndex,
        shuffleEnabled: state.shuffleEnabled,
        repeatMode: state.repeatMode,
        recentlyPlayed: state.recentlyPlayed,
      }),
    },
  ),
);
