import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_ID_KEY = 'userId';
const FALLBACK_PREFIX = 'guest';

/**
 * Returns the storage prefix for the current user (userId or 'guest').
 * Use this to scope address keys per user so addresses are not shared across users.
 */
export async function getAddressPrefix() {
  try {
    const userId = await AsyncStorage.getItem(USER_ID_KEY);
    return userId && userId.trim() ? userId.trim() : FALLBACK_PREFIX;
  } catch {
    return FALLBACK_PREFIX;
  }
}

export function getSavedAddressesKey(prefix) {
  return `savedAddresses_${prefix}`;
}

export function getCurrentAddressKey(prefix) {
  return `currentAddress_${prefix}`;
}

export function getCurrentLatKey(prefix) {
  return `currentLat_${prefix}`;
}

export function getCurrentLngKey(prefix) {
  return `currentLng_${prefix}`;
}

/**
 * Get all address-related keys for the current user. Resolve prefix first.
 */
export async function getAddressKeys() {
  const prefix = await getAddressPrefix();
  return {
    prefix,
    savedAddresses: getSavedAddressesKey(prefix),
    currentAddress: getCurrentAddressKey(prefix),
    currentLat: getCurrentLatKey(prefix),
    currentLng: getCurrentLngKey(prefix),
  };
}
