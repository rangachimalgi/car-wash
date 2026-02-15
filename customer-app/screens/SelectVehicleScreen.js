import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import { getVehicles, addVehicle, deleteVehicle, setSelectedVehicle } from '../services/vehicleApi';

const FALLBACK_IMAGE = require('../assets/fallback.png');
const FALLBACK_BIKE_IMAGE = require('../assets/fallbackBike.png');

export default function SelectVehicleScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { theme, isLightMode } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState('');

  useEffect(() => {
    const loadPhone = async () => {
      const storedPhone = await AsyncStorage.getItem('authPhone');
      setPhone(storedPhone || '');
    };
    loadPhone().catch(error => console.warn('Failed to load phone:', error));
  }, []);

  const loadVehicles = async () => {
    if (!phone) return;
    
    setLoading(true);
    try {
      const vehiclesData = await getVehicles(phone);
      setVehicles(vehiclesData || []);
      
      // Load selected vehicle from AsyncStorage
      const selectedId = await AsyncStorage.getItem(`selectedVehicleId:${phone}`);
      setSelectedVehicleId(selectedId);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      // Try to load from AsyncStorage as fallback
      try {
        const storedVehicles = await AsyncStorage.getItem(`userVehicles:${phone}`);
        if (storedVehicles) {
          setVehicles(JSON.parse(storedVehicles));
        }
      } catch (e) {
        console.error('Error loading from AsyncStorage:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadVehicles();
    }, [phone])
  );

  const handleSelectVehicle = async (vehicleId) => {
    if (!phone) return;
    
    try {
      await setSelectedVehicle(phone, vehicleId);
      setSelectedVehicleId(vehicleId);
      await AsyncStorage.setItem(`selectedVehicleId:${phone}`, vehicleId);
    } catch (error) {
      console.error('Error selecting vehicle:', error);
      // Still save locally
      setSelectedVehicleId(vehicleId);
      await AsyncStorage.setItem(`selectedVehicleId:${phone}`, vehicleId);
    }
  };

  const handleDeleteVehicle = (vehicleId) => {
    Alert.alert(
      'Delete Vehicle',
      'Are you sure you want to delete this vehicle?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!phone) return;
            
            try {
              await deleteVehicle(phone, vehicleId);
              // Reload vehicles
              await loadVehicles();
              
              // If deleted vehicle was selected, clear selection
              if (selectedVehicleId === vehicleId) {
                setSelectedVehicleId(null);
                await AsyncStorage.removeItem(`selectedVehicleId:${phone}`);
              }
            } catch (error) {
              console.error('Error deleting vehicle:', error);
              Alert.alert('Error', 'Failed to delete vehicle. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleAddNewVehicle = () => {
    navigation.navigate('VehicleDetails');
  };

  const getVehicleImage = (vehicleType) => {
    if (vehicleType === 'Bike' || vehicleType === '2 wheeler bike') {
      return FALLBACK_BIKE_IMAGE;
    }
    return FALLBACK_IMAGE;
  };

  const formatVehicleName = (vehicleModel) => {
    // Parse "Hyundai Elantra" to "Elantra, Hyundai"
    if (!vehicleModel) return '';
    const parts = vehicleModel.split(' ');
    if (parts.length >= 2) {
      const brand = parts[0];
      const model = parts.slice(1).join(' ');
      return `${model}, ${brand}`;
    }
    return vehicleModel;
  };

  return (
    <View style={styles.container}>
      <StatusBar style={isLightMode ? 'dark' : 'light'} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Vehicle</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddNewVehicle}
          >
            <Text style={styles.addButtonText}>+ Add New Vehicle</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: 20 + insets.bottom }]}
      >
        <Text style={styles.sectionTitle}>Saved Vehicles</Text>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading vehicles...</Text>
          </View>
        ) : vehicles.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="car-off" size={48} color={theme.textSecondary} />
            <Text style={styles.emptyText}>No vehicles saved yet</Text>
            <TouchableOpacity 
              style={styles.addFirstButton}
              onPress={handleAddNewVehicle}
            >
              <Text style={styles.addFirstButtonText}>Add Your First Vehicle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.vehiclesList}>
            {vehicles.map((vehicle) => {
              const isSelected = selectedVehicleId === vehicle._id || selectedVehicleId === vehicle.id;
              const vehicleName = formatVehicleName(vehicle.vehicleModel);
              
              return (
                <View key={vehicle._id || vehicle.id} style={styles.vehicleItem}>
                  <TouchableOpacity
                    style={styles.vehicleContent}
                    onPress={() => handleSelectVehicle(vehicle._id || vehicle.id)}
                    activeOpacity={0.7}
                  >
                    <Image 
                      source={getVehicleImage(vehicle.vehicleType)} 
                      style={styles.vehicleImage}
                      resizeMode="contain"
                    />
                    <View style={styles.vehicleInfo}>
                      <Text style={[
                        styles.vehicleName,
                        isSelected && styles.vehicleNameSelected
                      ]}>
                        {vehicleName || vehicle.vehicleModel || 'Unknown Vehicle'}
                      </Text>
                    </View>
                    {isSelected && (
                      <MaterialCommunityIcons 
                        name="check-circle" 
                        size={24} 
                        color="#007AFF" 
                        style={styles.checkIcon}
                      />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteVehicle(vehicle._id || vehicle.id)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="delete-outline" size={24} color="#FF4444" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      backgroundColor: theme.headerBackground || theme.background,
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.cardBorder,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    backButton: {
      paddingVertical: 8,
      paddingRight: 8,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.textPrimary,
      flex: 1,
      marginLeft: 8,
    },
    addButton: {
      backgroundColor: theme.cardBackground || '#F5F5F5',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.cardBorder || '#E0E0E0',
    },
    addButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 16,
      paddingTop: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textSecondary,
      marginBottom: 16,
    },
    vehiclesList: {
      gap: 0,
    },
    vehicleItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.cardBorder || '#E0E0E0',
    },
    vehicleContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    vehicleImage: {
      width: 60,
      height: 60,
      borderRadius: 8,
      marginRight: 12,
    },
    vehicleInfo: {
      flex: 1,
    },
    vehicleName: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.textPrimary,
    },
    vehicleNameSelected: {
      color: '#007AFF',
      fontWeight: '600',
    },
    checkIcon: {
      marginLeft: 8,
    },
    deleteButton: {
      padding: 8,
      marginLeft: 8,
    },
    loadingContainer: {
      paddingVertical: 32,
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    emptyContainer: {
      paddingVertical: 64,
      alignItems: 'center',
    },
    emptyText: {
      marginTop: 16,
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 24,
    },
    addFirstButton: {
      backgroundColor: theme.accent || '#007AFF',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    addFirstButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
  });
