import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import api from '../services/api';

const JobNotificationsContext = createContext(null);

// Show alert when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function JobNotificationsProvider({ children, employeeId }) {
  const [incomingCount, setIncomingCount] = useState(0);
  const lastNotifiedCountRef = React.useRef(0);

  // Register push token with backend so server can send push when new job is assigned
  useEffect(() => {
    if (!employeeId) return;
    let mounted = true;
    (async () => {
      try {
        const { status: existing } = await Notifications.getPermissionsAsync();
        let final = existing;
        if (existing !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          final = status;
        }
        if (final !== 'granted' || !mounted) return;
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: require('../app.json').expo?.extra?.eas?.projectId ?? undefined,
        });
        const token = tokenData?.data;
        if (token) {
          await api.put('/employees/me/push-token', { pushToken: token });
        }
      } catch (err) {
        console.warn('Push token registration failed:', err?.message);
      }
    })();
    return () => { mounted = false; };
  }, [employeeId]);

  const refreshJobCount = useCallback(async () => {
    if (!employeeId) return;
    try {
      const res = await api.get(`/jobs/incoming?employeeId=${employeeId}`);
      const data = res.data?.data || [];
      const count = res.data?.count ?? data.length;

      const prevCount = lastNotifiedCountRef.current;
      setIncomingCount(count);

      // Notify when we have new jobs (count increased from what we last notified for)
      if (count > 0 && count > prevCount) {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === 'granted') {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'New job assigned',
              body: count === 1 ? 'You have 1 new job to review.' : `You have ${count} new jobs to review.`,
            },
            trigger: null,
          });
        }
        lastNotifiedCountRef.current = count;
      } else if (count === 0) {
        lastNotifiedCountRef.current = 0;
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
      lastNotifiedCountRef.current = 0;
    }
  }, [employeeId]);

  // Refresh when app comes to foreground so we catch new jobs and can show notification
  const appState = useRef(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        refreshJobCount();
      }
      appState.current = nextState;
    });
    return () => sub?.remove();
  }, [refreshJobCount]);

  // Poll every 90 seconds when app is active so badge and notifications update
  useEffect(() => {
    if (!employeeId) return;
    const interval = setInterval(refreshJobCount, 90 * 1000);
    return () => clearInterval(interval);
  }, [employeeId, refreshJobCount]);

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
