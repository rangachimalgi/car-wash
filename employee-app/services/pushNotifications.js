import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import {
  configureNotificationPresentation,
  ensureNotificationPermissionsAsync,
} from './notificationSetup';

function isValidExpoToken(token) {
  const t = (token || '').toString().trim();
  return t.startsWith('ExponentPushToken[') || t.startsWith('ExpoPushToken[');
}

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web') return { token: null, error: 'web' };

  configureNotificationPresentation();
  const granted = await ensureNotificationPermissionsAsync();
  if (!granted) {
    if (__DEV__) console.warn('[Push] Notification permission not granted');
    return { token: null, error: 'permission_denied' };
  }

  try {
    const projectId = require('../app.json').expo?.extra?.eas?.projectId;
    const tokenResult = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const token = tokenResult?.data ?? null;
    if (__DEV__ && token) console.log('[Push] Expo token (copy for expo.dev/notifications):\n', token);
    if (isValidExpoToken(token)) return { token, error: null };
    return { token: null, error: 'invalid_token' };
  } catch (e) {
    const msg = e?.message || String(e);
    if (/FirebaseApp|FCM|fcm-credentials/i.test(msg)) {
      console.warn(
        '[Push] Android FCM not set up. Download google-services.json from Firebase ' +
          '(package: com.anonymous.employeeapp) → employee-app/google-services.json, ' +
          'then run: npx expo prebuild --clean && npx expo run:android'
      );
      return { token: null, error: 'fcm_not_configured' };
    }
    console.warn('[Push] getExpoPushTokenAsync failed:', msg);
    return { token: null, error: msg };
  }
}

/**
 * Register Expo push token with backend. Call after login once auth token is in AsyncStorage.
 * @returns {{ ok: boolean, token?: string, reason?: string }}
 */
const LAST_SAVED_PUSH_TOKEN_KEY = '@woosh/employee/lastSavedPushToken';
let registerInFlight = null;

export async function registerPushTokenWithBackend() {
  if (registerInFlight) return registerInFlight;

  registerInFlight = (async () => {
    let { token, error } = await registerForPushNotificationsAsync();
    if (!token) {
      await new Promise((r) => setTimeout(r, 1500));
      ({ token, error } = await registerForPushNotificationsAsync());
    }
    if (!token) {
      if (__DEV__) {
        const hint =
          error === 'fcm_not_configured'
            ? 'Add google-services.json and rebuild the native app'
            : error === 'permission_denied'
              ? 'Allow notifications in system Settings'
              : error || 'unknown';
        console.log('[Push] No token —', hint);
      }
      return { ok: false, reason: error || 'no_token' };
    }

    try {
      const lastSaved = await AsyncStorage.getItem(LAST_SAVED_PUSH_TOKEN_KEY);
      if (lastSaved === token) {
        return { ok: true, token, skipped: true };
      }

      const res = await api.put('/employees/me/push-token', { pushToken: token });
      if (res.data?.success) {
        await AsyncStorage.setItem(LAST_SAVED_PUSH_TOKEN_KEY, token);
        if (__DEV__) console.log('[Push] Token saved to backend');
        return { ok: true, token };
      }
      return { ok: false, reason: res.data?.message || 'save_failed' };
    } catch (e) {
      const msg = e.response?.data?.message || e.message || 'network_error';
      console.warn('[Push] Failed to save token:', msg, e.response?.status);
      return { ok: false, reason: msg };
    }
  })();

  try {
    return await registerInFlight;
  } finally {
    registerInFlight = null;
  }
}
