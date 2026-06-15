import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

export const NOTIFICATION_CHANNEL_ID = 'woosh_urgent';

let configured = false;

async function ensureUrgentChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
    name: 'Woosh job alerts',
    description: 'New jobs and assignment updates',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 300, 150, 300],
    lightColor: '#2563EB',
    sound: 'default',
    enableVibrate: true,
    showBadge: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: false,
  }).catch(() => {});
}

export function configureNotificationPresentation() {
  if (configured) return;
  configured = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  ensureUrgentChannel();
}

export async function ensureNotificationPermissionsAsync() {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === 'granted') {
    await ensureUrgentChannel();
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });
  if (requested.status === 'granted') {
    await ensureUrgentChannel();
  }
  return requested.status === 'granted';
}

export async function presentLocalNotification(title, body, data = {}) {
  const granted = await ensureNotificationPermissionsAsync();
  if (!granted) return false;

  configureNotificationPresentation();

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.MAX,
      ...(Platform.OS === 'android' ? { channelId: NOTIFICATION_CHANNEL_ID } : {}),
    },
    trigger: null,
  });
  return true;
}
