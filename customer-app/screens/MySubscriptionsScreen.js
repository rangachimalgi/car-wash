import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Line } from 'react-native-svg';
import MinimalBackHeader from '../components/MinimalBackHeader';
import { useTheme } from '../theme/ThemeContext';
import { wooshGreen } from '../theme/wooshGreen';
import { getMyMembership } from '../services/membershipApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BENEFITS = [
  {
    id: 'doorstep',
    icon: 'home-outline',
    iconColor: '#3B82F6',
    title: 'Doorstep Wash',
    description: 'Get your car cleaned at home — no travel, no waiting.',
  },
  {
    id: 'slot',
    icon: 'calendar-clock-outline',
    iconColor: '#8B5CF6',
    title: 'Fixed Weekly Slot',
    description: 'Your preferred day & time reserved for every wash.',
  },
  {
    id: 'support',
    icon: 'headset',
    iconColor: '#EC4899',
    title: 'Priority Customer Support',
    description: 'Faster help through a dedicated subscriber line.',
  },
  {
    id: 'savings',
    icon: 'piggy-bank-outline',
    iconColor: '#22C55E',
    title: 'Big Monthly Savings',
    description: 'Save up to ₹400 compared to one-time washes.',
  },
];

function PromoCornerLines({ width, height, accentColor }) {
  const lines = [];
  for (let i = 0; i < 6; i++) {
    const x1 = width * 0.55 + i * 12;
    lines.push(
      <Line
        key={`l-${i}`}
        x1={x1}
        y1={0}
        x2={width}
        y2={height * (0.2 + i * 0.1)}
        stroke={accentColor}
        strokeWidth={1.5}
        opacity={0.35}
      />
    );
  }
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      {lines}
    </Svg>
  );
}

