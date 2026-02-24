import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './config/api';

export const LOCATION_TASK_NAME = 'employee-live-location';
const ACTIVE_ORDER_ID_KEY = 'activeOrderId';
const ACTIVE_EMPLOYEE_ID_KEY = 'activeEmployeeId';
const LOCATION_REQUEST_TIMEOUT_MS = 15000;
const MAX_RETRIES = 2;

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
    if (!res.ok && retriesLeft > 0) {
      await new Promise((r) => setTimeout(r, 1000));
      return sendLocationWithRetry(url, body, token, retriesLeft - 1);
    }
    return res;
  } catch (err) {
    clearTimeout(timeoutId);
    if (retriesLeft > 0) {
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
      ? `${API_BASE_URL}/orders/${orderId}/employee-location?employeeId=${employeeId}`
      : `${API_BASE_URL}/orders/${orderId}/employee-location`;
    await sendLocationWithRetry(url, { latitude, longitude }, token);
  } catch (err) {
    console.error('Failed to send background location:', err);
  }
});

export const saveActiveOrderId = async (orderId, employeeId) => {
  if (!orderId) return;
  await AsyncStorage.setItem(ACTIVE_ORDER_ID_KEY, orderId);
  if (employeeId) {
    await AsyncStorage.setItem(ACTIVE_EMPLOYEE_ID_KEY, employeeId);
  }
};

export const clearActiveOrderId = async () => {
  await AsyncStorage.multiRemove([ACTIVE_ORDER_ID_KEY, ACTIVE_EMPLOYEE_ID_KEY]);
};

export const startBackgroundLocationUpdates = async () => {
  const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  if (hasStarted) return;
  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 20000,
    distanceInterval: 20,
    foregroundService: {
      notificationTitle: 'Woosh service active',
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
