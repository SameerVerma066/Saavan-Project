import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import type { Track } from "@/types/track";

const NOW_PLAYING_CHANNEL_ID = "now-playing";

let configured = false;
let activeNotificationId: string | null = null;

async function ensureConfigured() {
  if (configured || Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync(NOW_PLAYING_CHANNEL_ID, {
    name: "Now Playing",
    importance: Notifications.AndroidImportance.LOW,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    sound: null,
    vibrationPattern: [0],
    enableVibrate: false,
  });

  configured = true;
}

export async function requestNotificationPermissions() {
  if (Platform.OS !== "android") {
    return;
  }

  const { status } = await Notifications.getPermissionsAsync();
  if (status === "granted") {
    await ensureConfigured();
    return;
  }

  const result = await Notifications.requestPermissionsAsync();
  if (result.status === "granted") {
    await ensureConfigured();
  }
}

export async function updateNowPlayingNotification(
  track: Track,
  isPlaying: boolean,
) {
  if (Platform.OS !== "android") {
    return;
  }

  await ensureConfigured();

  if (activeNotificationId) {
    await Notifications.dismissNotificationAsync(activeNotificationId);
  }

  activeNotificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: track.title,
      body: track.artist || "Unknown Artist",
      sticky: true,
      autoDismiss: false,
      color: "#0284c7",
      channelId: NOW_PLAYING_CHANNEL_ID,
      data: {
        type: "now-playing",
        trackId: track.id,
        playing: isPlaying,
      },
    },
    trigger: null,
  });
}

export async function clearNowPlayingNotification() {
  if (Platform.OS !== "android") {
    return;
  }

  if (activeNotificationId) {
    await Notifications.dismissNotificationAsync(activeNotificationId);
    activeNotificationId = null;
  }
}
