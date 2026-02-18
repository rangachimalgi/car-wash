import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your computer's IP address (for physical Android devices)
// Find it with: ipconfig getifaddr en0 (Mac) or ipconfig (Windows)
const COMPUTER_IP = '192.168.1.15';

// Set to true if using Android Emulator, false if using physical device
// Android Emulator uses special IP: 10.0.2.2 to reach host machine
const USE_ANDROID_EMULATOR = false; // Change to true if using Android emulator

const getBaseURL = () => {
  if (!__DEV__) {
    return 'https://car-wash-vbry.onrender.com/api';
  }

  if (Platform.OS === 'android') {
    // Android emulator: use 10.0.2.2, Physical device: use computer's IP
    if (USE_ANDROID_EMULATOR) {
      return 'http://10.0.2.2:8000/api';
    }
    return `http://${COMPUTER_IP}:8000/api`;
  }

  return 'http://localhost:8000/api';
};

const API_BASE_URL = getBaseURL();

// Log the API URL for debugging (only in development)
if (__DEV__) {
  console.log(`🌐 Employee API Base URL: ${API_BASE_URL} (Platform: ${Platform.OS})`);
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
      const token = await AsyncStorage.getItem('employeeAuthToken');
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
          await AsyncStorage.multiRemove(['employeeAuthToken', 'employeeId', 'employeeName']);
          console.log('Employee token cleared due to 401 error');
        } catch (storageError) {
          console.error('Error clearing storage:', storageError);
        }
      }
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error:', error.request);
      
      // Provide helpful error message for network issues
      const errorMessage = error.request._response || error.message;
      if (errorMessage && errorMessage.includes('unreachable')) {
        console.error('⚠️ Host unreachable. Check:');
        console.error(`   1. Backend server is running on port 8000`);
        console.error(`   2. Using Android Emulator? Set USE_ANDROID_EMULATOR = true in api.js`);
        console.error(`   3. Using physical device? Ensure IP ${COMPUTER_IP} is correct`);
        console.error(`   4. Both device and computer are on same WiFi network`);
        console.error(`   Current API URL: ${API_BASE_URL}`);
      }
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL };
