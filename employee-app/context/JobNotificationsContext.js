import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import api from '../services/api';
import { handleEmployeeNotificationResponse } from '../navigation/navigationRef';
import { registerPushTokenWithBackend } from '../services/pushNotifications';

const JobNotificationsContext = createContext(null);

const SEEN_JOBS_KEY = '@woosh/employee/seenIncomingJobIds';
const POLL_INTERVAL_MS = 60 * 1000;

async function loadSeenJobIds() {
  try {
    const raw = await AsyncStorage.getItem(SEEN_JOBS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

async function saveSeenJobIds(ids) {
  try {
    await AsyncStorage.setItem(SEEN_JOBS_KEY, JSON.stringify([...new Set(ids.map(String))]));
  } catch {
    // ignore
  }
}

async function updateBadge(count) {
  try {
    await Notifications.setBadgeCountAsync(Math.max(0, count));
  } catch {
    // ignore
  }
}

export function JobNotificationsProvider({ children, employeeId }) {
  const [incomingCount, setIncomingCount] = useState(0);
  const seenJobIdsRef = useRef([]);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!employeeId) {
      seenJobIdsRef.current = [];
      setIncomingCount(0);
      updateBadge(0);
      return;
    }
    loadSeenJobIds().then((ids) => {
      seenJobIdsRef.current = ids;
    });
  }, [employeeId]);

  useEffect(() => {
    if (!employeeId) return;
    let mounted = true;
    (async () => {
      try {
        const result = await registerPushTokenWithBackend();
        if (!mounted) return;
        if (!result.ok && __DEV__) {
          console.warn('[Push] Employee registration:', result.reason);
        }
      } catch (err) {
        console.warn('Push token registration failed:', err?.message);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [employeeId]);

  /** Update badge/count only — job alerts come from server push. */
  const refreshJobCount = useCallback(async () => {
    if (!employeeId) return;
    try {
      const res = await api.get(`/jobs/incoming?employeeId=${employeeId}`);
      const data = res.data?.data || [];
      const count = res.data?.count ?? data.length;
      setIncomingCount(count);
      await updateBadge(count);

      const incomingIds = data.map((o) => String(o._id || o.id)).filter(Boolean);
      const seen = new Set(seenJobIdsRef.current);
      const newIds = incomingIds.filter((id) => !seen.has(id));

      if (newIds.length > 0) {
        const merged = [...seenJobIdsRef.current, ...newIds];
        seenJobIdsRef.current = merged;
        await saveSeenJobIds(merged);
      }

      if (count === 0 && incomingIds.length === 0) {
        seenJobIdsRef.current = [];
        await saveSeenJobIds([]);
      }
    } catch (err) {
      console.error('Job count refresh failed:', err);
    }
  }, [employeeId]);

  useEffect(() => {
    if (employeeId) {
      refreshJobCount();
    } else {
      setIncomingCount(0);
      updateBadge(0);
    }
  }, [employeeId, refreshJobCount]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        if (employeeId) {
          registerPushTokenWithBackend().catch(() => {});
        }
        refreshJobCount();
      }
      appState.current = nextState;
    });
    return () => sub?.remove();
  }, [employeeId, refreshJobCount]);

  useEffect(() => {
    if (!employeeId) return;
    const interval = setInterval(refreshJobCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [employeeId, refreshJobCount]);

  useEffect(() => {
    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification?.request?.content?.data;
      if (data?.type === 'new_job' && data?.orderId) {
        const id = String(data.orderId);
        if (!seenJobIdsRef.current.includes(id)) {
          seenJobIdsRef.current = [...seenJobIdsRef.current, id];
          saveSeenJobIds(seenJobIdsRef.current);
        }
      }
      refreshJobCount();
    });
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response?.notification?.request?.content?.data;
      handleEmployeeNotificationResponse(data);
    });
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const respondedAt = response?.notification?.date;
      const ageMs = respondedAt ? Date.now() - respondedAt * 1000 : Infinity;
      if (ageMs > 15000) return;
      const data = response?.notification?.request?.content?.data;
      handleEmployeeNotificationResponse(data);
    }).catch(() => {});
    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [refreshJobCount]);

  return (
    <JobNotificationsContext.Provider value={{ incomingCount, refreshJobCount }}>
      {children}
    </JobNotificationsContext.Provider>
  );
}

export function useJobNotifications() {
  const ctx = useContext(JobNotificationsContext);
  if (!ctx) throw new Error('useJobNotifications must be used within JobNotificationsProvider');
  return ctx;
}
