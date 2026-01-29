import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './config/api';

export const LOCATION_TASK_NAME = 'employee-live-location';
const ACTIVE_ORDER_ID_KEY = 'activeOrderId';

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
    const orderId = await AsyncStorage.getItem(ACTIVE_ORDER_ID_KEY);
    if (!orderId) return;
    await fetch(`${API_BASE_URL}/orders/${orderId}/employee-location`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude, longitude }),
    });
  } catch (err) {
    console.error('Failed to send background location:', err);
  }
});

export const saveActiveOrderId = async (orderId) => {
  if (!orderId) return;
  await AsyncStorage.setItem(ACTIVE_ORDER_ID_KEY, orderId);
};

export const clearActiveOrderId = async () => {
  await AsyncStorage.removeItem(ACTIVE_ORDER_ID_KEY);
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