function MonthlySubscriptionTab({ navigation, styles, theme }) {
  return (
    <View style={styles.tabContent}>
      <View style={styles.promoCard}>
        <PromoCornerLines width={340} height={180} accentColor={theme.accent} />
        <View style={styles.promoHeaderRow}>
          <Image
            source={require('../assets/WooshLogo.png')}
            style={styles.promoLogo}
            resizeMode="contain"
          />
          <View style={styles.promoTextBlock}>
            <Text style={styles.promoTitle}>Start Your Subscription</Text>
            <Text style={styles.promoSubtitle}>
              Join thousands who trust Woosh for hassle-free car care at home.
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.promoButton}
          activeOpacity={0.88}
          onPress={() => navigation.navigate('Packages')}
        >
          <Text style={styles.promoButtonText}>Buy Now</Text>
          <MaterialCommunityIcons name="arrow-right" size={18} color={theme.onAccent} />
        </TouchableOpacity>
      </View>

      <Text style={styles.benefitsHeading}>Benefits</Text>
      {BENEFITS.map((item) => (
        <View key={item.id} style={styles.benefitRow}>
          <View style={[styles.benefitIconWrap, { borderColor: item.iconColor }]}>
            <MaterialCommunityIcons name={item.icon} size={22} color={item.iconColor} />
          </View>
          <View style={styles.benefitTextCol}>
            <Text style={styles.benefitTitle}>{item.title}</Text>
            <Text style={styles.benefitDescription}>{item.description}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function WooshGreenTab({ navigation, styles, theme, membershipInfo, membershipLoading }) {
  if (membershipLoading) {
    return (
      <View style={styles.wooshGreenLoading}>
        <ActivityIndicator size="small" color={theme.accent} />
      </View>
    );
  }

  if (membershipInfo) {
    return (
      <View style={styles.tabContent}>
        <View style={styles.wooshGreenSectionHeader}>
          <MaterialCommunityIcons name="crown-outline" size={24} color={wooshGreen.primary} />
          <Text style={styles.wooshGreenSectionTitle}>Membership</Text>
        </View>
        <View style={styles.membershipCard}>
          <Text style={styles.membershipTitle}>Active {membershipInfo.planLabel}</Text>
          {membershipInfo.discountPercent > 0 ? (
            <Text style={styles.membershipLine}>
              {membershipInfo.discountPercent}% off car, bike and auto washes while your plan is active.
            </Text>
          ) : (
            <Text style={styles.membershipLine}>
              Your member benefits apply at checkout on wash services.
            </Text>
          )}
          {membershipInfo.discountPercent > 0 ? (
            <Text style={styles.membershipPriceHint}>
              Woosh Green discount {membershipInfo.discountPercent}%
            </Text>
          ) : null}
          {membershipInfo.endsAt ? (
            <Text style={styles.membershipSub}>
              Valid through{' '}
              {new Date(membershipInfo.endsAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.tabContent}>
      <View style={styles.buyWooshGreenCard}>
        <MaterialCommunityIcons name="leaf" size={36} color={wooshGreen.primary} />
        <Text style={styles.buyWooshGreenTitle}>Woosh Green</Text>
        <Text style={styles.buyWooshGreenText}>
          Get member pricing on car, bike and auto washes for a full year.
        </Text>
        <TouchableOpacity
          style={styles.buyWooshGreenButton}
          activeOpacity={0.88}
          onPress={() => navigation.navigate('CarWash')}
        >
          <Text style={styles.buyWooshGreenButtonText}>Buy Woosh Green</Text>
          <MaterialCommunityIcons name="arrow-right" size={18} color={theme.onAccent} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function MySubscriptionsScreen({ navigation }) {
  const { theme, isLightMode } = useTheme();
  const styles = useMemo(() => createStyles(theme, isLightMode), [theme, isLightMode]);
  const [activeTab, setActiveTab] = useState('monthly');
  const [membershipInfo, setMembershipInfo] = useState(null);
  const [membershipLoading, setMembershipLoading] = useState(true);

  const loadMembership = useCallback(async () => {
    setMembershipLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        setMembershipInfo(null);
        return;
      }
      const mem = await getMyMembership();
      if (mem?.success && mem.data?.active && mem.data?.membership) {
        const m = mem.data.membership;
        setMembershipInfo({
          planLabel: m.planLabel || 'Woosh Green',
          discountPercent: Number(m.discountPercent) || 0,
          endsAt: m.endsAt,
        });
      } else {
        setMembershipInfo(null);
      }
    } catch {
      setMembershipInfo(null);
    } finally {
      setMembershipLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMembership();
    }, [loadMembership])
  );

  return (
    <View style={styles.container}>
      <StatusBar style={isLightMode ? 'dark' : 'light'} />
      <MinimalBackHeader navigation={navigation} title="My Subscriptions" />

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabPill, activeTab === 'monthly' && styles.tabPillActive]}
          onPress={() => setActiveTab('monthly')}
          activeOpacity={0.85}
        >
          <Text style={[styles.tabPillText, activeTab === 'monthly' && styles.tabPillTextActive]}>
            Monthly Subscription
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabPill, activeTab === 'wooshGreen' && styles.tabPillActive]}
          onPress={() => setActiveTab('wooshGreen')}
          activeOpacity={0.85}
        >
          <Text style={[styles.tabPillText, activeTab === 'wooshGreen' && styles.tabPillTextActive]}>
            Woosh Green
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'monthly' ? (
          <MonthlySubscriptionTab navigation={navigation} styles={styles} theme={theme} />
        ) : (
          <WooshGreenTab
            navigation={navigation}
            styles={styles}
            theme={theme}
            membershipInfo={membershipInfo}
            membershipLoading={membershipLoading}
          />
        )}
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
    tabBar: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 8,
      padding: 4,
      borderRadius: 12,
      backgroundColor: isLightMode ? '#E8F4FC' : theme.accentSoft,
      gap: 4,
    },
    tabPill: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabPillActive: {
      backgroundColor: isLightMode ? '#FFFFFF' : theme.cardBackground,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isLightMode ? 0.08 : 0.2,
      shadowRadius: 3,
      elevation: 2,
    },
    tabPillText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textSecondary,
      textAlign: 'center',
    },
    tabPillTextActive: {
      color: theme.textPrimary,
      fontWeight: '700',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 32,
    },
    tabContent: {
      paddingTop: 8,
    },
    promoCard: {
      backgroundColor: isLightMode ? '#E8F4FC' : theme.accentSoft,
      borderRadius: 18,
      padding: 18,
      overflow: 'hidden',
      marginBottom: 24,
      borderWidth: 1,
      borderColor: isLightMode ? 'rgba(133, 228, 252, 0.45)' : 'rgba(133, 228, 252, 0.35)',
    },
    promoHeaderRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 14,
      marginBottom: 16,
    },
    promoLogo: {
      width: 48,
      height: 48,
    },
    promoTextBlock: {
      flex: 1,
      paddingTop: 2,
    },
    promoTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.textPrimary,
      marginBottom: 6,
      lineHeight: 22,
    },
    promoSubtitle: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.textSecondary,
      lineHeight: 18,
    },
    promoButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'flex-start',
      backgroundColor: theme.accent,
      paddingVertical: 12,
      paddingHorizontal: 18,
      borderRadius: 10,
      gap: 6,
    },
    promoButtonText: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.onAccent,
    },
    benefitsHeading: {
      fontSize: 17,
      fontWeight: '800',
      color: theme.textPrimary,
      textAlign: 'center',
      marginBottom: 20,
    },
    benefitRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 22,
      gap: 14,
    },
    benefitIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.cardBackground,
    },
    benefitTextCol: {
      flex: 1,
      paddingTop: 2,
    },
    benefitTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.textPrimary,
      marginBottom: 4,
    },
    benefitDescription: {
      fontSize: 13,
      color: theme.textSecondary,
      lineHeight: 18,
    },
    wooshGreenLoading: {
      paddingVertical: 48,
      alignItems: 'center',
    },
    wooshGreenSectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 14,
    },
    wooshGreenSectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.textPrimary,
    },
    membershipCard: {
      backgroundColor: wooshGreen.soft,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: wooshGreen.softBorder,
    },
    membershipTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: wooshGreen.deep,
      marginBottom: 8,
    },
    membershipLine: {
      fontSize: 14,
      lineHeight: 20,
      color: theme.textSecondary,
      marginBottom: 8,
    },
    membershipPriceHint: {
      fontSize: 13,
      lineHeight: 19,
      color: wooshGreen.medium,
      fontWeight: '600',
      marginBottom: 8,
    },
    membershipSub: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    buyWooshGreenCard: {
      alignItems: 'center',
      backgroundColor: isLightMode ? '#E8F6EE' : wooshGreen.soft,
      borderRadius: 18,
      padding: 24,
      borderWidth: 1,
      borderColor: wooshGreen.softBorder,
    },
    buyWooshGreenTitle: {
      marginTop: 12,
      fontSize: 20,
      fontWeight: '800',
      color: wooshGreen.deep,
    },
    buyWooshGreenText: {
      marginTop: 8,
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 18,
      paddingHorizontal: 8,
    },
    buyWooshGreenButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.accent,
      paddingVertical: 12,
      paddingHorizontal: 18,
      borderRadius: 10,
      gap: 6,
    },
    buyWooshGreenButtonText: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.onAccent,
    },
  });
