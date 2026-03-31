import { Audio, type AVPlaybackStatus } from "expo-av";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";

import {
  clearNowPlayingNotification,
  requestNotificationPermissions,
  updateNowPlayingNotification,
} from "@/services/now-playing-notification";
import { useMusicStore } from "@/store/music-store";
import type { Track } from "@/types/track";

type PlayerContextValue = {
  queue: Track[];
  currentTrack: Track | null;
  currentTrackIndex: number;
  isPlaying: boolean;
  positionMillis: number;
  durationMillis: number;
  shuffleEnabled: boolean;
  repeatMode: "off" | "one" | "all";
  playTrack: (index: number) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  seekTo: (millis: number) => Promise<void>;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const isTransitioningRef = useRef(false);
  const playRequestIdRef = useRef(0);
  const handlingFinishRef = useRef(false);

  const queue = useMusicStore((state) => state.queue);
  const currentTrackIndex = useMusicStore((state) => state.currentIndex);
  const isPlaying = useMusicStore((state) => state.isPlaying);
  const positionMillis = useMusicStore((state) => state.positionMillis);
  const durationMillis = useMusicStore((state) => state.durationMillis);
  const shuffleEnabled = useMusicStore((state) => state.shuffleEnabled);
  const repeatMode = useMusicStore((state) => state.repeatMode);

  const setPlaybackState = useMusicStore((state) => state.setPlaybackState);
  const setPlaybackPosition = useMusicStore(
    (state) => state.setPlaybackPosition,
  );
  const toggleShuffle = useMusicStore((state) => state.toggleShuffle);
  const cycleRepeatMode = useMusicStore((state) => state.cycleRepeatMode);
  const sanitizeQueue = useMusicStore((state) => state.sanitizeQueue);

  const currentTrack = queue[currentTrackIndex] ?? null;

  const onPlaybackStatusUpdate = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) {
        setPlaybackState(false);
        void clearNowPlayingNotification();
        return;
      }

      setPlaybackState(status.isPlaying);
      setPlaybackPosition(
        status.positionMillis ?? 0,
        status.durationMillis ?? 0,
      );

      if (status.didJustFinish) {
        void (async () => {
          if (handlingFinishRef.current) {
            return;
          }

          handlingFinishRef.current = true;

          try {
            const state = useMusicStore.getState();
            const totalTracks = state.queue.length;

            if (totalTracks === 0) {
              state.setPlaybackState(false);
              return;
            }

            if (state.repeatMode === "one") {
              await playTrackAtIndex(state.currentIndex, true, 0);
              return;
            }

            let nextIndex = state.currentIndex + 1;

            if (state.shuffleEnabled) {
              nextIndex = Math.floor(Math.random() * totalTracks);
            }

            const isEnd = nextIndex >= totalTracks;

            if (isEnd) {
              if (state.repeatMode === "all") {
                nextIndex = 0;
                await playTrackAtIndex(nextIndex, true, 0);
              } else if (state.repeatMode === "off") {
                nextIndex = Math.floor(Math.random() * totalTracks);
                await playTrackAtIndex(nextIndex, true, 0);
              }
            } else {
              await playTrackAtIndex(nextIndex, true, 0);
            }
          } finally {
            handlingFinishRef.current = false;
          }
        })();
      }
    },
    [setPlaybackPosition, setPlaybackState],
  );

  const getPlaybackCandidates = useCallback((track: Track) => {
    const ordered = [
      track.streamUrl,
      ...track.downloadUrls.map((item) => item.url),
    ]
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    return Array.from(new Set(ordered));
  }, []);

  const createSoundWithFallback = useCallback(
    async (track: Track, shouldPlay: boolean, startPosition: number) => {
      const candidates = getPlaybackCandidates(track);
      let lastError: unknown = null;

      for (const candidateUrl of candidates) {
        try {
          return await Audio.Sound.createAsync(
            { uri: candidateUrl },
            {
              shouldPlay,
              positionMillis: startPosition,
              progressUpdateIntervalMillis: 500,
            },
            onPlaybackStatusUpdate,
          );
        } catch (error) {
          lastError = error;
        }
      }

      if (lastError) {
        throw lastError;
      }

      throw new Error("No valid stream URL found for this track");
    },
    [getPlaybackCandidates, onPlaybackStatusUpdate],
  );

  const unloadCurrentSound = useCallback(async () => {
    if (!soundRef.current) {
      return;
    }

    soundRef.current.setOnPlaybackStatusUpdate(null);
    await soundRef.current.unloadAsync();
    soundRef.current = null;
  }, []);

  const playTrackAtIndex = useCallback(
    async (index: number, shouldPlay = true, startPosition = 0) => {
      const state = useMusicStore.getState();
      if (index < 0 || index >= state.queue.length) {
        return;
      }

      const requestId = ++playRequestIdRef.current;
      isTransitioningRef.current = true;

      try {
        await unloadCurrentSound();

        // If a newer request started while unloading, stop this request.
        if (requestId !== playRequestIdRef.current) {
          return;
        }

        const track = useMusicStore.getState().queue[index];
        if (!track?.streamUrl) {
          return;
        }

        const { sound, status } = await createSoundWithFallback(
          track,
          shouldPlay,
          startPosition,
        );

        // If a newer request started while creating the sound, discard this one.
        if (requestId !== playRequestIdRef.current) {
          sound.setOnPlaybackStatusUpdate(null);
          await sound.unloadAsync();
          return;
        }

        soundRef.current = sound;
        useMusicStore.getState().setCurrentIndex(index);
        useMusicStore.getState().addToRecentlyPlayed(track);

        if (status.isLoaded) {
          useMusicStore.getState().setPlaybackState(status.isPlaying);
          useMusicStore
            .getState()
            .setPlaybackPosition(
              status.positionMillis ?? 0,
              status.durationMillis ?? track.durationMillis,
            );
          void updateNowPlayingNotification(track, status.isPlaying);
        }
      } catch (error) {
        console.error("Error playing track:", error);
      } finally {
        if (requestId === playRequestIdRef.current) {
          isTransitioningRef.current = false;
        }
      }
    },
    [createSoundWithFallback, unloadCurrentSound],
  );

  const playTrack = useCallback(
    async (index: number) => {
      await playTrackAtIndex(index, true, 0);
    },
    [playTrackAtIndex],
  );

  const togglePlayPause = useCallback(async () => {
    const state = useMusicStore.getState();

    if (state.currentIndex < 0 && state.queue.length > 0) {
      await playTrackAtIndex(0, true, 0);
      return;
    }

    if (!soundRef.current && state.currentIndex >= 0) {
      await playTrackAtIndex(state.currentIndex, true, state.positionMillis);
      return;
    }

    const sound = soundRef.current;
    if (!sound) {
      return;
    }

    const status = await sound.getStatusAsync();
    if (!status.isLoaded) {
      return;
    }

    if (status.isPlaying) {
      await sound.pauseAsync();
      const pausedTrack = useMusicStore.getState().queue[state.currentIndex];
      if (pausedTrack) {
        void updateNowPlayingNotification(pausedTrack, false);
      }
    } else {
      await sound.playAsync();
      const resumedTrack = useMusicStore.getState().queue[state.currentIndex];
      if (resumedTrack) {
        void updateNowPlayingNotification(resumedTrack, true);
      }
    }
  }, [playTrackAtIndex]);

  const playNext = useCallback(async () => {
    if (isTransitioningRef.current) {
      return;
    }

    const state = useMusicStore.getState();
    if (state.queue.length === 0) {
      return;
    }

    isTransitioningRef.current = true;
    try {
      let nextIndex = state.currentIndex + 1;

      if (state.shuffleEnabled && state.queue.length > 1) {
        do {
          nextIndex = Math.floor(Math.random() * state.queue.length);
        } while (nextIndex === state.currentIndex);

        await playTrackAtIndex(nextIndex, true, 0);
        return;
      }

      if (nextIndex >= state.queue.length) {
        if (state.repeatMode === "all") {
          nextIndex = 0;
        } else {
          nextIndex = Math.floor(Math.random() * state.queue.length);
        }
      }

      await playTrackAtIndex(nextIndex, true, 0);
    } finally {
      isTransitioningRef.current = false;
    }
  }, [playTrackAtIndex]);

  const playPrevious = useCallback(async () => {
    if (isTransitioningRef.current) {
      return;
    }

    const state = useMusicStore.getState();
    if (state.queue.length === 0) {
      return;
    }

    isTransitioningRef.current = true;
    try {
      let prevIndex = state.currentIndex - 1;

      if (state.shuffleEnabled && state.queue.length > 1) {
        do {
          prevIndex = Math.floor(Math.random() * state.queue.length);
        } while (prevIndex === state.currentIndex);

        await playTrackAtIndex(prevIndex, true, 0);
        return;
      }

      if (prevIndex < 0) {
        prevIndex = state.queue.length - 1;
      }

      await playTrackAtIndex(prevIndex, true, 0);
    } finally {
      isTransitioningRef.current = false;
    }
  }, [playTrackAtIndex]);

  const seekTo = useCallback(async (millis: number) => {
    if (!soundRef.current) {
      return;
    }

    const status = await soundRef.current.getStatusAsync();
    if (!status.isLoaded) {
      return;
    }

    const clamped = Math.max(
      0,
      Math.min(millis, status.durationMillis ?? millis),
    );
    await soundRef.current.setPositionAsync(clamped);
  }, []);

  useEffect(() => {
    sanitizeQueue();

    void requestNotificationPermissions();

    void Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    return () => {
      void clearNowPlayingNotification();
      void unloadCurrentSound();
    };
  }, [sanitizeQueue, unloadCurrentSound]);

  useEffect(() => {
    if (queue.length === 0 || currentTrackIndex < 0) {
      void clearNowPlayingNotification();
      void unloadCurrentSound();
      return;
    }

    if (!soundRef.current) {
      void playTrackAtIndex(currentTrackIndex, false, positionMillis);
    }
  }, [
    currentTrackIndex,
    playTrackAtIndex,
    positionMillis,
    queue.length,
    unloadCurrentSound,
  ]);

  const value = useMemo<PlayerContextValue>(
    () => ({
      queue,
      currentTrack,
      currentTrackIndex,
      isPlaying,
      positionMillis,
      durationMillis,
      shuffleEnabled,
      repeatMode,
      playTrack,
      togglePlayPause,
      playNext,
      playPrevious,
      seekTo,
      toggleShuffle,
      cycleRepeatMode,
    }),
    [
      currentTrack,
      currentTrackIndex,
      cycleRepeatMode,
      durationMillis,
      isPlaying,
      playNext,
      playPrevious,
      playTrack,
      positionMillis,
      queue,
      repeatMode,
      seekTo,
      shuffleEnabled,
      togglePlayPause,
      toggleShuffle,
    ],
  );

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used inside PlayerProvider");
  }

  return context;
}
