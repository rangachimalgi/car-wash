import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext';
import BackHeader from '../components/BackHeader';
import { updateUserVehicle } from '../services/userApi';
import { addVehicle } from '../services/vehicleApi';

const FOUR_WHEELER_IMAGE = require('../assets/carVehicle.png');
const TWO_WHEELER_IMAGE = require('../assets/fallbackBike.png');

export default function VehicleDetailsScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { theme, isLightMode } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedVehicleType, setSelectedVehicleType] = useState(null); // No default selection

  useEffect(() => {
    const loadPhone = async () => {
      const storedPhone = await AsyncStorage.getItem('authPhone');
      setPhone(storedPhone || '');
    };
    loadPhone().catch(error => console.warn('Failed to load phone:', error));
  }, []);

  const handleTwoWheeler = async () => {
    setSelectedVehicleType('2WHEELER');
    if (!phone) {
      Alert.alert('Missing phone', 'Please login to save vehicle details.');
      return;
    }
    setSaving(true);
    try {
      // Try to add vehicle to vehicles array
      try {
        await addVehicle(phone, {
          vehicleType: 'Bike',
          vehicleModel: '2 wheeler bike',
        });
      } catch (networkError) {
        console.warn('Network error, saving locally only:', networkError);
        // Fallback to old API for backward compatibility
        try {
          await updateUserVehicle({ phone, vehicleType: 'Bike', vehicleModel: '2 wheeler bike' });
        } catch (e) {
          console.warn('Fallback API also failed:', e);
        }
      }
      
      // Always save to local storage
      await AsyncStorage.setItem(`userVehicleType:${phone}`, 'Bike');
      await AsyncStorage.setItem(`userVehicleModel:${phone}`, '2 wheeler bike');
      
      Alert.alert('Saved', 'Vehicle details updated.');
      // Navigate to Home screen
      navigation.navigate('MainTabs', { screen: 'Home' });
    } catch (error) {
      console.error('Save vehicle error:', error);
      Alert.alert(
        'Connection Error', 
        'Unable to connect to server. Please check your internet connection and ensure the server is running. Your selection has been saved locally.'
      );
      // Navigate to Home screen
      navigation.navigate('MainTabs', { screen: 'Home' });
    } finally {
      setSaving(false);
    }
  };

  const handleFourWheeler = async () => {
    setSelectedVehicleType('4WHEELER');
    if (!phone) {
      Alert.alert('Missing phone', 'Please login to save vehicle details.');
      return;
    }
    setSaving(true);
    try {
      // For 4 wheeler, we'll save after model selection, so just navigate
      // But we can save a placeholder if needed
      await AsyncStorage.setItem(`userVehicleType:${phone}`, 'Car');
      
      // Navigate to next screen to select model
      navigation.navigate('FourWheelerDetails');
    } catch (error) {
      console.error('Error:', error);
      navigation.navigate('FourWheelerDetails');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style={isLightMode ? 'dark' : 'light'} />
      <BackHeader navigation={navigation} title="Choose Your Vehicle Type" />
      <View style={[styles.content, { paddingBottom: 20 + insets.bottom }]}>
        <Text style={styles.title}>Choose Your Vehicle Type</Text>
        <Text style={styles.subtitle}>You can add more vehicles from the home screen</Text>
        
        {/* 4 Wheeler Card */}
        <TouchableOpacity 
          style={[
            styles.vehicleCard,
            selectedVehicleType === '4WHEELER' && styles.vehicleCardSelected
          ]}
          onPress={handleFourWheeler}
          disabled={saving}
          activeOpacity={0.7}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardLeftContent}>
              <Text style={styles.cardPrefixText}>I have a</Text>
              <Text style={styles.vehicleTitle}>4 WHEELER</Text>
              {selectedVehicleType === '4WHEELER' && (
                <View style={styles.selectedIndicator}>
                  <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
                  <Text style={styles.selectedText}>Selected</Text>
                </View>
              )}
            </View>
            <View style={styles.cardImageContainer}>
              <Image 
                source={FOUR_WHEELER_IMAGE} 
                style={styles.vehicleImage}
                resizeMode="contain"
              />
            </View>
          </View>
        </TouchableOpacity>

        {/* OR Separator */}
        <View style={styles.separatorContainer}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorText}>OR</Text>
          <View style={styles.separatorLine} />
        </View>

        {/* 2 Wheeler Card */}
        <TouchableOpacity 
          style={[
            styles.vehicleCard,
            selectedVehicleType === '2WHEELER' && styles.vehicleCardSelected
          ]}
          onPress={handleTwoWheeler}
          disabled={saving}
          activeOpacity={0.7}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardLeftContent}>
              <Text style={styles.cardPrefixText}>I have a</Text>
              <Text style={styles.vehicleTitle}>2 WHEELER / BIKE</Text>
              {selectedVehicleType === '2WHEELER' && (
                <View style={styles.selectedIndicator}>
                  <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
                  <Text style={styles.selectedText}>Selected</Text>
                </View>
              )}
            </View>
            <View style={styles.cardImageContainer}>
              <Image 
                source={TWO_WHEELER_IMAGE} 
                style={styles.vehicleImage}
                resizeMode="contain"
              />
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      paddingHorizontal: 16,
      paddingTop: 24,
      flex: 1,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.textPrimary,
      marginBottom: 8,
      textAlign: 'left',
    },
    subtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 32,
      textAlign: 'left',
    },
    vehicleCard: {
      backgroundColor: '#F5F5F5',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#E0E0E0',
      marginBottom: 16,
      overflow: 'hidden',
    },
    vehicleCardSelected: {
      borderColor: '#4CAF50',
      borderWidth: 2,
      backgroundColor: '#F0F8F0',
    },
    cardContent: {
      flexDirection: 'row',
      padding: 20,
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    cardLeftContent: {
      flex: 1,
      justifyContent: 'center',
    },
    cardPrefixText: {
      fontSize: 14,
      color: '#FFA500',
      marginBottom: 8,
    },
    vehicleTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.textPrimary || '#000000',
      marginBottom: 8,
    },
    selectedIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
    },
    selectedText: {
      color: '#4CAF50',
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 6,
    },
    cardImageContainer: {
      width: 140,
      height: 140,
      justifyContent: 'center',
      alignItems: 'center',
    },
    vehicleImage: {
      width: 250,
      height: 200,
    },
    separatorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 16,
    },
    separatorLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.cardBorder || '#E0E0E0',
    },
    separatorText: {
      marginHorizontal: 16,
      fontSize: 14,
      color: theme.textSecondary || '#999999',
    },
  });
