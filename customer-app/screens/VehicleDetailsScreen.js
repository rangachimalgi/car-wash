import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext';
import BackHeader from '../components/BackHeader';
import { updateUserVehicle } from '../services/userApi';

export default function VehicleDetailsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { theme, isLightMode } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [vehicleType, setVehicleType] = useState('SUV');
  const [vehicleModel, setVehicleModel] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadVehicle = async () => {
      const storedPhone = await AsyncStorage.getItem('authPhone');
      setPhone(storedPhone || '');
      if (storedPhone) {
        const [storedType, storedModel] = await Promise.all([
          AsyncStorage.getItem(`userVehicleType:${storedPhone}`),
          AsyncStorage.getItem(`userVehicleModel:${storedPhone}`),
        ]);
        if (storedType) setVehicleType(storedType);
        if (storedModel) setVehicleModel(storedModel);
      }
    };
    loadVehicle().catch(error => console.warn('Failed to load vehicle:', error));
  }, []);

  const handleSave = async () => {
    if (!phone) {
      Alert.alert('Missing phone', 'Please login to save vehicle details.');
      return;
    }
    if (!vehicleModel.trim()) {
      Alert.alert('Missing model', 'Please enter your vehicle model.');
      return;
    }
    setSaving(true);
    try {
      await updateUserVehicle({ phone, vehicleType, vehicleModel: vehicleModel.trim() });
      await AsyncStorage.setItem(`userVehicleType:${phone}`, vehicleType);
      await AsyncStorage.setItem(`userVehicleModel:${phone}`, vehicleModel.trim());
      Alert.alert('Saved', 'Vehicle details updated.');
      navigation.goBack();
    } catch (error) {
      console.error('Save vehicle error:', error);
      Alert.alert('Error', 'Unable to save vehicle details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style={isLightMode ? 'dark' : 'light'} />
      <BackHeader navigation={navigation} title="Vehicle Details" />
      <View style={[styles.content, { paddingBottom: 20 + insets.bottom }]}>
        <Text style={styles.label}>Vehicle Type</Text>
        <View style={styles.typeRow}>
          {['SUV', 'Sedan', 'Hatchback'].map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.typeChip, vehicleType === type && styles.typeChipActive]}
              onPress={() => setVehicleType(type)}
            >
              <Text style={[styles.typeChipText, vehicleType === type && styles.typeChipTextActive]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Car Name & Model</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Hyundai i20"
          placeholderTextColor={theme.textSecondary}
          value={vehicleModel}
          onChangeText={setVehicleModel}
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Vehicle'}</Text>
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
      paddingTop: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textPrimary,
      marginBottom: 8,
    },
    typeRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 16,
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
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 14,
      color: theme.textPrimary,
      marginBottom: 20,
    },
    saveButton: {
      backgroundColor: theme.accent,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    saveButtonText: {
      color: '#000000',
      fontWeight: '700',
      fontSize: 14,
    },
  });
