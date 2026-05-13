import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// API Base URL — port must match your local API (e.g. `PORT=8000` or `node` on 8000).
// Backend `server.js` defaults to 5000 if PORT is unset; this app defaults to 8000 for local dev.
//
// Optional: set in `.env`:
//   EXPO_PUBLIC_API_BASE_URL=http://192.168.1.18:8000/api
//   EXPO_PUBLIC_API_PORT=5000   (if you use the server default instead)
//
// Android emulator: set EXPO_PUBLIC_ANDROID_API_HOST=10.0.2.2 (maps host → your machine).
const COMPUTER_IP = '192.168.1.18';
const DEV_API_PORT = process.env.EXPO_PUBLIC_API_PORT || '8000';
const ANDROID_API_HOST = process.env.EXPO_PUBLIC_ANDROID_API_HOST || COMPUTER_IP;

const normalizeApiBase = (raw) => {
  const u = String(raw || '').trim().replace(/\/$/, '');
  if (!u) return null;
  return u.endsWith('/api') ? u : `${u}/api`;
};

// Determine the correct base URL based on platform
const getBaseURL = () => {
  const fromEnv = normalizeApiBase(process.env.EXPO_PUBLIC_API_BASE_URL);
  if (fromEnv) return fromEnv;

  if (!__DEV__) {
    return 'https://car-wash-vbry.onrender.com/api';
  }

  if (Platform.OS === 'android') {
    return `http://${ANDROID_API_HOST}:${DEV_API_PORT}/api`;
  }
  if (Platform.OS === 'ios') {
    // Simulator: localhost. Physical device: same LAN host as Android (localhost would be the phone).
    if (!Constants.isDevice) {
      return `http://localhost:${DEV_API_PORT}/api`;
    }
    return `http://${COMPUTER_IP}:${DEV_API_PORT}/api`;
  }
  return `http://localhost:${DEV_API_PORT}/api`;
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
          await AsyncStorage.multiRemove(['authToken', 'authPhone', 'authName', 'userId']);
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

export const getUploadsBase = () => API_BASE_URL.replace(/\/api\/?$/, '');

/**
 * Backend stores relative paths (e.g. "/uploads/services/foo.jpg"). React Native Image
 * requires an absolute URL. Already-absolute URLs are returned unchanged.
 */
export const resolveAssetUrl = (path) => {
  if (path == null || path === '') return '';
  let s = String(path).trim();
  if (!s) return '';

  // Undo accidental glue: https://api…comhttps://cdn…/file (e.g. old admin concat)
  for (let i = 0; i < 4; i++) {
    const m = s.match(/^(https?:\/\/[^/]+)(?=https:\/\/)/i);
    if (!m) break;
    s = s.slice(m[1].length);
  }

  if (/^https\/\//i.test(s)) s = `https://${s.slice('https//'.length)}`;
  if (/^http\/\//i.test(s)) s = `http://${s.slice('http//'.length)}`;

  if (/^https?:\/\//i.test(s)) return s;
  const base = getUploadsBase().replace(/\/$/, '');
  const p = s.startsWith('/') ? s : `/${s}`;
  return `${base}${p}`;
};

export const getMedia = async () => {
  // Public media payload is small, but video URLs may point at cold R2 edges; allow a longer read than default 10s.
  const { data } = await api.get('/media/public', { timeout: 25000 });
  if (!data?.success || !data.data) {
    return {
      testimonials: [],
      transformations: [],
      seeTheDifference: [],
      homeSliders: [],
    };
  }
  const d = data.data;
  const withResolvedUrl = (m) => ({ ...m, url: m.url ? resolveAssetUrl(m.url) : null });
  return {
    testimonials: (d.testimonials || []).map(withResolvedUrl),
    transformations: (d.transformations || []).map(withResolvedUrl),
    seeTheDifference: (d.seeTheDifference || []).map(withResolvedUrl),
    homeSliders: (d.homeSliders || []).map(withResolvedUrl),
  };
};

export default api;
