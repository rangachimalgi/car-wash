import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Switch } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomHeader from '../components/CustomHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { theme, isLightMode, toggleColorScheme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  // Mock user data
  const [userData, setUserData] = useState({
    name: 'John Doe',
    phone: '',
    walletBalance: '₹2,500',
    addresses: [],
    vehicles: [],
  });
  const [vehicleType, setVehicleType] = useState('SUV');
  const [vehicleModel, setVehicleModel] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [storedName, storedPhone] = await Promise.all([
          AsyncStorage.getItem('authName'),
          AsyncStorage.getItem('authPhone'),
        ]);
        setUserData(prev => ({
          ...prev,
          name: storedName || prev.name,
          phone: storedPhone || prev.phone,
        }));
        if (storedPhone) {
          const [storedVehicleType, storedVehicleModel] = await Promise.all([
            AsyncStorage.getItem(`userVehicleType:${storedPhone}`),
            AsyncStorage.getItem(`userVehicleModel:${storedPhone}`),
          ]);
          if (storedVehicleType) setVehicleType(storedVehicleType);
          if (storedVehicleModel) setVehicleModel(storedVehicleModel);
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
          const [storedVehicleType, storedVehicleModel] = await Promise.all([
            AsyncStorage.getItem(`userVehicleType:${storedPhone}`),
            AsyncStorage.getItem(`userVehicleModel:${storedPhone}`),
          ]);
          setVehicleType(storedVehicleType || 'SUV');
          setVehicleModel(storedVehicleModel || '');
        } catch (error) {
          console.warn('Failed to refresh vehicle:', error);
        }
      };
      refreshVehicle();
    }, [])
  );


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

        {/* Wallet Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="wallet" size={24} color={theme.accent} />
            <Text style={styles.sectionTitle}>Wallet</Text>
          </View>
          <TouchableOpacity style={styles.walletCard} activeOpacity={0.8}>
            <View style={styles.walletContent}>
              <View>
                <Text style={styles.walletLabel}>Balance</Text>
                <Text style={styles.walletBalance}>{userData.walletBalance}</Text>
              </View>
              <TouchableOpacity style={styles.addMoneyButton}>
                <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
                <Text style={styles.addMoneyText}>Add Money</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.walletFooter}>
              <TouchableOpacity style={styles.walletAction}>
                <MaterialCommunityIcons name="arrow-up" size={18} color={theme.accent} />
                <Text style={styles.walletActionText}>Send</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.walletAction}>
                <MaterialCommunityIcons name="arrow-down" size={18} color={theme.accent} />
                <Text style={styles.walletActionText}>Receive</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.walletAction}>
                <MaterialCommunityIcons name="history" size={18} color={theme.accent} />
                <Text style={styles.walletActionText}>History</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
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
            <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('VehicleDetails')}>
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
              onPress={() => navigation.navigate('VehicleDetails')}
            >
              <Text style={styles.saveVehicleText}>Edit Vehicle</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Appearance Section */}
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
                    onPress: () => {
                      // Handle logout logic here (clear storage, reset state, etc.)
                      console.log('User logged out');
                      navigation.navigate('Login');
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
    color: theme.accent,
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
    color: '#FFFFFF',
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
    color: theme.accent,
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
  },
  saveVehicleText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 14,
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
