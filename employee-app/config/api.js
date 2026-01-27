import { Platform } from 'react-native';

const COMPUTER_IP = '192.168.29.174';

const getBaseURL = () => {
  if (!__DEV__) {
    return 'https://car-wash-vbry.onrender.com/api';
  }

  if (Platform.OS === 'android') {
    return `http://${COMPUTER_IP}:8000/api`;
  }

  return 'http://localhost:8000/api';
};

export const API_BASE_URL = getBaseURL();
