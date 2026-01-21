import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomHeader from '../components/CustomHeader';

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  
  // Mock user data
  const [userData, setUserData] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    walletBalance: '₹2,500',
    addresses: [
      {
        id: '1',
        type: 'Home',
        address: '123 Main Street, Apartment 4B',
        city: 'Mumbai',
        pincode: '400001',
        isDefault: true,
      },
      {
        id: '2',
        type: 'Work',
        address: '456 Business Park, Floor 5',
        city: 'Mumbai',
        pincode: '400002',
        isDefault: false,
      },
    ],
    vehicles: [
      {
        id: '1',
        type: 'Car',
        brand: 'Honda',
        model: 'City',
        year: '2020',
        plateNumber: 'MH-01-AB-1234',
        isDefault: true,
      },
      {
        id: '2',
        type: 'Bike',
        brand: 'Yamaha',
        model: 'R15',
        year: '2021',
        plateNumber: 'MH-01-CD-5678',
        isDefault: false,
      },
    ],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
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
              <MaterialCommunityIcons name="account" size={48} color="#FFFFFF" />
            </View>
            <TouchableOpacity style={styles.editAvatarButton}>
              <MaterialCommunityIcons name="camera" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{userData.name}</Text>
          <Text style={styles.userEmail}>{userData.email}</Text>
        </View>

        {/* Wallet Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="wallet" size={24} color="#85E4FC" />
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
                <MaterialCommunityIcons name="arrow-up" size={18} color="#85E4FC" />
                <Text style={styles.walletActionText}>Send</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.walletAction}>
                <MaterialCommunityIcons name="arrow-down" size={18} color="#85E4FC" />
                <Text style={styles.walletActionText}>Receive</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.walletAction}>
                <MaterialCommunityIcons name="history" size={18} color="#85E4FC" />
                <Text style={styles.walletActionText}>History</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>

        {/* Personal Information Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="account-circle" size={24} color="#85E4FC" />
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>
          
          {/* Name */}
          <TouchableOpacity style={styles.infoCard} activeOpacity={0.7}>
            <View style={styles.infoContent}>
              <MaterialCommunityIcons name="account" size={20} color="#9E9E9E" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>{userData.name}</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#9E9E9E" />
          </TouchableOpacity>

          {/* Email */}
          <TouchableOpacity style={styles.infoCard} activeOpacity={0.7}>
            <View style={styles.infoContent}>
              <MaterialCommunityIcons name="email" size={20} color="#9E9E9E" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{userData.email}</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#9E9E9E" />
          </TouchableOpacity>
        </View>

        {/* Addresses Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="map-marker" size={24} color="#85E4FC" />
            <Text style={styles.sectionTitle}>Addresses</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => navigation.navigate('Addresses')}
            >
              <MaterialCommunityIcons name="plus" size={20} color="#85E4FC" />
            </TouchableOpacity>
          </View>
          
          {userData.addresses.map((address) => (
            <TouchableOpacity key={address.id} style={styles.addressCard} activeOpacity={0.7}>
              <View style={styles.addressHeader}>
                <View style={styles.addressTypeBadge}>
                  <MaterialCommunityIcons 
                    name={address.type === 'Home' ? 'home' : 'briefcase'} 
                    size={16} 
                    color="#85E4FC" 
                  />
                  <Text style={styles.addressTypeText}>{address.type}</Text>
                  {address.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Default</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity>
                  <MaterialCommunityIcons name="pencil" size={18} color="#9E9E9E" />
                </TouchableOpacity>
              </View>
              <Text style={styles.addressText}>{address.address}</Text>
              <Text style={styles.addressCity}>{address.city} - {address.pincode}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* My Vehicles Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="car" size={24} color="#85E4FC" />
            <Text style={styles.sectionTitle}>My Vehicles</Text>
            <TouchableOpacity style={styles.addButton}>
              <MaterialCommunityIcons name="plus" size={20} color="#85E4FC" />
            </TouchableOpacity>
          </View>
          
          {userData.vehicles.map((vehicle) => (
            <TouchableOpacity key={vehicle.id} style={styles.vehicleCard} activeOpacity={0.7}>
              <View style={styles.vehicleHeader}>
                <View style={styles.vehicleIconContainer}>
                  <MaterialCommunityIcons 
                    name={vehicle.type === 'Car' ? 'car' : 'motorbike'} 
                    size={32} 
                    color="#85E4FC" 
                  />
                </View>
                <View style={styles.vehicleInfo}>
                  <View style={styles.vehicleTitleRow}>
                    <Text style={styles.vehicleName}>{vehicle.brand} {vehicle.model}</Text>
                    {vehicle.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Default</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.vehicleDetails}>{vehicle.year} • {vehicle.plateNumber}</Text>
                </View>
                <TouchableOpacity>
                  <MaterialCommunityIcons name="pencil" size={18} color="#9E9E9E" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
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
            <MaterialCommunityIcons name="logout" size={20} color="#FF5252" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#28282A',
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
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#85E4FC',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#85E4FC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#28282A',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#9E9E9E',
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
    color: '#FFFFFF',
    flex: 1,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(49, 197, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  walletContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  walletLabel: {
    fontSize: 14,
    color: '#9E9E9E',
    marginBottom: 4,
  },
  walletBalance: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#85E4FC',
  },
  addMoneyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#85E4FC',
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
    borderTopColor: '#333333',
  },
  walletAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  walletActionText: {
    fontSize: 14,
    color: '#85E4FC',
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: '#333333',
  },
  infoCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
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
    color: '#9E9E9E',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  addressCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
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
    color: '#85E4FC',
  },
  defaultBadge: {
    backgroundColor: 'rgba(49, 197, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  defaultBadgeText: {
    fontSize: 10,
    color: '#85E4FC',
    fontWeight: '600',
  },
  addressText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
    lineHeight: 20,
  },
  addressCity: {
    fontSize: 13,
    color: '#9E9E9E',
  },
  vehicleCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
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
    backgroundColor: 'rgba(49, 197, 255, 0.15)',
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
    color: '#FFFFFF',
  },
  vehicleDetails: {
    fontSize: 13,
    color: '#9E9E9E',
  },
  logoutSection: {
    marginTop: 32,
    marginBottom: 32,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 82, 82, 0.15)',
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.3)',
    gap: 12,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF5252',
  },
});
