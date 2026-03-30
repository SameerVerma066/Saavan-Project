import { Audio, type AVPlaybackStatus } from "expo-av";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
} from "react";

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
  const loadingIndexRef = useRef<number | null>(null);

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
        return;
      }

      setPlaybackState(status.isPlaying);
      setPlaybackPosition(
        status.positionMillis ?? 0,
        status.durationMillis ?? 0,
      );

      if (status.didJustFinish) {
        void (async () => {
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
          if (isEnd && state.repeatMode === "off") {
            state.setPlaybackState(false);
            state.setPlaybackPosition(0, state.durationMillis);
            return;
          }

          if (isEnd && state.repeatMode === "all") {
            nextIndex = 0;
          }

          await playTrackAtIndex(nextIndex, true, 0);
        })();
      }
    },
    [setPlaybackPosition, setPlaybackState],
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

      if (loadingIndexRef.current === index) {
        return;
      }

      loadingIndexRef.current = index;

      await unloadCurrentSound();

      try {
        const track = useMusicStore.getState().queue[index];
        if (!track?.streamUrl) {
          return;
        }

        const { sound, status } = await Audio.Sound.createAsync(
          { uri: track.streamUrl },
          {
            shouldPlay,
            positionMillis: startPosition,
            progressUpdateIntervalMillis: 500,
          },
          onPlaybackStatusUpdate,
        );

        soundRef.current = sound;
        useMusicStore.getState().setCurrentIndex(index);

        if (status.isLoaded) {
          useMusicStore.getState().setPlaybackState(status.isPlaying);
          useMusicStore
            .getState()
            .setPlaybackPosition(
              status.positionMillis ?? 0,
              status.durationMillis ?? track.durationMillis,
            );
        }
      } finally {
        loadingIndexRef.current = null;
      }
    },
    [onPlaybackStatusUpdate, unloadCurrentSound],
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
    } else {
      await sound.playAsync();
    }
  }, [playTrackAtIndex]);

  const playNext = useCallback(async () => {
    const state = useMusicStore.getState();
    if (state.queue.length === 0) {
      return;
    }

    const nextIndex = (state.currentIndex + 1) % state.queue.length;
    await playTrackAtIndex(nextIndex, true, 0);
  }, [playTrackAtIndex]);

  const playPrevious = useCallback(async () => {
    const state = useMusicStore.getState();
    if (state.queue.length === 0) {
      return;
    }

    const prevIndex =
      (state.currentIndex - 1 + state.queue.length) % state.queue.length;
    await playTrackAtIndex(prevIndex, true, 0);
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

    void Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    return () => {
      void unloadCurrentSound();
    };
  }, [sanitizeQueue, unloadCurrentSound]);

  useEffect(() => {
    if (queue.length === 0 || currentTrackIndex < 0) {
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
