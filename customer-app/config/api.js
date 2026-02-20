import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Base URL - Automatically detects platform
// For Android emulator: uses 'http://10.0.2.2:8000' (special IP for emulator)
// For iOS simulator: uses 'http://localhost:8000'
// For physical device: use your computer's IP (e.g., 'http://192.168.1.22:8000')

// Your computer's IP address
// Find it with: ipconfig getifaddr en0 (Mac) or ipconfig (Windows)
// Update this if your IP changes!
const COMPUTER_IP = '192.168.1.15';

// Determine the correct base URL based on platform
const getBaseURL = () => {
  if (!__DEV__) {
    // Production
    return 'https://car-wash-vbry.onrender.com/api';
  }

  // Development - Platform specific
  if (Platform.OS === 'android') {
    // Android emulator: use 10.0.2.2, Physical device: use computer's IP
    // Change to 'http://10.0.2.2:8000/api' if using Android emulator
    return `http://${COMPUTER_IP}:8000/api`;
  } else if (Platform.OS === 'ios') {
    // iOS simulator can use localhost
    return 'http://localhost:8000/api';
  } else {
    // Web or other platforms
    return 'http://localhost:8000/api';
  }
};

const API_BASE_URL = getBaseURL();

// Log the API URL for debugging (only in development)
if (__DEV__) {
  console.log(`🌐 API Base URL: ${API_BASE_URL} (Platform: ${Platform.OS})`);
}

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (for adding auth tokens)
api.interceptors.request.use(
  async (config) => {
    // Add auth token if available
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor (for error handling)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Handle common errors
    if (error.response) {
      // Server responded with error
      console.error('API Error:', error.response.data);
      
      // If unauthorized (401), clear the token
      if (error.response.status === 401) {
        try {
          await AsyncStorage.multiRemove(['authToken', 'authPhone', 'authName']);
          console.log('Token cleared due to 401 error');
        } catch (storageError) {
          console.error('Error clearing storage:', storageError);
        }
      }
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error:', error.request);
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
