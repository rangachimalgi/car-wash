import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, Share, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomHeader from '../components/CustomHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getVehicleKeys } from '../services/addressStorage';
import { getVehicles } from '../services/vehicleApi';
import { getWallet, getReferralInfo } from '../services/walletApi';
import { getMyMembership } from '../services/membershipApi';
import { useTheme } from '../theme/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import SavedVehiclesModal from '../components/SavedVehiclesModal';

const SUPPORT_WHATSAPP_NUMBER = process.env.EXPO_PUBLIC_SUPPORT_WHATSAPP || '918744050709';

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { theme, isLightMode, toggleColorScheme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
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
  const [membershipInfo, setMembershipInfo] = useState(null);

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
            walletBalance = `₹${wallet.walletBalance}`;
          }
          try {
            const token = await AsyncStorage.getItem('authToken');
            if (token) {
              const mem = await getMyMembership();
              if (mem?.success && mem.data?.active && mem.data?.membership) {
                const m = mem.data.membership;
                setMembershipInfo({
                  planLabel: m.planLabel || 'Woosh Black',
                  discountPercent: Number(m.discountPercent) || 0,
                  endsAt: m.endsAt,
                });
              } else {
                setMembershipInfo(null);
              }
            } else {
              setMembershipInfo(null);
            }
          } catch {
            setMembershipInfo(null);
          }
        } else {
          setMembershipInfo(null);
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
      const refreshVehicle = async () => {
        try {
          const storedPhone = await AsyncStorage.getItem('authPhone');
          if (!storedPhone) return;
          const vKeys = await getVehicleKeys();
          const [storedVehicleType, storedVehicleModel, vehicles, referral] = await Promise.all([
            AsyncStorage.getItem(vKeys.vehicleType),
            AsyncStorage.getItem(vKeys.vehicleModel),
            getVehicles(storedPhone),
            getReferralInfo(storedPhone),
          ]);
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
          try {
            const token = await AsyncStorage.getItem('authToken');
            if (token) {
              const mem = await getMyMembership();
              if (mem?.success && mem.data?.active && mem.data?.membership) {
                const m = mem.data.membership;
                setMembershipInfo({
                  planLabel: m.planLabel || 'Woosh Black',
                  discountPercent: Number(m.discountPercent) || 0,
                  endsAt: m.endsAt,
                });
              } else {
                setMembershipInfo(null);
              }
            } else {
              setMembershipInfo(null);
            }
          } catch {
            setMembershipInfo(null);
          }
        } catch (error) {
          console.warn('Failed to refresh vehicle:', error);
        }
      };
      refreshVehicle();
    }, [])
  );

  const handleWhatsAppHelp = async () => {
    const message = encodeURIComponent('Hi Woosh team, I need help with my booking.');
    const appUrl = `whatsapp://send?phone=${SUPPORT_WHATSAPP_NUMBER}&text=${message}`;
    const webUrl = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${message}`;

    try {
      const supported = await Linking.canOpenURL(appUrl);
      if (supported) {
        await Linking.openURL(appUrl);
        return;
      }
      await Linking.openURL(webUrl);
    } catch (error) {
      Alert.alert('Unable to open WhatsApp', 'Please make sure WhatsApp is installed.');
    }
  };


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
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <MaterialCommunityIcons name="account" size={48} color={theme.textPrimary} />
            </View>
            <TouchableOpacity style={styles.editAvatarButton}>
              <MaterialCommunityIcons name="camera" size={16} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{userData.name}</Text>
          <Text style={styles.userEmail}>{userData.phone ? `+91 ${userData.phone}` : 'Phone not set'}</Text>
        </View>

        {/* Wallet Section - show only when balance is available (set from admin) */}
        {userData.walletBalance != null && userData.walletBalance !== '' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="wallet" size={24} color={theme.accent} />
              <Text style={styles.sectionTitle}>Wallet</Text>
            </View>
            <View style={styles.walletCard}>
              <View style={styles.walletContent}>
                <View>
                  <Text style={styles.walletLabel}>Balance</Text>
                  <Text style={styles.walletBalance}>{userData.walletBalance}</Text>
                </View>
                {/*
                  Add Money button temporarily disabled – balance is controlled by admin top-ups only.
                  <TouchableOpacity style={styles.addMoneyButton}>
                    <MaterialCommunityIcons name="plus" size={20} color="#000000" />
                    <Text style={styles.addMoneyText}>Add Money</Text>
                  </TouchableOpacity>
                */}
              </View>
              {/*
                Send / Receive / History actions are commented out for now.
                <View style={styles.walletFooter}>
                  <TouchableOpacity style={styles.walletAction}>
                    <MaterialCommunityIcons name="arrow-up" size={18} color="#000000" />
                    <Text style={styles.walletActionText}>Send</Text>
                  </TouchableOpacity>
                  <View style={styles.divider} />
                  <TouchableOpacity style={styles.walletAction}>
                    <MaterialCommunityIcons name="arrow-down" size={18} color="#000000" />
                    <Text style={styles.walletActionText}>Receive</Text>
                  </TouchableOpacity>
                  <View style={styles.divider} />
                  <TouchableOpacity style={styles.walletAction}>
                    <MaterialCommunityIcons name="history" size={18} color="#000000" />
                    <Text style={styles.walletActionText}>History</Text>
                  </TouchableOpacity>
                </View>
              */}
            </View>
          </View>
        )}

        {membershipInfo ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="crown-outline" size={24} color={theme.accent} />
              <Text style={styles.sectionTitle}>Membership</Text>
            </View>
            <View style={styles.membershipCard}>
              <Text style={styles.membershipTitle}>Active {membershipInfo.planLabel}</Text>
              {membershipInfo.discountPercent > 0 ? (
                <Text style={styles.membershipLine}>
                  {membershipInfo.discountPercent}% off car, bike and auto washes while your plan is active.
                </Text>
              ) : (
                <Text style={styles.membershipLine}>Your member benefits apply at checkout on wash services.</Text>
              )}
              {membershipInfo.discountPercent > 0 ? (
                <Text style={styles.membershipPriceHint}>
                  Woosh Black discount {membershipInfo.discountPercent}%
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
        ) : null}

        {/* Refer & Earn Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="gift" size={24} color={theme.accent} />
            <Text style={styles.sectionTitle}>Refer &amp; Earn</Text>
            <View style={styles.referralBadge}>
              <Text style={styles.referralBadgeText}>
                Get ₹{referralInfo.perReferralRewardReferrer || 100}
              </Text>
            </View>
          </View>
          <View style={styles.referralCard}>
            <Text style={styles.referralSubtitle}>
              Invite friends and you both get ₹
              {referralInfo.perReferralRewardReferred || 100}
              {' '}in wallet on their first order.
            </Text>
            <View style={styles.referralRow}>
              <View>
                <Text style={styles.referralLabel}>Your code</Text>
                <Text style={styles.referralCode}>
                  {referralInfo.code || 'Coming soon'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.referralShareButton}
              activeOpacity={0.8}
              onPress={() => {
                const codeText = referralInfo.code || 'your Woosh referral code';
                Share.share({
                  message: `Use my Woosh referral code ${codeText} and you and I both get ₹${referralInfo.perReferralRewardReferred || 100} in wallet on your first order!`,
                }).catch(() => {});
              }}
            >
              <MaterialCommunityIcons name="share-variant" size={18} color="#000000" />
              <Text style={styles.referralShareText}>Share Invite Link</Text>
            </TouchableOpacity>
            <Text style={styles.referralStatsText}>
              Friends joined: {referralInfo.totalReferrals} · Rewards earned: ₹{referralInfo.totalEarnings}
            </Text>
          </View>
        </View>

        {/* Personal Information Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="account-circle" size={24} color={theme.accent} />
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>
          
          {/* Name */}
          <TouchableOpacity style={styles.infoCard} activeOpacity={0.7}>
            <View style={styles.infoContent}>
              <MaterialCommunityIcons name="account" size={20} color={theme.textSecondary} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>{userData.name}</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={theme.textSecondary} />
          </TouchableOpacity>

          {/* Phone */}
          <TouchableOpacity style={styles.infoCard} activeOpacity={0.7}>
            <View style={styles.infoContent}>
              <MaterialCommunityIcons name="phone" size={20} color={theme.textSecondary} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{userData.phone ? `+91 ${userData.phone}` : '-'}</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Addresses Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="map-marker" size={24} color={theme.accent} />
            <Text style={styles.sectionTitle}>Addresses</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => navigation.navigate('Addresses')}
            >
              <MaterialCommunityIcons name="plus" size={20} color={theme.accent} />
            </TouchableOpacity>
          </View>
          
          {userData.addresses.length === 0 ? (
            <Text style={styles.emptyText}>No saved addresses yet.</Text>
          ) : (
            userData.addresses.map((address) => (
              <TouchableOpacity key={address.id} style={styles.addressCard} activeOpacity={0.7}>
                <View style={styles.addressHeader}>
                  <View style={styles.addressTypeBadge}>
                    <MaterialCommunityIcons 
                      name={address.type === 'Home' ? 'home' : 'briefcase'} 
                      size={16} 
                      color={theme.accent} 
                    />
                    <Text style={styles.addressTypeText}>{address.type}</Text>
                    {address.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Default</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity>
                    <MaterialCommunityIcons name="pencil" size={18} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.addressText}>{address.address}</Text>
                <Text style={styles.addressCity}>{address.city} - {address.pincode}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* My Vehicle Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="car" size={24} color={theme.accent} />
            <Text style={styles.sectionTitle}>My Vehicle</Text>
            {vehicleCount > 0 && (
              <View style={styles.vehicleCountBadge}>
                <Text style={styles.vehicleCountText}>
                  {vehicleCount} {vehicleCount === 1 ? 'Vehicle' : 'Vehicles'}
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('SelectVehicle')}>
              <MaterialCommunityIcons name="pencil" size={20} color={theme.accent} />
            </TouchableOpacity>
          </View>
          <View style={styles.vehicleCard}>
            <View style={styles.vehicleHeader}>
              <View style={styles.vehicleIconContainer}>
                <MaterialCommunityIcons name="car" size={32} color={theme.accent} />
              </View>
              <View style={styles.vehicleInfo}>
                <View style={styles.vehicleTitleRow}>
                  <Text style={styles.vehicleName}>
                    {vehicleType ? `${vehicleType}` : 'Vehicle not set'}
                  </Text>
                </View>
                <Text style={styles.vehicleDetails}>
                  {vehicleModel || 'Add your vehicle model'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.saveVehicleButton}
              onPress={() => navigation.navigate('SelectVehicle')}
            >
              <Text style={styles.saveVehicleText}>Edit Vehicle</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.viewVehiclesButton}
              onPress={() => setShowVehiclesModal(true)}
            >
              <Text style={styles.viewVehiclesText}>View All Vehicles</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/*
        // Appearance Section (temporarily hidden)
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
              // onValueChange={toggleColorScheme} // temporarily disabled
              disabled
              trackColor={{ false: theme.cardBorder, true: theme.accent }}
              thumbColor={isLightMode ? '#FFFFFF' : theme.textSecondary}
              ios_backgroundColor={theme.cardBorder}
            />
          </View>
        </View>
        */}

        {/* Help & Support */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="lifebuoy" size={24} color={theme.accent} />
            <Text style={styles.sectionTitle}>Help &amp; Support</Text>
          </View>
          <TouchableOpacity style={styles.infoCard} activeOpacity={0.8} onPress={handleWhatsAppHelp}>
            <View style={styles.infoContent}>
              <MaterialCommunityIcons name="whatsapp" size={20} color="#25D366" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Need help?</Text>
                <Text style={styles.infoValue}>Chat with us on WhatsApp</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
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
                        // Clear all auth-related storage
                        await AsyncStorage.multiRemove(['authToken', 'authPhone', 'authName', 'userId']);
                        console.log('User logged out');
                        navigation.reset({
                          index: 0,
                          routes: [{ name: 'Login' }],
                        });
                      } catch (error) {
                        console.error('Error logging out:', error);
                        navigation.reset({
                          index: 0,
                          routes: [{ name: 'Login' }],
                        });
                      }
                    },
                  },
                ]
              );
            }}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="logout" size={20} color={theme.danger} />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
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

const createStyles = theme => StyleSheet.create({
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
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
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
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: theme.background,
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
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
    color: '#000000',
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
    color: '#000000',
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
    color: '#000000',
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
    color: '#000000',
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
  referralCard: {
    backgroundColor: theme.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  membershipCard: {
    backgroundColor: theme.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  membershipTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.textPrimary,
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
    color: theme.textSecondary,
    marginBottom: 8,
  },
  membershipSub: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  referralSubtitle: {
    fontSize: 13,
    color: theme.textSecondary,
    marginBottom: 12,
  },
  referralRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  referralLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  referralCode: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.textPrimary,
  },
  referralShareButton: {
    marginTop: 4,
    backgroundColor: theme.accent,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  referralShareText: {
    color: '#000000',
    fontWeight: '600',
    fontSize: 14,
  },
  referralStatsText: {
    marginTop: 10,
    fontSize: 12,
    color: theme.textSecondary,
  },
  referralBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: theme.accentSoft,
  },
  referralBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.accent,
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
    marginTop: 32,
    marginBottom: 32,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.dangerSoft,
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.3)',
    gap: 12,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.danger,
  },
});
