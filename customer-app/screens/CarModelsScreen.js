import React, { useMemo, useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext';
import { getModelsForBrand } from '../services/carsData';
import { updateUserVehicle } from '../services/userApi';
import { addVehicle } from '../services/vehicleApi';

const CAR_IMAGE = require('../assets/fallback.png');

export default function CarModelsScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { theme, isLightMode } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [phone, setPhone] = useState('');

  const brandName = route?.params?.brandName || '';

  useEffect(() => {
    const loadPhone = async () => {
      const storedPhone = await AsyncStorage.getItem('authPhone');
      setPhone(storedPhone || '');
    };
    loadPhone().catch(error => console.warn('Failed to load phone:', error));
  }, []);

  useEffect(() => {
    if (brandName) {
      loadModels(brandName);
    }
  }, [brandName]);

  const loadModels = (brand) => {
    setLoading(true);
    try {
      // Get models from local data (limited to 20)
      const brandModels = getModelsForBrand(brand, 20);
      setModels(brandModels);
    } catch (err) {
      console.error('Error loading models:', err);
      setModels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleModelSelect = async (modelName) => {
    console.log('Model selected:', modelName, 'for brand:', brandName);
    
    if (!phone) {
      Alert.alert('Missing phone', 'Please login to save vehicle details.');
      return;
    }

    setSaving(true);
    const vehicleModel = `${brandName} ${modelName}`;
    
    try {
      // Try to add vehicle to vehicles array
      try {
        await addVehicle(phone, {
          vehicleType: 'Car',
          vehicleModel: vehicleModel,
        });
      } catch (networkError) {
        console.warn('Network error, saving locally only:', networkError);
        // Fallback to old API for backward compatibility
        try {
          await updateUserVehicle({ 
            phone, 
            vehicleType: 'Car', 
            vehicleModel: vehicleModel 
          });
        } catch (e) {
          console.warn('Fallback API also failed:', e);
        }
      }
      
      // Always save to local storage
      await AsyncStorage.setItem(`userVehicleType:${phone}`, 'Car');
      await AsyncStorage.setItem(`userVehicleModel:${phone}`, vehicleModel);
      
      Alert.alert('Saved', `Vehicle model "${vehicleModel}" has been saved.`);
      // Navigate to Home screen
      navigation.navigate('MainTabs', { screen: 'Home' });
    } catch (error) {
      console.error('Save vehicle error:', error);
      Alert.alert(
        'Connection Error', 
        'Unable to connect to server. Please check your internet connection. Your selection has been saved locally.'
      );
      // Still navigate to home even if there's an error, since we saved locally
      navigation.navigate('MainTabs', { screen: 'Home' });
    } finally {
      setSaving(false);
    }
  };

  // Generate model image URL
  const getModelImageUrl = (brand, model) => {
    if (!brand || !model) return '';
    const brandSlug = brand.trim().toLowerCase().split(' ')[0].replace(/[^a-z0-9]/g, '');
    const modelSlug = model.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    return `https://imgd.aeplcdn.com/476x268/n/${brandSlug}-${modelSlug}.jpg`;
  };

  const [imageErrors, setImageErrors] = useState({});

  const handleImageError = (modelIndex) => {
    setImageErrors(prev => ({ ...prev, [modelIndex]: true }));
  };

  // Filter models based on search query
  const filteredModels = useMemo(() => {
    if (!searchQuery.trim()) return models;
    const query = searchQuery.toLowerCase();
    return models.filter(model => 
      model.toLowerCase().includes(query)
    );
  }, [models, searchQuery]);


  return (
    <View style={styles.container}>
      <StatusBar style={isLightMode ? 'dark' : 'light'} />
      
      {/* Custom Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{brandName || 'Select Model'}</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={styles.loadingText}>Loading models...</Text>
        </View>
      ) : models.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="car-off" size={48} color={theme.textSecondary} />
          <Text style={styles.emptyText}>No models found for {brandName}</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingBottom: 20 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <MaterialCommunityIcons name="magnify" size={20} color={theme.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${brandName} models...`}
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <Text style={styles.sectionTitle}>Available Models ({filteredModels.length})</Text>
          <View style={styles.separatorLine} />
          {filteredModels.length === 0 ? (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>No models found matching "{searchQuery}"</Text>
            </View>
          ) : (
            <View style={styles.modelsGrid}>
              {filteredModels.map((model, index) => {
                // Find original index for image error tracking
                const originalIndex = models.indexOf(model);
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.modelCard}
                    onPress={() => handleModelSelect(model)}
                    disabled={saving}
                    activeOpacity={0.7}
                  >
                    <Image 
                      source={imageErrors[originalIndex] ? CAR_IMAGE : { uri: getModelImageUrl(brandName, model) }}
                      style={styles.modelImage} 
                      resizeMode="cover"
                      onError={() => handleImageError(originalIndex)}
                      defaultSource={CAR_IMAGE}
                    />
                    <Text style={styles.modelName}>{model}</Text>
                    <View style={styles.cardSeparatorLine} />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
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
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.textPrimary,
      flex: 1,
      marginLeft: 8,
    },
    headerSpacer: {
      width: 32, // Same width as back button to center title
    },
    scrollView: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.cardBackground || '#FFFFFF',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.cardBorder || '#E0E0E0',
      paddingHorizontal: 12,
      marginBottom: 24,
      height: 48,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: theme.textPrimary,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.textPrimary,
      marginBottom: 12,
    },
    separatorLine: {
      height: 1,
      backgroundColor: theme.cardBorder || '#E0E0E0',
      marginBottom: 16,
    },
    modelsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    modelCard: {
      width: '30%',
      backgroundColor: 'transparent',
      padding: 8,
      marginBottom: 16,
      alignItems: 'center',
    },
    modelImage: {
      width: 100,
      height: 100,
      borderRadius: 8,
      marginBottom: 8,
      backgroundColor: 'transparent',
    },
    modelName: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.textPrimary,
      textAlign: 'center',
      marginBottom: 8,
    },
    cardSeparatorLine: {
      width: '100%',
      height: 1,
      backgroundColor: theme.cardBorder || '#E0E0E0',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: theme.textSecondary,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    emptyText: {
      marginTop: 16,
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
    },
    noResultsContainer: {
      paddingVertical: 32,
      alignItems: 'center',
    },
    noResultsText: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
    },
  });
