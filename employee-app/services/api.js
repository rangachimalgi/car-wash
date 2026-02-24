import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, COMPUTER_IP } from '../config/api';

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
      const isTimeoutOrNetwork = !error.response && (error.code === 'ECONNABORTED' || error.message === 'Network Error');
      if (isTimeoutOrNetwork || (errorMessage && errorMessage.includes('unreachable'))) {
        console.error('⚠️ Cannot reach backend. Check:');
        console.error(`   1. Backend is running: npm start (port 8000)`);
        console.error(`   2. Android Emulator? Set USE_ANDROID_EMULATOR = true in config/api.js`);
        console.error(`   3. Physical device? Set COMPUTER_IP = 'YOUR_IP' in config/api.js (current: ${COMPUTER_IP})`);
        console.error(`   4. Device and computer on same WiFi`);
        console.error(`   API URL: ${API_BASE_URL}`);
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
