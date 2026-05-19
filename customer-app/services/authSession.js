import AsyncStorage from '@react-native-async-storage/async-storage';
import { cancelAllPendingApiRequests, clearAuthStorage } from '../config/api';

/** Returns true when both phone and token are present. */
export const isLoggedIn = async () => {
  const [token, phone] = await Promise.all([
    AsyncStorage.getItem('authToken'),
    AsyncStorage.getItem('authPhone'),
  ]);
  return Boolean(token && phone);
};

/** Cancel in-flight calls, then clear auth keys. */
export const logoutUser = async () => {
  cancelAllPendingApiRequests();
  await clearAuthStorage();
};

/** After async work, confirm session is still the same user (or any logged-in user). */
export const isSessionStillValid = async (expectedPhone) => {
  const [token, phone] = await Promise.all([
    AsyncStorage.getItem('authToken'),
    AsyncStorage.getItem('authPhone'),
  ]);
  if (!token || !phone) return false;
  if (expectedPhone && phone !== expectedPhone) return false;
  return true;
};
