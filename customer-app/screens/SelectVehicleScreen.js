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

  const loadVehicles = React.useCallback(async (isCancelledRef) => {
    if (!phone) return;
    
    setLoading(true);
    
    try {
      // Try AsyncStorage first (faster)
      try {
        const storedVehicles = await AsyncStorage.getItem(`userVehicles:${phone}`);
        if (storedVehicles) {
          const parsed = JSON.parse(storedVehicles);
          if (!isCancelledRef.current) {
            setVehicles(parsed);
            setLoading(false);
          }
          // Load in background from API to sync (only if not cancelled)
          if (!isCancelledRef.current) {
            getVehicles(phone).then(vehiclesData => {
              if (!isCancelledRef.current && vehiclesData && vehiclesData.length > 0) {
                setVehicles(vehiclesData);
                AsyncStorage.setItem(`userVehicles:${phone}`, JSON.stringify(vehiclesData));
              }
            }).catch(() => {}); // Silent fail
          }
        } else {
          // No local cache, fetch from API
          const vehiclesData = await getVehicles(phone);
          if (!isCancelledRef.current) {
            setVehicles(vehiclesData || []);
            if (vehiclesData && vehiclesData.length > 0) {
              AsyncStorage.setItem(`userVehicles:${phone}`, JSON.stringify(vehiclesData));
            }
          }
        }
      } catch (e) {
        // Fallback to API
        if (!isCancelledRef.current) {
          const vehiclesData = await getVehicles(phone);
          setVehicles(vehiclesData || []);
        }
      }
      
      // Load selected vehicle from AsyncStorage
      if (!isCancelledRef.current) {
        const selectedId = await AsyncStorage.getItem(`selectedVehicleId:${phone}`);
        setSelectedVehicleId(selectedId);
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      if (!isCancelledRef.current) {
        setLoading(false);
      }
    }
  }, [phone]);

  useFocusEffect(
    React.useCallback(() => {
      const isCancelledRef = { current: false };
      loadVehicles(isCancelledRef);
      return () => {
        isCancelledRef.current = true;
      };
    }, [loadVehicles])
  );

  // Reset state on unmount
  React.useEffect(() => {
    return () => {
      setVehicles([]);
      setSelectedVehicleId(null);
      setLoading(true);
    };
  }, []);

  const handleSelectVehicle = React.useCallback(async (vehicleId) => {
    if (!phone) return;
    
    // Update UI immediately
    setSelectedVehicleId(vehicleId);
    await AsyncStorage.setItem(`selectedVehicleId:${phone}`, vehicleId);
    
    // Sync to server in background (non-blocking)
    setSelectedVehicle(phone, vehicleId).catch(error => {
      console.error('Error syncing selected vehicle:', error);
    });
  }, [phone]);

  const reloadVehicles = React.useCallback(async () => {
    if (!phone) return;
    
    try {
      // Try AsyncStorage first (faster)
      const storedVehicles = await AsyncStorage.getItem(`userVehicles:${phone}`);
      if (storedVehicles) {
        const parsed = JSON.parse(storedVehicles);
        setVehicles(parsed);
      }
      
      // Sync from API in background
      getVehicles(phone).then(vehiclesData => {
        if (vehiclesData && vehiclesData.length >= 0) {
          setVehicles(vehiclesData);
          if (vehiclesData.length > 0) {
            AsyncStorage.setItem(`userVehicles:${phone}`, JSON.stringify(vehiclesData));
          } else {
            AsyncStorage.removeItem(`userVehicles:${phone}`);
          }
        }
      }).catch(() => {});
    } catch (error) {
      console.error('Error reloading vehicles:', error);
    }
  }, [phone]);

  const handleDeleteVehicle = React.useCallback((vehicleId) => {
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
              // Update UI immediately (optimistic update)
              setVehicles(prev => prev.filter(v => {
                const id = v._id || v.id;
                return id && id.toString() !== vehicleId.toString();
              }));
              
              // Delete from server/AsyncStorage
              await deleteVehicle(phone, vehicleId);
              
              // If deleted vehicle was selected, clear selection
              if (selectedVehicleId === vehicleId || selectedVehicleId?.toString() === vehicleId.toString()) {
                setSelectedVehicleId(null);
                await AsyncStorage.removeItem(`selectedVehicleId:${phone}`);
              }
              
              // Reload to ensure sync
              await reloadVehicles();
            } catch (error) {
              console.error('Error deleting vehicle:', error);
              // Reload on error to restore correct state
              await reloadVehicles();
              Alert.alert('Error', 'Failed to delete vehicle. Please try again.');
            }
          },
        },
      ]
    );
  }, [phone, selectedVehicleId, reloadVehicles]);

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
    // But keep "2 wheeler bike" or "2 wheeler / bike" as-is
    if (!vehicleModel) return '';
    
    // Check if it's a 2 wheeler bike (don't reformat)
    if (vehicleModel.toLowerCase().includes('2 wheeler') || vehicleModel.toLowerCase().includes('bike')) {
      // If it doesn't have the slash, add it for display
      if (vehicleModel.includes('2 wheeler') && !vehicleModel.includes('/')) {
        return vehicleModel.replace('2 wheeler bike', '2 wheeler / bike');
      }
      return vehicleModel;
    }
    
    // For car models like "Hyundai Elantra", format to "Elantra, Hyundai"
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
