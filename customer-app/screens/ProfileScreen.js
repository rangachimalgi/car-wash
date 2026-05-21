import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Share,
  useWindowDimensions,
} from 'react-native';
import Constants from 'expo-constants';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomHeader from '../components/CustomHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getVehicleKeys } from '../services/addressStorage';
import { getVehicles } from '../services/vehicleApi';
import { getWallet, getReferralInfo } from '../services/walletApi';
import { useTheme } from '../theme/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import SavedVehiclesModal from '../components/SavedVehiclesModal';
import { isSessionStillValid, logoutUser } from '../services/authSession';
import { wooshCoinsLabel } from '../utils/wooshCoins';

import { openSupportWhatsApp } from '../utils/supportWhatsApp';

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { theme, isLightMode, toggleColorScheme } = useTheme();
  const { width: screenW } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme, isLightMode), [theme, isLightMode]);
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';
  
  const [userData, setUserData] = useState({
    name: 'John Doe',
    phone: '',
    walletBalance: null,
    addresses: [],
  });
  const [vehicleType, setVehicleType] = useState('SUV');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleCount, setVehicleCount] = useState(0);
  const [showVehiclesModal, setShowVehiclesModal] = useState(false);
  const [referralInfo, setReferralInfo] = useState({
    code: '',
    totalReferrals: 0,
    totalEarnings: 0,
    perReferralRewardReferrer: 100,
    perReferralRewardReferred: 100,
  });
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [storedName, storedPhone] = await Promise.all([
          AsyncStorage.getItem('authName'),
          AsyncStorage.getItem('authPhone'),
        ]);

        let walletBalance = null;
        if (storedPhone) {
          const wallet = await getWallet();
          // Only show if positive balance
          if (wallet.walletBalance && wallet.walletBalance > 0) {
            walletBalance = wooshCoinsLabel(wallet.walletBalance);
          }
        }

        setUserData(prev => ({
          ...prev,
          name: storedName || prev.name,
          phone: storedPhone || prev.phone,
          walletBalance,
        }));

        if (storedPhone) {
          const vKeys = await getVehicleKeys();
          const [storedVehicleType, storedVehicleModel, vehicles, referral] = await Promise.all([
            AsyncStorage.getItem(vKeys.vehicleType),
            AsyncStorage.getItem(vKeys.vehicleModel),
            getVehicles(storedPhone),
            getReferralInfo(storedPhone),
          ]);
          if (storedVehicleType) setVehicleType(storedVehicleType);
          if (storedVehicleModel) setVehicleModel(storedVehicleModel);
          if (Array.isArray(vehicles)) {
            setVehicleCount(vehicles.length);
          } else {
            setVehicleCount(0);
          }
          if (referral) {
            setReferralInfo(prev => ({
              ...prev,
              code: referral.referralCode || '',
              totalReferrals: referral.totalReferrals || 0,
              totalEarnings: referral.totalReferralEarnings || 0,
              perReferralRewardReferrer: referral.perReferralRewardReferrer ?? prev.perReferralRewardReferrer,
              perReferralRewardReferred: referral.perReferralRewardReferred ?? prev.perReferralRewardReferred,
            }));
          }
        } else {
          setVehicleCount(0);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };
    loadProfile();
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const refreshVehicle = async () => {
        try {
          const storedPhone = await AsyncStorage.getItem('authPhone');
          if (!storedPhone || !isActive) return;
          const vKeys = await getVehicleKeys();
          const [storedVehicleType, storedVehicleModel, vehicles, referral] = await Promise.all([
            AsyncStorage.getItem(vKeys.vehicleType),
            AsyncStorage.getItem(vKeys.vehicleModel),
            getVehicles(storedPhone),
            getReferralInfo(storedPhone),
          ]);
          if (!isActive || !(await isSessionStillValid(storedPhone))) return;
          setVehicleType(storedVehicleType || 'SUV');
          setVehicleModel(storedVehicleModel || '');
          if (Array.isArray(vehicles)) {
            setVehicleCount(vehicles.length);
          } else {
            setVehicleCount(0);
          }
          if (referral) {
            setReferralInfo(prev => ({
              ...prev,
              code: referral.referralCode || '',
              totalReferrals: referral.totalReferrals || 0,
              totalEarnings: referral.totalReferralEarnings || 0,
              perReferralRewardReferrer: referral.perReferralRewardReferrer ?? prev.perReferralRewardReferrer,
              perReferralRewardReferred: referral.perReferralRewardReferred ?? prev.perReferralRewardReferred,
            }));
          }
        } catch (error) {
          if (isActive) console.warn('Failed to refresh vehicle:', error);
        }
      };
      refreshVehicle();
      return () => {
        isActive = false;
      };
    }, [])
  );

  const handleWhatsAppHelp = () => openSupportWhatsApp('Hi Woosh team, I need help with my booking.');


  return (
    <View style={styles.container}>
      <StatusBar style={isLightMode ? 'dark' : 'light'} />
      <CustomHeader navigation={navigation} />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons name="account" size={48} color={theme.textPrimary} />
          </View>
          <Text style={styles.userName}>{userData.name}</Text>
          <Text style={styles.userEmail}>{userData.phone ? `+91 ${userData.phone}` : 'Phone not set'}</Text>
        </View>

        {/* Woosh Coins — show only when balance is available */}
        {userData.walletBalance != null && userData.walletBalance !== '' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="circle-multiple" size={24} color={theme.accent} />
              <Text style={styles.sectionTitle}>Woosh Coins</Text>
            </View>
            <View style={styles.walletCard}>
              <View style={styles.walletContent}>
                <View>
                  <Text style={styles.walletLabel}>Available balance</Text>
                  <Text style={styles.walletBalance} numberOfLines={2}>
                    {userData.walletBalance}
                  </Text>
                </View>
                {/*
                  Add Money button temporarily disabled – balance is controlled by admin top-ups only.
                  <TouchableOpacity style={styles.addMoneyButton}>
                    <MaterialCommunityIcons name="plus" size={20} color={theme.onAccent} />
                    <Text style={styles.addMoneyText}>Add Money</Text>
                  </TouchableOpacity>
                */}
              </View>
              {/*
                Send / Receive / History actions are commented out for now.
                <View style={styles.walletFooter}>
                  <TouchableOpacity style={styles.walletAction}>
                    <MaterialCommunityIcons name="arrow-up" size={18} color={theme.textPrimary} />
                    <Text style={styles.walletActionText}>Send</Text>
                  </TouchableOpacity>
                  <View style={styles.divider} />
                  <TouchableOpacity style={styles.walletAction}>
                    <MaterialCommunityIcons name="arrow-down" size={18} color={theme.textPrimary} />
                    <Text style={styles.walletActionText}>Receive</Text>
                  </TouchableOpacity>
                  <View style={styles.divider} />
                  <TouchableOpacity style={styles.walletAction}>
                    <MaterialCommunityIcons name="history" size={18} color={theme.textPrimary} />
                    <Text style={styles.walletActionText}>History</Text>
                  </TouchableOpacity>
                </View>
              */}
            </View>
          </View>
        )}

        {/* Quick actions — square grid */}
        <View style={[styles.quickGridRow, { gap: 10 }]}>
          <TouchableOpacity
            style={[styles.gridCard, { width: (screenW - 40 - 20) / 3 }]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Bookings' })}
          >
            <MaterialCommunityIcons name="calendar-clock-outline" size={28} color={theme.textPrimary} />
            <Text style={styles.gridCardLabel}>Bookings</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.gridCard, { width: (screenW - 40 - 20) / 3 }]}
            activeOpacity={0.85}
            onPress={() => setShowVehiclesModal(true)}
          >
            <MaterialCommunityIcons name="car-outline" size={28} color={theme.textPrimary} />
            <Text style={styles.gridCardLabel}>My Vehicles</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.gridCard, { width: (screenW - 40 - 20) / 3 }]}
            activeOpacity={0.85}
            onPress={handleWhatsAppHelp}
          >
            <MaterialCommunityIcons name="headset" size={28} color={theme.textPrimary} />
            <Text style={styles.gridCardLabel}>Help &amp; Support</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.menuListCard}>
          <TouchableOpacity
            style={styles.menuListRow}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('YourOrders')}
          >
            <MaterialCommunityIcons name="clipboard-text-clock-outline" size={22} color={theme.textSecondary} />
            <Text style={styles.menuListLabel}>Your Orders</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Saved addresses & subscriptions */}
        <View style={styles.menuListCard}>
          <TouchableOpacity
            style={styles.menuListRow}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Addresses')}
          >
            <MaterialCommunityIcons name="map-marker-outline" size={22} color={theme.textSecondary} />
            <Text style={styles.menuListLabel}>Saved Addresses</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={theme.textPrimary} />
          </TouchableOpacity>
          <View style={styles.menuListDivider} />
          <TouchableOpacity
            style={styles.menuListRow}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('MySubscriptions')}
          >
            <MaterialCommunityIcons name="calendar-month-outline" size={22} color={theme.textSecondary} />
            <Text style={styles.menuListLabel}>My Subscriptions</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Refer & Earn — same layout as Home */}
        <View style={styles.homeReferralSection}>
          <View style={styles.homeReferralBanner}>
            <View style={styles.homeReferralLeft}>
              <View style={styles.homeReferralTitleWrap}>
                <MaterialCommunityIcons name="gift-outline" size={18} color={theme.accent} />
                <Text style={styles.homeReferralTitle}>Refer &amp; Earn</Text>
              </View>
              <Text style={styles.homeReferralSubtitle}>
                Invite friends and both of you get {referralInfo.perReferralRewardReferred || 100} Woosh Coins in wallet.
              </Text>
              <View style={styles.homeReferralCodeChip}>
                <Text style={styles.homeReferralCodeChipLabel}>Code</Text>
                <Text style={styles.homeReferralCodeChipValue}>{referralInfo.code || 'COMINGSOON'}</Text>
              </View>
              <Text style={styles.homeReferralStats}>
                {referralInfo.totalReferrals} joined  |  {referralInfo.totalEarnings} Woosh Coins earned
              </Text>
            </View>
            <View style={styles.homeReferralRight}>
              <View style={styles.homeReferralIconWrap}>
                <MaterialCommunityIcons name="gift" size={24} color={theme.accent} />
              </View>
              <TouchableOpacity
                style={styles.homeReferralShareBtn}
                activeOpacity={0.85}
                onPress={() => {
                  const codeText = referralInfo.code || 'your Woosh referral code';
                  Share.share({
                    message: `Use my Woosh referral code ${codeText} and we both get ${referralInfo.perReferralRewardReferred || 100} Woosh Coins in wallet on your first order!`,
                  }).catch(() => {});
                }}
              >
                <MaterialCommunityIcons name="share-variant" size={16} color={theme.onAccent} />
                <Text style={styles.homeReferralShareText}>Invite</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="theme-light-dark" size={24} color={theme.accent} />
            <Text style={styles.sectionTitle}>Appearance</Text>
          </View>
          <View style={styles.settingCard}>
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Light mode</Text>
              <Text style={styles.settingDescription}>Use a light color scheme</Text>
            </View>
            <Switch
              value={isLightMode}
              onValueChange={toggleColorScheme}
              trackColor={{ false: theme.cardBorder, true: theme.accent }}
              thumbColor={isLightMode ? '#FFFFFF' : theme.textSecondary}
              ios_backgroundColor={theme.cardBorder}
            />
          </View>
        </View>

        {/* Logout */}
        <View style={styles.logoutSection}>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={() => {
              Alert.alert(
                'Logout',
                'Are you sure you want to logout?',
                [
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },
                  {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await logoutUser();
                        console.log('User logged out');
                      } catch (error) {
                        console.error('Error logging out:', error);
                      }
                      navigation.reset({
                        index: 0,
                        routes: [{ name: 'Login' }],
                      });
                    },
                  },
                ]
              );
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </TouchableOpacity>
          <Text style={styles.versionText}>App Version {appVersion}</Text>
        </View>
      </ScrollView>
      <SavedVehiclesModal
        visible={showVehiclesModal}
        onClose={() => setShowVehiclesModal(false)}
        navigation={navigation}
      />
    </View>
  );
}

