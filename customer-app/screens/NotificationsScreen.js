import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { registerPushTokenWithBackend } from '../services/pushNotifications';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isLightMode } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  useFocusEffect(
    useCallback(() => {
      registerPushTokenWithBackend().catch(() => {});
    }, [])
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style={isLightMode ? 'dark' : 'light'} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.emptyWrap}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name="bell-outline" size={56} color={theme.textSecondary} />
          </View>
          <Text style={styles.emptyTitle}>Notifications</Text>
          <Text style={styles.emptyHint}>
            When your service is about to start, you’ll get a push notification on your device with the OTP to share with the employee.
          </Text>
        </View>
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
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 16,
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
  });
