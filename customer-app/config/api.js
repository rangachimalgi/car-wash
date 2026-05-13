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

const emptyMedia = () => ({
  testimonials: [],
  transformations: [],
  seeTheDifference: [],
  homeSliders: [],
});

/** Raw URL string from a media row (backend uses `url`; tolerate odd shapes). */
const pickMediaUrl = (m) => {
  if (!m || typeof m !== 'object') return '';
  const raw = m.url ?? m.URL ?? m.src ?? m.href ?? m.image ?? '';
  const s = String(raw).trim();
  return s;
};

/** Unwrap { success, data: { ... } } or a flat payload. */
const unwrapPublicMediaBody = (payload) => {
  if (!payload || typeof payload !== 'object') return null;
  if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    return payload.data;
  }
  if (
    Array.isArray(payload.testimonials) ||
    Array.isArray(payload.homeSliders) ||
    Array.isArray(payload.home_sliders)
  ) {
    return payload;
  }
  return null;
};

const pickHomeSliderList = (d) => {
  if (!d || typeof d !== 'object') return [];
  const cands = [d.homeSliders, d.home_sliders, d.homeSlider, d.home_slider];
  for (const v of cands) {
    if (Array.isArray(v)) return v;
  }
  return [];
};

/**
 * Public media: use `fetch` without Authorization so a stale/invalid JWT can never
 * affect this read. Same URL as axios `api` base + `/media/public`.
 */
export const getMedia = async () => {
  const base = API_BASE_URL.replace(/\/$/, '');
  const url = `${base}/media/public?_t=${Date.now()}`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 25000);
  let res;
  try {
    res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });
  } catch {
    return emptyMedia();
  } finally {
    clearTimeout(t);
  }

  if (!res.ok) {
    return emptyMedia();
  }

  const text = await res.text().catch(() => '');
  let payload;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    return emptyMedia();
  }

  const d = unwrapPublicMediaBody(payload);
  if (!d) return emptyMedia();

  const withResolvedUrl = (m) => {
    const raw = pickMediaUrl(m);
    return { ...m, url: raw ? resolveAssetUrl(raw) : null };
  };

  const homeSlidersRaw = pickHomeSliderList(d);

  return {
    testimonials: (Array.isArray(d.testimonials) ? d.testimonials : []).map(withResolvedUrl),
    transformations: (Array.isArray(d.transformations) ? d.transformations : []).map(withResolvedUrl),
    seeTheDifference: (Array.isArray(d.seeTheDifference) ? d.seeTheDifference : []).map(withResolvedUrl),
    homeSliders: homeSlidersRaw.map(withResolvedUrl),
  };
};

export default api;
