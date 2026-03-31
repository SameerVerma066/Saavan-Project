import Constants from "expo-constants";
import { Platform } from "react-native";

import type { Track } from "@/types/track";

const NOW_PLAYING_CHANNEL_ID = "now-playing";

let configured = false;
let activeNotificationId: string | null = null;

type NotificationsModule = typeof import("expo-notifications");

function isSupportedRuntime() {
  if (Platform.OS !== "android") {
    return false;
  }

  // Expo Go does not support the notifications APIs used here.
  return Constants.appOwnership !== "expo";
}

async function getNotificationsModule(): Promise<NotificationsModule | null> {
  if (!isSupportedRuntime()) {
    return null;
  }

  try {
    const notifications = await import("expo-notifications");
    return notifications;
  } catch {
    return null;
  }
}

async function ensureConfigured() {
  if (configured) {
    return;
  }

  const Notifications = await getNotificationsModule();
  if (!Notifications) {
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
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
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
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
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
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return;
  }

  if (activeNotificationId) {
    await Notifications.dismissNotificationAsync(activeNotificationId);
    activeNotificationId = null;
  }
}
