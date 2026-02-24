import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import api from '../config/api';

/**
 * Register for push notifications and return Expo push token.
 * Returns null on web or if permission denied.
 */
export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Woosh',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    }).catch(() => {});
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  try {
    const projectId = require('../app.json').expo?.extra?.eas?.projectId;
    const tokenResult = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const token = tokenResult?.data ?? null;
    if (__DEV__ && token) console.log('[Push] Expo token obtained');
    return token;
  } catch (e) {
    console.warn('Error getting push token:', e);
    return null;
  }
}

/**
 * Register for push, get token, and send to backend so customer can receive start-service OTP.
 * Call after login and on app open when user is logged in.
 */
export async function registerPushTokenWithBackend() {
  const token = await registerForPushNotificationsAsync();
  if (!token) {
    if (__DEV__) console.log('[Push] No token (permission denied or web)');
    return;
  }
  try {
    await api.put('/users/me/push-token', { expoPushToken: token });
    if (__DEV__) console.log('[Push] Token saved to backend');
  } catch (e) {
    console.warn('Failed to save push token:', e);
  }
}
