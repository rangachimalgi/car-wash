import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';
import { getModelsForBrand } from '../services/carsData';
import { addVehicle, setSelectedVehicle } from '../services/vehicleApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FALLBACK_CAR_IMAGE = require('../assets/carVehicle.png');

// Helper function to get car image URL
const getModelImageUrl = (brandName, modelName) => {
  const modelSlug = modelName.toLowerCase().replace(/\s+/g, '-');
  const brandSlug = brandName.toLowerCase().replace(/\s+/g, '-');
  // Pattern: https://imgd.aeplcdn.com/{brand}-{model}.jpg
  return `https://imgd.aeplcdn.com/${brandSlug}-${modelSlug}.jpg`;
};

// Memoized Model Card Component
const ModelCard = React.memo(({ item, brandName, theme, onPress, saving }) => {
  return (
    <TouchableOpacity 
      style={[styles.modelCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
      onPress={() => onPress(item.name)}
      activeOpacity={0.7}
      disabled={saving}
    >
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: item.imageUrl }}
          style={styles.modelImage}
          contentFit="contain"
          placeholder={FALLBACK_CAR_IMAGE}
          transition={200}
          cachePolicy="disk"
        />
      </View>
      <View style={styles.modelInfo}>
        <Text style={[styles.modelName, { color: theme.textPrimary }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.modelSubtext, { color: theme.textSecondary }]}>
          {saving ? 'Saving...' : 'Select Vehicle'}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

export default function ModelSelectionScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const debounceTimerRef = useRef(null);
  
  // Get brand name and vehicle type from route params
  const brandName = route?.params?.brandName || '';
  const vehicleType = route?.params?.vehicleType || '4WHEELER';
  
  // Debounce search query (300ms delay)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);
  
  // Pre-filter and memoize model data with pre-calculated image URLs
  const modelData = useMemo(() => {
    if (!brandName) return [];
    
    // Get all models for the brand (no limit to show all)
    const rawModels = getModelsForBrand(brandName, 1000); // High limit to get all models
    
    return rawModels.map(name => ({
      id: `${brandName}-${name}`,
      name,
      imageUrl: getModelImageUrl(brandName, name),
    }));
  }, [brandName]);
  
  // Filter models based on debounced search query
  const filteredModels = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return modelData;
    }
    
    const query = debouncedSearchQuery.toLowerCase().trim();
    return modelData.filter(m => 
      m.name.toLowerCase().includes(query)
    );
  }, [debouncedSearchQuery, modelData]);
  
  const handleSelect = useCallback(async (modelName) => {
    if (saving) return; // Prevent multiple taps
    
    try {
      setSaving(true);
      
      // Get user's phone number from AsyncStorage
      const phone = await AsyncStorage.getItem('authPhone');
      
      if (!phone) {
        Alert.alert(
          'Login Required',
          'Please login to save your vehicle.',
          [{ text: 'OK' }]
        );
        setSaving(false);
        return;
      }
      
      // Prepare vehicle data
      // Format: "Brand Model" (e.g., "Maruti Suzuki Swift")
      const vehicleModel = `${brandName} ${modelName}`;
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
        
        // Also save to AsyncStorage for quick access
        await AsyncStorage.setItem(`userVehicleType:${phone}`, vehicleType);
        await AsyncStorage.setItem(`userVehicleModel:${phone}`, vehicleModel);
      }
      
      // Show success message
      Alert.alert(
        'Vehicle Saved',
        `Your ${brandName} ${modelName} has been saved successfully!`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to home/main screen after saving
              // Reset navigation stack to avoid deep back navigation
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
              });
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('Error saving vehicle:', error);
      Alert.alert(
        'Error',
        'Failed to save vehicle. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSaving(false);
    }
  }, [brandName, vehicleType, navigation, saving]);
  
  const renderItem = useCallback(({ item }) => (
    <ModelCard 
      item={item} 
      brandName={brandName} 
      theme={theme} 
      onPress={handleSelect}
      saving={saving}
    />
  ), [brandName, theme, handleSelect, saving]);
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Sticky Header */}
      <View style={[styles.stickyHeader, { paddingTop: insets.top, backgroundColor: theme.background }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons 
            name="arrow-left" 
            size={24} 
            color={theme.textPrimary} 
          />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.brandNameHeader, { color: theme.textPrimary }]} numberOfLines={1}>
            {brandName}
          </Text>
        </View>
        <View style={styles.backButton} />
      </View>
      
      {/* Sticky Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.background }]}>
        <View style={[styles.searchBar, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <MaterialCommunityIcons 
            name="magnify" 
            size={20} 
            color={theme.textSecondary} 
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder="Search models..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons 
                name="close-circle" 
                size={20} 
                color={theme.textSecondary} 
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Models List */}
      <FlashList
        data={filteredModels}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        estimatedItemSize={180}
        contentContainerStyle={styles.listPadding}
        removeClippedSubviews={true}
        drawDistance={200}
        showsVerticalScrollIndicator={false}
        extraData={theme}
        scrollEnabled={!saving}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons 
              name="car-off" 
              size={48} 
              color={theme.textSecondary} 
            />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              {searchQuery ? 'No models found matching your search' : 'No models available'}
            </Text>
          </View>
        }
      />
      
      {/* Loading Overlay */}
      {saving && (
        <View style={[styles.loadingOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.3)' }]}>
          <View style={[styles.loadingContainer, { backgroundColor: theme.cardBackground }]}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={[styles.loadingText, { color: theme.textPrimary }]}>
              Saving vehicle...
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stickyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  brandNameHeader: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  listPadding: {
    padding: 12,
  },
  modelCard: {
    flex: 1,
    margin: 6,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 100,
    backgroundColor: '#F8F8F8',
    padding: 8,
  },
  modelImage: {
    width: '100%',
    height: '100%',
  },
  modelInfo: {
    padding: 10,
    alignItems: 'center',
  },
  modelName: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  modelSubtext: {
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 150,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
});
