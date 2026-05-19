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
// If the app hits a *local* API in __DEV__ but hero sliders live on production, they are merged automatically
// from the same host as release (opt out: EXPO_PUBLIC_DISABLE_PROD_MEDIA_MERGE=1). Override merge source:
//   EXPO_PUBLIC_MERGE_MEDIA_FROM_URL=https://YOUR-HOST/api/media/public
//
// Android emulator: host defaults to 10.0.2.2 (AVD → your machine). Override with EXPO_PUBLIC_ANDROID_API_HOST.
const COMPUTER_IP = '192.168.1.2';
const DEV_API_PORT = process.env.EXPO_PUBLIC_API_PORT || '8000';
const ANDROID_API_HOST = process.env.EXPO_PUBLIC_ANDROID_API_HOST || COMPUTER_IP;
/** Production API root (release build + dev hero-slider merge). */
const REMOTE_PRODUCTION_API_BASE = 'https://car-wash-vbry.onrender.com/api';

const normalizeApiBase = (raw) => {
  let u = String(raw || '').trim().replace(/\/$/, '');
  if (!u) return null;
  u = u.replace(/\/api\/api(?=\/|$)/i, '/api');
  return u.endsWith('/api') ? u : `${u}/api`;
};

// Determine the correct base URL based on platform
const getBaseURL = () => {
  const fromEnv = normalizeApiBase(process.env.EXPO_PUBLIC_API_BASE_URL);
  if (fromEnv) return fromEnv;

  if (!__DEV__) {
    return REMOTE_PRODUCTION_API_BASE;
  }

  if (Platform.OS === 'android') {
    // Emulator must use 10.0.2.2 to reach the dev machine; LAN IP does not work from AVD.
    const host =
      Constants.isDevice === false
        ? (String(process.env.EXPO_PUBLIC_ANDROID_API_HOST || '').trim() || '10.0.2.2')
        : ANDROID_API_HOST;
    return `http://${host}:${DEV_API_PORT}/api`;
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

const API_BASE_URL = normalizeApiBase(getBaseURL()) || getBaseURL();

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

const AUTH_STORAGE_KEYS = ['authToken', 'authPhone', 'authName', 'userId'];
const pendingAbortControllers = new Set();

/** Abort in-flight API calls (e.g. on logout) so unmount does not surface noisy network errors. */
export const cancelAllPendingApiRequests = () => {
  pendingAbortControllers.forEach((controller) => {
    try {
      controller.abort();
    } catch (_) {
      /* ignore */
    }
  });
  pendingAbortControllers.clear();
};

export const clearAuthStorage = async () => {
  await AsyncStorage.multiRemove(AUTH_STORAGE_KEYS);
};

const detachAbortController = (config) => {
  const controller = config?.__wooshAbortController;
  if (controller) pendingAbortControllers.delete(controller);
};

const isRequestCancelled = (error) => {
  if (typeof axios.isCancel === 'function' && axios.isCancel(error)) return true;
  if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') return true;
  const msg = String(error?.message || '').toLowerCase();
  return msg.includes('cancel') || msg.includes('aborted');
};

const requestTouchesPublicMedia = (config) => {
  const u = String(config.url || '');
  return u.includes('/media/public');
};

const touchesUserResource = (config) => {
  const u = String(config.url || '');
  return /^\/users\//i.test(u);
};

// Request interceptor (for adding auth tokens)
api.interceptors.request.use(
  async (config) => {
    const controller = new AbortController();
    if (config.signal) {
      if (config.signal.aborted) {
        controller.abort();
      } else {
        config.signal.addEventListener('abort', () => controller.abort(), { once: true });
      }
    }
    config.signal = controller.signal;
    config.__wooshAbortController = controller;
    pendingAbortControllers.add(controller);

    if (requestTouchesPublicMedia(config)) {
      delete config.headers.Authorization;
      return config;
    }
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else if (touchesUserResource(config)) {
        controller.abort();
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
    detachAbortController(response.config);
    return response;
  },
  async (error) => {
    detachAbortController(error.config);

    if (isRequestCancelled(error)) {
      return Promise.reject(error);
    }

    // Handle common errors
    if (error.response) {
      // Server responded with error
      console.error('API Error:', error.response.data);
      
      // If unauthorized (401), clear the token
      if (error.response.status === 401) {
        try {
          await clearAuthStorage();
          console.log('Token cleared due to 401 error');
        } catch (storageError) {
          console.error('Error clearing storage:', storageError);
        }
      }
    } else if (error.request) {
      // Request made but no response (skip when aborted during logout/navigation)
      if (!isRequestCancelled(error)) {
        console.error('Network Error:', error.request);
      }
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
  whyChooseUs: [],
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
    Array.isArray(payload.home_sliders) ||
    Array.isArray(payload.whyChooseUs)
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

const pickMediaList = (d, keys) => {
  if (!d || typeof d !== 'object') return [];
  for (const key of keys) {
    if (Array.isArray(d[key])) return d[key];
  }
  return [];
};

const buildPublicMediaFromPayload = (payload) => {
  const d = unwrapPublicMediaBody(payload);
  if (!d) return null;

  const withResolvedUrl = (m) => {
    const raw = pickMediaUrl(m);
    const posterRaw = String(m?.posterUrl ?? m?.poster ?? '').trim();
    return {
      ...m,
      url: raw ? resolveAssetUrl(raw) : null,
      posterUrl: posterRaw ? resolveAssetUrl(posterRaw) : null,
    };
  };

  const homeSlidersRaw = pickHomeSliderList(d);
  const seeTheDifferenceRaw = pickMediaList(d, [
    'seeTheDifference',
    'see_the_difference',
    'seeTheDiff',
  ]);

  return {
    testimonials: pickMediaList(d, ['testimonials']).map(withResolvedUrl),
    transformations: pickMediaList(d, ['transformations']).map(withResolvedUrl),
    seeTheDifference: seeTheDifferenceRaw.map(withResolvedUrl),
    homeSliders: homeSlidersRaw.map(withResolvedUrl),
    whyChooseUs: pickMediaList(d, ['whyChooseUs', 'why_choose_us']).map(withResolvedUrl),
  };
};

/** In dev, fill empty sections from production CDN URLs when the local API has no media rows. */
const mergeMissingPublicMedia = (primary, alt) => {
  if (!alt) return primary;
  const keys = ['testimonials', 'transformations', 'seeTheDifference', 'homeSliders', 'whyChooseUs'];
  const next = { ...primary };
  keys.forEach((key) => {
    const localRows = Array.isArray(primary[key]) ? primary[key] : [];
    const localWithUrl = localRows.filter((row) => row?.url && String(row.url).trim());
    const remoteRows = Array.isArray(alt[key]) ? alt[key] : [];
    if (localWithUrl.length === 0 && remoteRows.length > 0) {
      next[key] = remoteRows;
    }
  });
  return next;
};

const normalizeMergeMediaUrl = (raw) => {
  const u = String(raw || '').trim();
  if (!u) return '';
  if (/\/media\/public/i.test(u)) return u.replace(/\/$/, '');
  const base = u.replace(/\/$/, '');
  return `${base.endsWith('/api') ? base : `${base}/api`}/media/public`;
};

/**
 * Public media: same axios `api` instance as the rest of the app (no Bearer on `/media/public`).
 * Optional `EXPO_PUBLIC_MERGE_MEDIA_FROM_URL`: full `.../api/media/public` or API root — used only
 * to fill empty media sections when the primary API returns none (typical local API + prod admin).
 */
export const getMedia = async () => {
  let payload = null;
  try {
    const { data } = await api.get('/media/public', {
      params: { _t: Date.now() },
      timeout: 25000,
      headers: {
        Accept: 'application/json',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });
    payload = data;
  } catch {
    try {
      const url = `${API_BASE_URL.replace(/\/$/, '')}/media/public?_t=${Date.now()}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });
      if (res.ok) payload = await res.json();
    } catch {
      /* ignore */
    }
  }

  if (!payload || typeof payload !== 'object') return emptyMedia();
  let parsed = buildPublicMediaFromPayload(payload);
  if (!parsed) parsed = emptyMedia();

  const mergeFromEnv = normalizeMergeMediaUrl(process.env.EXPO_PUBLIC_MERGE_MEDIA_FROM_URL?.trim());
  let mergeUrl = mergeFromEnv;
  const mergeDisabled =
    process.env.EXPO_PUBLIC_DISABLE_PROD_MEDIA_MERGE === '1' ||
    process.env.EXPO_PUBLIC_DISABLE_PROD_MEDIA_MERGE === 'true';
  const prodHostname = new URL(REMOTE_PRODUCTION_API_BASE).hostname;
  const onLocalDevApi = __DEV__ && !mergeDisabled && !API_BASE_URL.includes(prodHostname);
  if (!mergeUrl && onLocalDevApi) {
    mergeUrl = `${REMOTE_PRODUCTION_API_BASE.replace(/\/$/, '')}/media/public`;
  }

  if (mergeUrl) {
    try {
      const sep = mergeUrl.includes('?') ? '&' : '?';
      const { data: alt } = await axios.get(`${mergeUrl}${sep}_t=${Date.now()}`, {
        timeout: 25000,
        headers: {
          Accept: 'application/json',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });
      const altParsed = buildPublicMediaFromPayload(alt);
      parsed = mergeMissingPublicMedia(parsed, altParsed);
    } catch {
      /* keep primary */
    }
  }

  return parsed;
};

/** Ask server to generate JPEG posters for videos missing posterUrl (runs ffmpeg on the backend). */
export const backfillMediaPosters = async () => {
  try {
    const { data } = await api.post('/media/backfill-posters', {}, { timeout: 120000 });
    return data;
  } catch {
    return null;
  }
};

export default api;
