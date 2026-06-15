import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { getOrders } from '../services/orderApi';
import { registerPushTokenWithBackend } from '../services/pushNotifications';
import { handleCustomerNotificationResponse } from '../navigation/navigationRef';
import { normalizeOrderStatus } from '../utils/orderStatus';
import { ensureNotificationPermissionsAsync } from '../services/notificationSetup';

const CustomerNotificationsContext = createContext(null);

export const HISTORY_KEY = '@woosh/customer/notificationHistory';
const ORDER_STATE_KEY = '@woosh/customer/orderNotificationState';
/** Only these push types appear in the Alerts tab — all others still show as system notifications. */
const ALERTS_TAB_TYPES = new Set(['rate_service']);
const SYNC_INTERVAL_MS = 60 * 1000;

function isAlertsTabEntry(entry) {
  return ALERTS_TAB_TYPES.has(entry?.data?.type);
}

function countUnread(list) {
  return (Array.isArray(list) ? list : []).filter((item) => !item.read).length;
}

async function appendHistory(entry) {
  if (!isAlertsTabEntry(entry)) return null;
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const next = [{ id: `${Date.now()}`, ...entry, at: new Date().toISOString() }, ...(Array.isArray(list) ? list : [])];
    const trimmed = next.slice(0, 20);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
    return trimmed;
  } catch {
    return null;
  }
}

async function loadOrderState() {
  try {
    const raw = await AsyncStorage.getItem(ORDER_STATE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveOrderState(state) {
  try {
    await AsyncStorage.setItem(ORDER_STATE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function buildStateFromOrders(orders) {
  const next = {};
  for (const order of orders) {
    const id = String(order._id);
    const status = normalizeOrderStatus(order.status);
    next[id] = {
      onTheWay: Boolean(order.employeeLocation?.updatedAt),
      started: status === 'In Progress' || status === 'Completed',
      completed: status === 'Completed',
      ratePrompted: typeof order.rating === 'number' && order.rating >= 1,
      bookingConfirmed: true,
    };
  }
  return next;
}

export function CustomerNotificationsProvider({ children }) {
  const [history, setHistory] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const orderStateRef = useRef({});
  const appState = useRef(AppState.currentState);

  const isAuthenticated = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return Boolean(token);
    } catch {
      return false;
    }
  }, []);

  const refreshHistory = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const filtered = (Array.isArray(list) ? list : []).filter(isAlertsTabEntry);
      if (filtered.length !== list.length) {
        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
      }
      setHistory(filtered);
      setUnreadCount(countUnread(filtered));
    } catch {
      setHistory([]);
      setUnreadCount(0);
    }
  }, []);

  const registerPush = useCallback(async () => {
    try {
      await registerPushTokenWithBackend();
    } catch (err) {
      console.warn('Customer push registration failed:', err?.message);
    }
  }, []);

  /** Sync local state only — never show notifications from polling. */
  const syncOrderState = useCallback(async () => {
    if (!(await isAuthenticated())) return;
    try {
      const res = await getOrders();
      const orders = res?.data || [];
      orderStateRef.current = buildStateFromOrders(orders);
      await saveOrderState(orderStateRef.current);
    } catch (err) {
      console.error('Customer order sync failed:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    (async () => {
      if (!(await isAuthenticated())) {
        orderStateRef.current = {};
        setUnreadCount(0);
        return;
      }
      orderStateRef.current = await loadOrderState();
      await ensureNotificationPermissionsAsync();
      await registerPush();
      await refreshHistory();
      await syncOrderState();
    })();
  }, [isAuthenticated, registerPush, refreshHistory, syncOrderState]);

  useEffect(() => {
    let interval;
    (async () => {
      if (await isAuthenticated()) {
        interval = setInterval(syncOrderState, SYNC_INTERVAL_MS);
      }
    })();
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAuthenticated, syncOrderState]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        registerPush();
        syncOrderState();
        refreshHistory();
      }
      appState.current = nextState;
    });
    return () => sub?.remove();
  }, [registerPush, syncOrderState, refreshHistory]);

  useEffect(() => {
    const markFromPush = (data) => {
      const orderId = data?.orderId ? String(data.orderId) : '';
      if (!orderId) return;
      const snap = orderStateRef.current[orderId] || {};
      const type = data?.type;
      const patch = { ...snap };
      if (type === 'on_the_way') patch.onTheWay = true;
      if (type === 'service_starting' || type === 'service_started') patch.started = true;
      if (type === 'service_completed') patch.completed = true;
      if (type === 'rate_service') patch.ratePrompted = true;
      if (type === 'booking_confirmed') patch.bookingConfirmed = true;
      orderStateRef.current = { ...orderStateRef.current, [orderId]: patch };
      saveOrderState(orderStateRef.current);
    };

    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      const content = notification?.request?.content;
      const data = content?.data || {};
      markFromPush(data);
      if (content?.title && isAlertsTabEntry({ data })) {
        appendHistory({
          title: content.title,
          body: content.body || '',
          data,
          read: false,
        }).then((list) => {
          if (!list) return;
          setHistory(list);
          setUnreadCount(countUnread(list));
        });
      }
    });
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response?.notification?.request?.content?.data;
      handleCustomerNotificationResponse(data);
    });
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const respondedAt = response?.notification?.date;
      const ageMs = respondedAt ? Date.now() - respondedAt * 1000 : Infinity;
      if (ageMs > 15000) return;
      const data = response?.notification?.request?.content?.data;
      handleCustomerNotificationResponse(data);
    }).catch(() => {});
    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const updated = (Array.isArray(list) ? list : []).map((item) => ({ ...item, read: true }));
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      setHistory(updated);
      setUnreadCount(0);
      if (Platform.OS === 'ios') {
        Notifications.setBadgeCountAsync(0).catch(() => {});
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <CustomerNotificationsContext.Provider
      value={{
        history,
        unreadCount,
        refreshHistory,
        markAllRead,
        pollActiveOrders: syncOrderState,
        registerPush,
      }}
    >
      {children}
    </CustomerNotificationsContext.Provider>
  );
}

export function useCustomerNotifications() {
  const ctx = useContext(CustomerNotificationsContext);
  if (!ctx) {
    throw new Error('useCustomerNotifications must be used within CustomerNotificationsProvider');
  }
  return ctx;
}
