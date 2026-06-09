import { AppState } from 'react-native';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './config/api';
import api from './services/api';

export const LOCATION_TASK_NAME = 'employee-live-location';
const ACTIVE_ORDER_ID_KEY = 'activeOrderId';
const ACTIVE_EMPLOYEE_ID_KEY = 'activeEmployeeId';
const LOCATION_REQUEST_TIMEOUT_MS = 15000;
const MAX_RETRIES = 2;

let foregroundIntervalId = null;
let appStateSubscription = null;
let activeOrderId = null;
let activeEmployeeId = null;

async function sendLocationWithRetry(url, body, token, retriesLeft = MAX_RETRIES) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LOCATION_REQUEST_TIMEOUT_MS);
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      if (retriesLeft > 0) {
        await new Promise((r) => setTimeout(r, 1000));
        return sendLocationWithRetry(url, body, token, retriesLeft - 1);
      }
      let message = `HTTP ${res.status}`;
      try {
        const data = await res.json();
        message = data?.message || message;
      } catch {
        // ignore parse errors
      }
      throw new Error(message);
    }
    return res;
  } catch (err) {
    clearTimeout(timeoutId);
    if (retriesLeft > 0 && err.name !== 'AbortError') {
      await new Promise((r) => setTimeout(r, 1000));
      return sendLocationWithRetry(url, body, token, retriesLeft - 1);
    }
    throw err;
  }
}

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Location task error:', error);
    return;
  }

  const locations = data?.locations;
  if (!locations || locations.length === 0) return;
  const latest = locations[locations.length - 1];
  const latitude = latest?.coords?.latitude;
  const longitude = latest?.coords?.longitude;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return;

  try {
    const [orderId, employeeId, token] = await Promise.all([
      AsyncStorage.getItem(ACTIVE_ORDER_ID_KEY),
      AsyncStorage.getItem(ACTIVE_EMPLOYEE_ID_KEY),
      AsyncStorage.getItem('employeeAuthToken'),
    ]);
    if (!orderId) return;
    const url = employeeId
      ? `${API_BASE_URL}/orders/${orderId}/employee-location?employeeId=${encodeURIComponent(employeeId)}`
      : `${API_BASE_URL}/orders/${orderId}/employee-location`;
    await sendLocationWithRetry(url, { latitude, longitude }, token);
  } catch (err) {
    console.error('Failed to send background location:', err);
  }
});

export const saveActiveOrderId = async (orderId, employeeId) => {
  if (!orderId) return;
  activeOrderId = String(orderId);
  activeEmployeeId = employeeId ? String(employeeId) : null;
  await AsyncStorage.setItem(ACTIVE_ORDER_ID_KEY, activeOrderId);
  if (employeeId) {
    await AsyncStorage.setItem(ACTIVE_EMPLOYEE_ID_KEY, String(employeeId));
  }
};

export const clearActiveOrderId = async () => {
  activeOrderId = null;
  activeEmployeeId = null;
  await AsyncStorage.multiRemove([ACTIVE_ORDER_ID_KEY, ACTIVE_EMPLOYEE_ID_KEY]);
};

export const startBackgroundLocationUpdates = async () => {
  const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  if (hasStarted) return;
  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 15000,
    distanceInterval: 15,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'Woosh — on the way',
      notificationBody: 'Sharing your location with the customer.',
    },
    pausesUpdatesAutomatically: false,
  });
};

export const stopBackgroundLocationUpdates = async () => {
  const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  if (!hasStarted) return;
  await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
};

function clearForegroundTracking() {
  if (foregroundIntervalId) {
    clearInterval(foregroundIntervalId);
    foregroundIntervalId = null;
  }
  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }
}

async function sendEmployeeLocation(orderId, employeeId) {
  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
    mayShowUserSettingsDialog: true,
  });
  const { latitude, longitude } = position.coords || {};
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    throw new Error('Could not read GPS coordinates');
  }

  const url = employeeId
    ? `/orders/${orderId}/employee-location?employeeId=${encodeURIComponent(employeeId)}`
    : `/orders/${orderId}/employee-location`;
  const res = await api.patch(url, { latitude, longitude });
  if (!res.data?.success) {
    throw new Error(res.data?.message || 'Failed to share location with customer');
  }
}

export const isEmployeeLocationSharingActive = (orderId) =>
  Boolean(
    foregroundIntervalId &&
      activeOrderId &&
      String(activeOrderId) === String(orderId)
  );

/** Start sharing live location with the customer for a job (foreground + background). */
export const startEmployeeLocationSharing = async (orderId, employeeId) => {
  if (!orderId) {
    return { ok: false, error: 'Missing job id' };
  }
  if (!employeeId) {
    return { ok: false, error: 'Missing employee id' };
  }

  const orderKey = String(orderId);
  const employeeKey = String(employeeId);

  if (isEmployeeLocationSharingActive(orderKey)) {
    return { ok: true, alreadyActive: true };
  }

  const { status: existing } = await Location.getForegroundPermissionsAsync();
  const { status } =
    existing === 'granted'
      ? { status: existing }
      : await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    return { ok: false, error: 'Location permission denied' };
  }

  clearForegroundTracking();
  await saveActiveOrderId(orderKey, employeeKey);

  try {
    await sendEmployeeLocation(orderKey, employeeKey);
  } catch (err) {
    console.error('Error sending initial employee location:', err);
    await clearActiveOrderId();
    return { ok: false, error: err.message || 'Failed to share location' };
  }

  foregroundIntervalId = setInterval(() => {
    if (!activeOrderId) return;
    sendEmployeeLocation(activeOrderId, activeEmployeeId).catch((error) => {
      console.error('Error updating live location:', error);
    });
  }, 15000);

  appStateSubscription = AppState.addEventListener('change', (nextState) => {
    if (nextState === 'active' && activeOrderId) {
      sendEmployeeLocation(activeOrderId, activeEmployeeId).catch((error) => {
        console.error('Error sending location on resume:', error);
      });
    }
  });

  try {
    const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
    if (bgStatus === 'granted') {
      await startBackgroundLocationUpdates();
    }
  } catch (err) {
    console.error('Error starting background location tracking:', err);
  }

  return { ok: true };
};

/** Stop all live location sharing for the active job. */
export const stopEmployeeLocationSharing = async () => {
  clearForegroundTracking();
  await stopBackgroundLocationUpdates();
  await clearActiveOrderId();
};
