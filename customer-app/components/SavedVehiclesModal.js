import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Modal from 'react-native-modal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { Image } from 'expo-image';
import { getVehicles, deleteVehicle, setSelectedVehicle, addVehicle } from '../services/vehicleApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getVehicleKeys } from '../services/addressStorage';
import {
  filterVehiclesForService,
  getVehicleFilterLabel,
} from '../utils/vehicleServiceMatch';

const FALLBACK_CAR_IMAGE = require('../assets/carVehicle.png');
const FALLBACK_BIKE_IMAGE = require('../assets/fallbackBike.png');

export default function SavedVehiclesModal({ visible, onClose, navigation, serviceCategory = null }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showCustomVehicleModal, setShowCustomVehicleModal] = useState(false);
  const [customBrand, setCustomBrand] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [savingCustomVehicle, setSavingCustomVehicle] = useState(false);

  const filteredVehicles = useMemo(
    () => filterVehiclesForService(vehicles, serviceCategory),
    [vehicles, serviceCategory]
  );
  const vehicleFilterLabel = getVehicleFilterLabel(serviceCategory);

  // Load vehicles and selected vehicle
  const loadVehicles = useCallback(async () => {
    try {
      setLoading(true);
      const phone = await AsyncStorage.getItem('authPhone');
      if (!phone) {
        setVehicles([]);
        setLoading(false);
        return;
      }

      let userVehicles = await getVehicles(phone);
      
      // Ensure we have an array
      let vehiclesArray = Array.isArray(userVehicles) ? userVehicles : [];
      
      // If no vehicles from API, check AsyncStorage directly (user-scoped key)
      if (vehiclesArray.length === 0) {
        const vKeys = await getVehicleKeys();
        const storedVehicles = await AsyncStorage.getItem(vKeys.vehicles);
        if (storedVehicles) {
          try {
            const parsed = JSON.parse(storedVehicles);
            if (Array.isArray(parsed) && parsed.length > 0) {
              vehiclesArray = parsed;
            }
          } catch (e) {
            console.warn('Error parsing stored vehicles:', e);
          }
        }
      }
      
      // Ensure all vehicles have proper ID fields
      vehiclesArray = vehiclesArray.map((vehicle, index) => {
        // Ensure _id or id exists
        if (!vehicle._id && !vehicle.id) {
          console.warn('Vehicle missing ID:', vehicle);
        }
        return vehicle;
      });
      
      setVehicles(vehiclesArray);

      // Get selected vehicle ID (user-scoped key)
      const vKeysForSelected = await getVehicleKeys();
      const storedSelectedId = await AsyncStorage.getItem(vKeysForSelected.selectedVehicleId);
      if (storedSelectedId) {
        setSelectedVehicleId(storedSelectedId);
      } else if (vehiclesArray.length > 0) {
        // Find vehicle with isSelected flag
        const selected = vehiclesArray.find(v => v.isSelected);
        if (selected) {
          const id = selected._id || selected.id;
          if (id) {
            setSelectedVehicleId(id.toString());
          }
        }
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      loadVehicles();
    }
  }, [visible, loadVehicles]);

  // Handle vehicle selection
  const handleSelectVehicle = useCallback(async (vehicle) => {
    try {
      const phone = await AsyncStorage.getItem('authPhone');
      if (!phone) return;

      const vehicleId = vehicle._id || vehicle.id;
      if (!vehicleId) return;

      // Update selected vehicle
      await setSelectedVehicle(phone, vehicleId.toString());
      setSelectedVehicleId(vehicleId.toString());

      // Save to AsyncStorage for quick access (user-scoped)
      const vKeys = await getVehicleKeys();
      const vehicleModel = vehicle.vehicleModel || '';
      const vehicleType = vehicle.vehicleType || '';
      await AsyncStorage.setItem(vKeys.vehicleType, vehicleType);
      await AsyncStorage.setItem(vKeys.vehicleModel, vehicleModel);
      await AsyncStorage.setItem(vKeys.selectedVehicleId, vehicleId.toString());

      // Close modal after selection
      onClose();
    } catch (error) {
      console.error('Error selecting vehicle:', error);
      Alert.alert('Error', 'Failed to select vehicle. Please try again.');
    }
  }, [onClose]);

  // Handle vehicle deletion
  const handleDeleteVehicle = useCallback(async (vehicle) => {
    const vehicleId = vehicle._id || vehicle.id;
    if (!vehicleId) return;

    Alert.alert(
      'Delete Vehicle',
      `Are you sure you want to delete ${vehicle.vehicleModel || 'this vehicle'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(vehicleId.toString());
              const phone = await AsyncStorage.getItem('authPhone');
              if (!phone) return;

              await deleteVehicle(phone, vehicleId.toString());

              // Reload vehicles
              await loadVehicles();

              // If deleted vehicle was selected, clear selection (user-scoped keys)
              if (selectedVehicleId === vehicleId.toString()) {
                setSelectedVehicleId(null);
                const vKeys = await getVehicleKeys();
                await AsyncStorage.removeItem(vKeys.vehicleType);
                await AsyncStorage.removeItem(vKeys.vehicleModel);
                await AsyncStorage.removeItem(vKeys.selectedVehicleId);
              }
            } catch (error) {
              console.error('Error deleting vehicle:', error);
              Alert.alert('Error', 'Failed to delete vehicle. Please try again.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  }, [loadVehicles, selectedVehicleId]);

  // Handle add new vehicle
  const handleAddNewVehicle = useCallback(() => {
    onClose();
    navigation?.navigate('SelectVehicle');
  }, [navigation, onClose]);

  // Handle save custom vehicle
  const handleSaveCustomVehicle = useCallback(async () => {
    if (!customBrand.trim() || !customModel.trim()) {
      Alert.alert('Required Fields', 'Please enter both brand and model name.');
      return;
    }

    if (savingCustomVehicle) return;

    try {
      setSavingCustomVehicle(true);

      // Get user's phone number from AsyncStorage
      const phone = await AsyncStorage.getItem('authPhone');
      
      if (!phone) {
        Alert.alert(
          'Login Required',
          'Please login to save your vehicle.',
          [{ text: 'OK' }]
        );
        setSavingCustomVehicle(false);
        return;
      }
      
      // Determine vehicle type from existing vehicles or default to 4WHEELER
      let vehicleType = '4WHEELER';
      if (vehicles.length > 0) {
        // Check if user has any 2-wheelers
        const has2Wheeler = vehicles.some(v => {
          const type = (v.vehicleType || '').toLowerCase();
          return type === '2wheeler' || type.includes('bike') || 
                 (type.includes('2') && type.includes('wheeler'));
        });
        // If they have 2-wheelers, we could ask, but for simplicity, default to 4WHEELER
        // Or we could add a picker, but user said "no car type" so just use 4WHEELER
      }
      
      // Prepare vehicle data
      const vehicleModel = `${customBrand.trim()} ${customModel.trim()}`;
      const vehicleData = {
        vehicleType: vehicleType,
        vehicleModel: vehicleModel,
      };
      
      // Save vehicle to database
      const savedVehicle = await addVehicle(phone, vehicleData);
      
      // Set as selected vehicle if it has an ID
      if (savedVehicle?._id || savedVehicle?.id) {
        const vehicleId = savedVehicle._id || savedVehicle.id;
        await setSelectedVehicle(phone, vehicleId);
        
        // Also save to AsyncStorage for quick access (user-scoped)
        const vKeys = await getVehicleKeys();
        await AsyncStorage.setItem(vKeys.vehicleType, vehicleType);
        await AsyncStorage.setItem(vKeys.vehicleModel, vehicleModel);
      }
      
      // Reload vehicles list
      await loadVehicles();
      
      // Show success message
      Alert.alert(
        'Vehicle Saved',
        `Your ${vehicleModel} has been saved successfully!`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form and close modal
              setCustomBrand('');
              setCustomModel('');
              setShowCustomVehicleModal(false);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error saving custom vehicle:', error);
      Alert.alert(
        'Error',
        'Failed to save vehicle. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSavingCustomVehicle(false);
    }
  }, [customBrand, customModel, vehicles, loadVehicles, savingCustomVehicle]);

  // Get vehicle image source
  const getVehicleImage = (vehicle) => {
    const vehicleType = (vehicle.vehicleType || '').toLowerCase();
    // Check specifically for 2-wheeler patterns (not 4WHEELER)
    const is2Wheeler = vehicleType === '2wheeler' || 
                      vehicleType === '2-wheeler' || 
                      (vehicleType.startsWith('2') && vehicleType.includes('wheeler') && !vehicleType.includes('4')) ||
                      vehicleType.includes('bike');
    if (is2Wheeler) {
      return FALLBACK_BIKE_IMAGE;
    }
    return FALLBACK_CAR_IMAGE;
  };

  // Format vehicle display name
  const getVehicleDisplayName = (vehicle) => {
    const model = vehicle.vehicleModel || vehicle.model || '';
    const type = (vehicle.vehicleType || vehicle.type || '').toLowerCase();
    
    // Check specifically for 2-wheeler patterns (not 4WHEELER)
    const is2Wheeler = type === '2wheeler' || 
                      type === '2-wheeler' || 
                      (type.startsWith('2') && type.includes('wheeler') && !type.includes('4')) ||
                      type.includes('bike');
    
    // If it's a 2-wheeler, show as "BIKE, 2-Wheeler"
    if (is2Wheeler) {
      return 'BIKE, 2-Wheeler';
    }
    
    // Extract model and brand from "Brand Model" format (e.g., "Hyundai i20" -> "i20, Hyundai")
    const parts = model.split(' ').filter(p => p.trim());
    if (parts.length >= 2) {
      const brandName = parts[0]; // First part is brand
      const modelName = parts.slice(1).join(' '); // Rest is model
      return `${modelName}, ${brandName}`;
    }
    
    // Fallback: just return the model or type
    return model || type || 'Unknown Vehicle';
  };

  // Don't render modal content when not visible to prevent unnecessary renders
  if (!visible) {
    return null;
  }

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onSwipeComplete={onClose}
      swipeDirection="down"
      style={styles.modal}
      backdropOpacity={0.5}
      animationIn="slideInUp"
      animationOut="slideOutDown"
    >
      <View style={[
        styles.modalContent, 
        { 
          backgroundColor: theme.background, 
          paddingBottom: insets.bottom
        }
      ]}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Select Vehicle</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.cantFindButton}
              onPress={() => setShowCustomVehicleModal(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.cantFindButtonText}>Can't find?</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddNewVehicle}
              activeOpacity={0.7}
            >
              <Text style={styles.addButtonText}>+ Add New</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Saved Vehicles Section */}
        <View style={styles.sectionHeaderContainer}>
          <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>Saved Vehicles</Text>
          {!loading && (
            <Text style={[styles.debugText, { color: theme.textSecondary }]}>
              ({filteredVehicles.length} vehicles)
            </Text>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.accent} />
          </View>
        ) : !filteredVehicles || filteredVehicles.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="car-off" size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              {vehicles.length > 0 && serviceCategory
                ? `No saved ${vehicleFilterLabel}s for this service`
                : 'No saved vehicles'}
            </Text>
            <TouchableOpacity
              style={[styles.addFirstButton, { backgroundColor: theme.accent }]}
              onPress={handleAddNewVehicle}
              activeOpacity={0.7}
            >
              <Text style={styles.addFirstButtonText}>Add Your First Vehicle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView 
            style={styles.vehiclesList}
            contentContainerStyle={styles.vehiclesListContent}
            showsVerticalScrollIndicator={filteredVehicles.length > 5}
            nestedScrollEnabled={true}
          >
              {filteredVehicles.map((vehicle, index) => {
              // Handle both _id (MongoDB) and id (local) formats
              const vehicleId = vehicle._id?.toString() || vehicle.id?.toString() || `vehicle-${index}`;
              const isSelected = selectedVehicleId === vehicleId;
              const isDeleting = deletingId === vehicleId;


              return (
                <View key={vehicleId} style={styles.vehicleItem}>
                  <TouchableOpacity
                    style={styles.vehicleContent}
                    onPress={() => handleSelectVehicle(vehicle)}
                    activeOpacity={0.7}
                    disabled={isDeleting}
                  >
                    {/* Vehicle Image */}
                    <Image
                      source={getVehicleImage(vehicle)}
                      style={styles.vehicleImage}
                      contentFit="cover"
                      cachePolicy="disk"
                    />

                    {/* Vehicle Info */}
                    <View style={styles.vehicleInfo}>
                      <Text
                        style={[
                          styles.vehicleName,
                          { color: isSelected ? theme.accent : theme.textPrimary },
                        ]}
                        numberOfLines={1}
                      >
                        {getVehicleDisplayName(vehicle)}
                      </Text>
                    </View>

                    {/* Checkmark for selected vehicle */}
                    {isSelected && (
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={24}
                        color={theme.accent}
                        style={styles.checkIcon}
                      />
                    )}
                  </TouchableOpacity>

                  {/* Delete Button */}
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteVehicle(vehicle)}
                    activeOpacity={0.7}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <ActivityIndicator size="small" color="#FF5252" />
                    ) : (
                      <MaterialCommunityIcons name="delete-outline" size={20} color="#FF5252" />
                    )}
                  </TouchableOpacity>
                </View>
              );
              })}
            </ScrollView>
        )}
      </View>

      {/* Custom Vehicle Modal */}
      <Modal
        isVisible={showCustomVehicleModal}
        onBackdropPress={() => setShowCustomVehicleModal(false)}
        onSwipeComplete={() => setShowCustomVehicleModal(false)}
        swipeDirection="down"
        style={styles.modal}
        backdropOpacity={0.5}
        animationIn="slideInUp"
        animationOut="slideOutDown"
      >
        <View style={[styles.customModalContent, { backgroundColor: theme.background, paddingBottom: insets.bottom }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Enter Your Vehicle Details</Text>
            <TouchableOpacity
              onPress={() => setShowCustomVehicleModal(false)}
              style={styles.modalCloseButton}
            >
              <MaterialCommunityIcons name="close" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.customModalBody}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Enter your brand</Text>
            <View style={[styles.inputContainer, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
              <MaterialCommunityIcons name="car" size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.textPrimary }]}
                placeholder="e.g., Audi, Hyundai, Tata"
                placeholderTextColor={theme.textSecondary}
                value={customBrand}
                onChangeText={setCustomBrand}
                autoCapitalize="words"
              />
            </View>

            <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 20 }]}>Enter your model name</Text>
            <View style={[styles.inputContainer, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
              <MaterialCommunityIcons name="car-sports" size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.textPrimary }]}
                placeholder="e.g., A4, Creta, Harrier"
                placeholderTextColor={theme.textSecondary}
                value={customModel}
                onChangeText={setCustomModel}
                autoCapitalize="words"
              />
            </View>

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.accent }, savingCustomVehicle && styles.saveButtonDisabled]}
              onPress={handleSaveCustomVehicle}
              disabled={savingCustomVehicle}
              activeOpacity={0.7}
            >
              <Text style={styles.saveButtonText}>
                {savingCustomVehicle ? 'Saving...' : 'Save Vehicle'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    maxHeight: '90%',
    minHeight: 200,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cantFindButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8F9FA',
  },
  cantFindButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8F9FA',
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  customModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    maxHeight: '80%',
  },
  modalCloseButton: {
    padding: 4,
  },
  customModalBody: {
    paddingBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 50,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  saveButton: {
    marginTop: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '500',
  },
  debugText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  addFirstButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  vehiclesList: {
    flexGrow: 1,
  },
  vehiclesListContent: {
    paddingBottom: 20,
  },
  vehicleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  vehicleContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '500',
  },
  checkIcon: {
    marginLeft: 8,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
});
