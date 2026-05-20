import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';

export default function BookingConfirmationScreen({ navigation, route }) {
  const { theme, isLightMode } = useTheme();
  const styles = useMemo(() => createStyles(theme, isLightMode), [theme, isLightMode]);
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.confirmBlock}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name="check-circle" size={70} color="#16A34A" />
          </View>
          <Text style={styles.title}>Yes, booking is confirmed!</Text>
          {!!orderId && <Text style={styles.orderText}>{orderId}</Text>}
          <Text style={styles.subtitle}>We will assign a professional and notify you shortly.</Text>
        </View>

        <View style={styles.promoSection}>
          <Text style={styles.promoSectionTitle}>Explore more services</Text>
          <View style={styles.promoRow}>
            <TouchableOpacity
              style={styles.promoHalfCard}
              onPress={() => navigation.navigate('Packages')}
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityLabel="Monthly packages"
            >
              <Text style={styles.promoCardTitle}>Monthly Packages</Text>
              <Text style={styles.promoCardSubtitle}>Save with a wash plan</Text>
              <View style={styles.promoCardImageWrap}>
                <Image
                  source={
                    isLightMode
                      ? require('../assets/monthlyPackages.png')
                      : require('../assets/monthlyPackages.png')
                  }
                  style={styles.promoCardImage}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.promoHalfCard}
              onPress={() => navigation.navigate('PackageDetails')}
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityLabel="Daily cleaning services"
            >
              <Text style={styles.promoCardTitle}>Daily Cleaning</Text>
              <Text style={styles.promoCardSubtitle}>Interior, exterior & daily care</Text>
              <View style={styles.promoCardImageWrap}>
                <Image
                  source={require('../assets/dailyService.png')}
                  style={styles.promoDailyImage}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.homeButton} onPress={goHome} activeOpacity={0.85}>
          <Text style={styles.homeButtonText}>Go to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const createStyles = (theme, isLightMode) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 24,
    },
    confirmBlock: {
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingTop: 32,
      paddingBottom: 28,
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
      color: theme.accent,
    },
    subtitle: {
      marginTop: 10,
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      maxWidth: 320,
    },
    promoSection: {
      marginTop: 8,
      marginBottom: 20,
    },
    promoSectionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.textPrimary,
      marginBottom: 10,
    },
    promoRow: {
      flexDirection: 'row',
      gap: 12,
    },
    promoHalfCard: {
      flex: 1,
      backgroundColor: theme.cardBackground,
      borderRadius: 16,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      overflow: 'hidden',
      minHeight: 168,
    },
    promoCardTitle: {
      fontSize: 15,
      fontWeight: '900',
      color: theme.textPrimary,
      letterSpacing: 0.2,
    },
    promoCardSubtitle: {
      marginTop: 4,
      fontSize: 11,
      fontWeight: '600',
      color: theme.textSecondary,
      lineHeight: 15,
    },
    promoCardImageWrap: {
      flex: 1,
      marginTop: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    promoCardImage: {
      width: '115%',
      height: 88,
    },
    promoDailyImage: {
      width: '100%',
      height: 72,
    },
    homeButton: {
      alignSelf: 'center',
      backgroundColor: theme.textPrimary,
      borderRadius: 999,
      paddingVertical: 12,
      paddingHorizontal: 28,
      marginBottom: 8,
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
