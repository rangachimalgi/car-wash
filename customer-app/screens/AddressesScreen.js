import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BackHeader from '../components/BackHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useTheme } from '../theme/ThemeContext';

export default function AddressesScreen({ navigation, route }) {
  const [searchQuery, setSearchQuery] = useState('');
  const { theme, isLightMode } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({
    type: 'Home',
    address: '',
    area: '',
    city: '',
    pincode: '',
  });

  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const stored = await AsyncStorage.getItem('savedAddresses');
        if (stored) {
          setSavedAddresses(JSON.parse(stored));
        }
      } catch (error) {
        console.warn('Failed to load addresses:', error);
      }
    };
    loadAddresses();
  }, []);

  const persistAddresses = async (addresses) => {
    setSavedAddresses(addresses);
    await AsyncStorage.setItem('savedAddresses', JSON.stringify(addresses));
  };

  const handleUseCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      const [place] = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      const parts = [
        place?.name,
        place?.street,
        place?.subLocality,
        place?.city,
        place?.region,
        place?.postalCode,
      ].filter(Boolean);
      const addressText = parts.join(', ') || `${position.coords.latitude}, ${position.coords.longitude}`;

      const newAddress = {
        id: String(Date.now()),
        type: 'Current',
        address: addressText,
        area: place?.subLocality || '',
        city: place?.city || '',
        pincode: place?.postalCode || '',
        isDefault: savedAddresses.length === 0,
      };

      const updated = [newAddress, ...savedAddresses];
      await persistAddresses(updated);
      await AsyncStorage.setItem('currentAddress', addressText);
      await AsyncStorage.setItem('currentLat', String(position.coords.latitude));
      await AsyncStorage.setItem('currentLng', String(position.coords.longitude));
      handleSelectAddress(newAddress);
    } catch (error) {
      console.error('Use current location error:', error);
      Alert.alert('Location error', 'Unable to get current location.');
    }
  };

  const handleSelectAddress = (address) => {
    // If address is selected from route params, pass it back
    if (route?.params?.onSelectAddress) {
      route.params.onSelectAddress(address);
      navigation.goBack();
    }
    const fullAddress = [address.address, address.area, address.city, address.pincode]
      .filter(Boolean)
      .join(', ');
    AsyncStorage.setItem('currentAddress', fullAddress).catch(error => {
      console.warn('Failed to store current address:', error);
    });
    AsyncStorage.removeItem('currentLat').catch(() => {});
    AsyncStorage.removeItem('currentLng').catch(() => {});
    navigation.goBack();
  };

  const handleAddNewAddress = () => {
    setIsAdding(true);
  };

  const handleDeleteAddress = (id) => {
    const updated = savedAddresses.filter(addr => addr.id !== id);
    persistAddresses(updated).catch(error => console.warn('Delete address failed:', error));
  };

  const handleSetDefault = (id) => {
    const updated = savedAddresses.map(addr => ({
        ...addr,
        isDefault: addr.id === id,
      }));
    persistAddresses(updated).catch(error => console.warn('Set default failed:', error));
  };

  const handleSaveAddress = async () => {
    if (!form.address.trim()) {
      Alert.alert('Missing address', 'Please enter an address.');
      return;
    }
    const newAddress = {
      id: String(Date.now()),
      type: form.type,
      address: form.address.trim(),
      area: form.area.trim(),
      city: form.city.trim(),
      pincode: form.pincode.trim(),
      isDefault: savedAddresses.length === 0,
    };
    const updated = [newAddress, ...savedAddresses];
    await persistAddresses(updated);
    setIsAdding(false);
    setForm({ type: 'Home', address: '', area: '', city: '', pincode: '' });
  };

  return (
    <View style={styles.container}>
      <StatusBar style={isLightMode ? 'dark' : 'light'} />
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
              color={theme.textSecondary} 
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for area, street, landmark..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
              >
                <MaterialCommunityIcons name="close-circle" size={20} color={theme.textSecondary} />
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
            <MaterialCommunityIcons name="crosshairs-gps" size={24} color={theme.accent} />
          </View>
          <View style={styles.currentLocationContent}>
            <Text style={styles.currentLocationTitle}>Use Current Location</Text>
            <Text style={styles.currentLocationSubtitle}>Get your current location automatically</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={theme.textSecondary} />
        </TouchableOpacity>

        {isAdding && (
          <View style={styles.addForm}>
            <Text style={styles.addFormTitle}>Add Address</Text>
            <View style={styles.typeRow}>
              {['Home', 'Work', 'Other'].map(type => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeChip, form.type === type && styles.typeChipActive]}
                  onPress={() => setForm(prev => ({ ...prev, type }))}
                >
                  <Text style={[styles.typeChipText, form.type === type && styles.typeChipTextActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Address"
              placeholderTextColor={theme.textSecondary}
              value={form.address}
              onChangeText={(text) => setForm(prev => ({ ...prev, address: text }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Area"
              placeholderTextColor={theme.textSecondary}
              value={form.area}
              onChangeText={(text) => setForm(prev => ({ ...prev, area: text }))}
            />
            <View style={styles.formRow}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="City"
                placeholderTextColor={theme.textSecondary}
                value={form.city}
                onChangeText={(text) => setForm(prev => ({ ...prev, city: text }))}
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Pincode"
                placeholderTextColor={theme.textSecondary}
                value={form.pincode}
                onChangeText={(text) => setForm(prev => ({ ...prev, pincode: text }))}
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.formActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setIsAdding(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveAddress}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Saved Addresses Section */}
        <View style={styles.savedAddressesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Saved Addresses</Text>
            <TouchableOpacity onPress={handleAddNewAddress}>
              <MaterialCommunityIcons name="plus-circle" size={24} color={theme.accent} />
            </TouchableOpacity>
          </View>

          {savedAddresses.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="map-marker-off" size={64} color={theme.textSecondary} />
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
                        color={theme.accent} 
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
                          color={address.isDefault ? "#FFD700" : theme.textSecondary} 
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
                <MaterialCommunityIcons name="chevron-right" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            ))
          )}
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
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.textPrimary,
    paddingVertical: 16,
  },
  clearButton: {
    padding: 4,
  },
  currentLocationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  currentLocationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.accentSoft,
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
    color: theme.textPrimary,
    marginBottom: 4,
  },
  currentLocationSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
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
    color: theme.textPrimary,
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
    color: theme.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  addAddressButton: {
    backgroundColor: theme.accent,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  addAddressButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
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
    color: theme.accent,
  },
  defaultBadge: {
    backgroundColor: theme.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.accent,
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
    color: theme.textPrimary,
    marginBottom: 4,
  },
  addressDetails: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  addForm: {
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  addFormTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 12,
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
    marginBottom: 10,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 4,
  },
  cancelButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  cancelButtonText: {
    color: theme.textSecondary,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: theme.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  saveButtonText: {
    color: '#000000',
    fontWeight: '700',
  },
});
