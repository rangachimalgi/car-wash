import React, { useMemo, useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useCustomerNotifications } from '../context/CustomerNotificationsContext';
import { handleCustomerNotificationResponse } from '../navigation/navigationRef';
import { ensureNotificationPermissionsAsync } from '../services/notificationSetup';

function formatWhen(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const diffMs = now - d;
  if (diffMs < 60 * 1000) return 'Just now';
  if (diffMs < 60 * 60 * 1000) return `${Math.floor(diffMs / 60000)}m ago`;
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isLightMode } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { history, unreadCount, refreshHistory, markAllRead, registerPush } = useCustomerNotifications();
  const [permissionGranted, setPermissionGranted] = useState(true);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const { status } = await Notifications.getPermissionsAsync();
        setPermissionGranted(status === 'granted');
        if (status !== 'granted') {
          const granted = await ensureNotificationPermissionsAsync();
          setPermissionGranted(granted);
        }
        await registerPush();
      })().catch(() => {});
      refreshHistory();
      markAllRead();
    }, [registerPush, refreshHistory, markAllRead])
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style={isLightMode ? 'dark' : 'light'} />
      <View style={styles.headerRow}>
        <Text style={styles.title}>Rate reminders</Text>
        {unreadCount > 0 ? (
          <View style={styles.unreadPill}>
            <Text style={styles.unreadText}>{unreadCount} new</Text>
          </View>
        ) : null}
      </View>
      {!permissionGranted ? (
        <TouchableOpacity
          style={styles.permissionBanner}
          activeOpacity={0.85}
          onPress={() => Linking.openSettings()}
        >
          <MaterialCommunityIcons name="bell-off-outline" size={20} color="#B45309" />
          <Text style={styles.permissionText}>
            Pop-up alerts are off. Tap to open Settings and enable notifications for Woosh.
          </Text>
        </TouchableOpacity>
      ) : null}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {history.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons name="bell-outline" size={56} color={theme.textSecondary} />
            </View>
            <Text style={styles.emptyTitle}>No rate reminders</Text>
            <Text style={styles.emptyHint}>
              After your wash is done, we'll remind you here to rate your service. Other updates (on the way, started, completed) still pop up on your phone.
            </Text>
          </View>
        ) : (
          history.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.card, !item.read && styles.cardUnread]}
              activeOpacity={0.85}
              onPress={() => handleCustomerNotificationResponse(item.data)}
            >
              <View style={styles.cardIcon}>
                <MaterialCommunityIcons name="star-outline" size={20} color={theme.accent} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {item.body ? <Text style={styles.cardBodyText}>{item.body}</Text> : null}
                <Text style={styles.cardWhen}>{formatWhen(item.at)}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
    },
    title: {
      fontSize: 24,
      fontWeight: '800',
      color: theme.textPrimary,
    },
    unreadPill: {
      backgroundColor: theme.cardBackground,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },
    unreadText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.accent,
    },
    permissionBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginHorizontal: 20,
      marginBottom: 8,
      padding: 12,
      borderRadius: 12,
      backgroundColor: '#FFFBEB',
      borderWidth: 1,
      borderColor: '#FDE68A',
    },
    permissionText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 18,
      color: '#92400E',
      fontWeight: '600',
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 8,
    },
    emptyWrap: {
      alignItems: 'center',
      paddingVertical: 48,
      paddingHorizontal: 24,
    },
    iconWrap: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: theme.cardBackground,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.textPrimary,
      marginBottom: 8,
    },
    emptyHint: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: theme.cardBackground,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      padding: 14,
      marginBottom: 10,
    },
    cardUnread: {
      borderColor: theme.accent,
    },
    cardIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: theme.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardBody: {
      flex: 1,
      gap: 2,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    cardBodyText: {
      fontSize: 13,
      color: theme.textSecondary,
      lineHeight: 18,
    },
    cardWhen: {
      fontSize: 11,
      color: theme.textSecondary,
      marginTop: 4,
    },
  });
