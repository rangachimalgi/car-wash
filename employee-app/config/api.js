import { Platform } from 'react-native';

// Single source of truth for dev API host. Use your machine's LAN IP for physical devices.
// Find it: Mac/Linux `ipconfig getifaddr en0`, Windows `ipconfig`. For iOS simulator, 127.0.0.1 works.
const COMPUTER_IP = '192.168.1.18';

// Set true when using Android Emulator (uses 10.0.2.2 to reach host)
const USE_ANDROID_EMULATOR = false;

const getBaseURL = () => {
  if (!__DEV__) {
    return 'https://car-wash-vbry.onrender.com/api';
  }

  if (Platform.OS === 'android') {
    if (USE_ANDROID_EMULATOR) {
      return 'http://10.0.2.2:8000/api';
    }
    return `http://${COMPUTER_IP}:8000/api`;
  }

  // iOS: use COMPUTER_IP so physical device can reach backend; simulator can use same if port-forwarded
  return `http://${COMPUTER_IP}:8000/api`;
};

export const API_BASE_URL = getBaseURL();
export { COMPUTER_IP };