const createStyles = (theme, isLightMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.avatarBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: theme.accent,
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.textPrimary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  quickGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gridCard: {
    aspectRatio: 1,
    backgroundColor: isLightMode ? '#FFFFFF' : theme.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    gap: 10,
  },
  gridCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.textPrimary,
    textAlign: 'center',
    lineHeight: 14,
  },
  menuListCard: {
    backgroundColor: isLightMode ? '#FFFFFF' : theme.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    marginBottom: 24,
    overflow: 'hidden',
  },
  menuListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuListLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  menuListDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.cardBorder,
    marginHorizontal: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.textPrimary,
    flex: 1,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletCard: {
    backgroundColor: theme.cardBackground,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  walletContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  walletLabel: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  walletBalance: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.textPrimary,
    lineHeight: 22,
  },
  addMoneyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  addMoneyText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.onAccent,
  },
  walletFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.cardBorder,
  },
  walletAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  walletActionText: {
    fontSize: 14,
    color: theme.textPrimary,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: theme.divider,
  },
  infoCard: {
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: theme.textPrimary,
    fontWeight: '500',
  },
  addressCard: {
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addressTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addressTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.accent,
  },
  defaultBadge: {
    backgroundColor: theme.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  defaultBadgeText: {
    fontSize: 10,
    color: theme.accent,
    fontWeight: '600',
  },
  addressText: {
    fontSize: 14,
    color: theme.textPrimary,
    marginBottom: 4,
    lineHeight: 20,
  },
  addressCity: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  emptyText: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 4,
  },
  vehicleCard: {
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  vehicleIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: theme.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.textPrimary,
  },
  vehicleDetails: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textSecondary,
    marginBottom: 8,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  typeChipActive: {
    backgroundColor: theme.accent,
    borderColor: theme.accent,
  },
  typeChipText: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '600',
  },
  typeChipTextActive: {
    color: theme.onAccent,
  },
  input: {
    backgroundColor: theme.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: theme.textPrimary,
    marginBottom: 12,
  },
  saveVehicleButton: {
    backgroundColor: theme.accent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveVehicleText: {
    color: theme.onAccent,
    fontWeight: '700',
    fontSize: 14,
  },
  viewVehiclesButton: {
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  viewVehiclesText: {
    color: theme.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  vehicleCountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: theme.accentSoft,
    marginRight: 8,
  },
  vehicleCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.accent,
  },
  homeReferralSection: {
    marginBottom: 24,
  },
  homeReferralBanner: {
    backgroundColor: theme.cardBackground,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  homeReferralLeft: {
    flex: 1,
  },
  homeReferralRight: {
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 118,
    paddingVertical: 2,
  },
  homeReferralIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeReferralTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  homeReferralTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.textPrimary,
  },
  homeReferralSubtitle: {
    fontSize: 12,
    color: theme.textSecondary,
    lineHeight: 17,
    marginBottom: 8,
  },
  homeReferralCodeChip: {
    backgroundColor: theme.accentSoft,
    borderRadius: 999,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 7,
  },
  homeReferralCodeChipLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  homeReferralCodeChipValue: {
    fontSize: 12,
    fontWeight: '900',
    color: theme.textPrimary,
    letterSpacing: 0.5,
  },
  homeReferralStats: {
    fontSize: 11,
    color: theme.textSecondary,
  },
  homeReferralShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.accent,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  homeReferralShareText: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.onAccent,
  },
  settingCard: {
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  logoutSection: {
    marginTop: 8,
    marginBottom: 24,
    alignItems: 'center',
  },
  logoutButton: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isLightMode ? '#FFFFFF' : theme.cardBackground,
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: theme.textPrimary,
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.textPrimary,
  },
  versionText: {
    marginTop: 12,
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
  },
});
