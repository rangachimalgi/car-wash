import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';

export default function BookingConfirmationScreen({ navigation, route }) {
  const { theme, isLightMode } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const toastAnim = useRef(new Animated.Value(0)).current;
  const [showToast, setShowToast] = useState(true);

  const orderId = route?.params?.orderId || '';
  const subtitle = route?.params?.subtitle || 'Your service has been booked successfully.';

  useEffect(() => {
    toastAnim.setValue(0);
    Animated.spring(toastAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 7,
      tension: 90,
    }).start();

    const hideTimer = setTimeout(() => {
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(() => setShowToast(false));
    }, 2200);

    return () => clearTimeout(hideTimer);
  }, [toastAnim]);

  const goHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style={isLightMode ? 'dark' : 'light'} />

      {showToast && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toastContainer,
            { top: insets.top + 12 },
            {
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-16, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.toastIconWrap}>
            <MaterialCommunityIcons name="check" size={22} color="#FFFFFF" />
          </View>
          <View style={styles.toastTextWrap}>
            <Text style={styles.toastTitle}>Booking confirmed</Text>
            {!!orderId && <Text style={styles.toastOrderId}>{orderId}</Text>}
            <Text style={styles.toastSubtitle}>{subtitle}</Text>
          </View>
        </Animated.View>
      )}

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="check-circle" size={70} color="#16A34A" />
        </View>
        <Text style={styles.title}>Yes, booking is confirmed!</Text>
        {!!orderId && <Text style={styles.orderText}>{orderId}</Text>}
        <Text style={styles.subtitle}>We will assign a professional and notify you shortly.</Text>

        <TouchableOpacity style={styles.homeButton} onPress={goHome} activeOpacity={0.85}>
          <Text style={styles.homeButtonText}>Go to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    iconWrap: {
      marginBottom: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: '800',
      color: theme.textPrimary,
      textAlign: 'center',
    },
    orderText: {
      marginTop: 10,
      fontSize: 14,
      fontWeight: '700',
      color: theme.primary,
    },
    subtitle: {
      marginTop: 10,
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      maxWidth: 320,
    },
    homeButton: {
      marginTop: 24,
      backgroundColor: theme.textPrimary,
      borderRadius: 999,
      paddingVertical: 12,
      paddingHorizontal: 24,
    },
    homeButtonText: {
      color: theme.background,
      fontSize: 14,
      fontWeight: '800',
    },
    toastContainer: {
      position: 'absolute',
      left: 16,
      right: 16,
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 12,
      backgroundColor: '#0F172A',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
      zIndex: 20,
    },
    toastIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#16A34A',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    toastTextWrap: {
      flex: 1,
    },
    toastTitle: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '800',
    },
    toastOrderId: {
      marginTop: 2,
      color: '#93C5FD',
      fontSize: 12,
      fontWeight: '700',
    },
    toastSubtitle: {
      marginTop: 2,
      color: '#D1D5DB',
      fontSize: 12,
      fontWeight: '500',
    },
  });
