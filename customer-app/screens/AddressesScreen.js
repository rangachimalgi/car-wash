import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BackHeader from '../components/BackHeader';

export default function AddressesScreen({ navigation, route }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [savedAddresses, setSavedAddresses] = useState([
    {
      id: '1',
      type: 'Home',
      address: '123 Main Street, Apartment 4B',
      area: 'Downtown',
      city: 'Mumbai',
      pincode: '400001',
      isDefault: true,
    },
    {
      id: '2',
      type: 'Work',
      address: '456 Business Park, Floor 5',
      area: 'Andheri',
      city: 'Mumbai',
      pincode: '400053',
      isDefault: false,
    },
    {
      id: '3',
      type: 'Other',
      address: '789 Residential Complex, Block C',
      area: 'Bandra',
      city: 'Mumbai',
      pincode: '400050',
      isDefault: false,
    },
  ]);

  const handleUseCurrentLocation = () => {
    // TODO: Implement current location functionality
    console.log('Use current location');
    // This would typically use react-native-geolocation or expo-location
  };

  const handleSelectAddress = (address) => {
    // If address is selected from route params, pass it back
    if (route?.params?.onSelectAddress) {
      route.params.onSelectAddress(address);
      navigation.goBack();
    }
  };

  const handleAddNewAddress = () => {
    // TODO: Navigate to add address screen
    console.log('Add new address');
  };

  const handleDeleteAddress = (id) => {
    setSavedAddresses(addresses => addresses.filter(addr => addr.id !== id));
  };

  const handleSetDefault = (id) => {
    setSavedAddresses(addresses =>
      addresses.map(addr => ({
        ...addr,
        isDefault: addr.id === id,
      }))
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <BackHeader navigation={navigation} title="Select Address" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <MaterialCommunityIcons 
              name="magnify" 
              size={20} 
              color="#9E9E9E" 
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for area, street, landmark..."
              placeholderTextColor="#9E9E9E"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
              >
                <MaterialCommunityIcons name="close-circle" size={20} color="#9E9E9E" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Current Location Option */}
        <TouchableOpacity 
          style={styles.currentLocationCard}
          onPress={handleUseCurrentLocation}
          activeOpacity={0.8}
        >
          <View style={styles.currentLocationIconContainer}>
            <MaterialCommunityIcons name="crosshairs-gps" size={24} color="#2CD4FB" />
          </View>
          <View style={styles.currentLocationContent}>
            <Text style={styles.currentLocationTitle}>Use Current Location</Text>
            <Text style={styles.currentLocationSubtitle}>Get your current location automatically</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#9E9E9E" />
        </TouchableOpacity>

        {/* Saved Addresses Section */}
        <View style={styles.savedAddressesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Saved Addresses</Text>
            <TouchableOpacity onPress={handleAddNewAddress}>
              <MaterialCommunityIcons name="plus-circle" size={24} color="#2CD4FB" />
            </TouchableOpacity>
          </View>

          {savedAddresses.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="map-marker-off" size={64} color="#666666" />
              <Text style={styles.emptyStateText}>No saved addresses</Text>
              <Text style={styles.emptyStateSubtext}>Add an address to get started</Text>
              <TouchableOpacity 
                style={styles.addAddressButton}
                onPress={handleAddNewAddress}
              >
                <Text style={styles.addAddressButtonText}>Add Address</Text>
              </TouchableOpacity>
            </View>
          ) : (
            savedAddresses.map((address) => (
              <TouchableOpacity
                key={address.id}
                style={styles.addressCard}
                onPress={() => handleSelectAddress(address)}
                activeOpacity={0.8}
              >
                <View style={styles.addressCardContent}>
                  <View style={styles.addressHeader}>
                    <View style={styles.addressTypeContainer}>
                      <MaterialCommunityIcons 
                        name={address.type === 'Home' ? 'home' : address.type === 'Work' ? 'briefcase' : 'map-marker'} 
                        size={20} 
                        color="#2CD4FB" 
                      />
                      <Text style={styles.addressType}>{address.type}</Text>
                      {address.isDefault && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultBadgeText}>Default</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.addressActions}>
                      <TouchableOpacity
                        onPress={() => handleSetDefault(address.id)}
                        style={styles.actionButton}
                      >
                        <MaterialCommunityIcons 
                          name={address.isDefault ? 'star' : 'star-outline'} 
                          size={20} 
                          color={address.isDefault ? "#FFD700" : "#9E9E9E"} 
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteAddress(address.id)}
                        style={styles.actionButton}
                      >
                        <MaterialCommunityIcons name="delete-outline" size={20} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.addressText}>{address.address}</Text>
                  <Text style={styles.addressDetails}>
                    {address.area}, {address.city} - {address.pincode}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#9E9E9E" />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    paddingHorizontal: 16,
    minHeight: 56,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    paddingVertical: 16,
  },
  clearButton: {
    padding: 4,
  },
  currentLocationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333333',
  },
  currentLocationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(49, 197, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  currentLocationContent: {
    flex: 1,
  },
  currentLocationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  currentLocationSubtitle: {
    fontSize: 14,
    color: '#9E9E9E',
  },
  savedAddressesSection: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
    marginBottom: 24,
  },
  addAddressButton: {
    backgroundColor: '#2CD4FB',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  addAddressButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  addressCardContent: {
    flex: 1,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2CD4FB',
  },
  defaultBadge: {
    backgroundColor: 'rgba(49, 197, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2CD4FB',
  },
  addressActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
  addressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  addressDetails: {
    fontSize: 14,
    color: '#9E9E9E',
  },
});
