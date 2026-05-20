import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Dimensions, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';
import Modal from 'react-native-modal';
import { getAllBrands, getPopularBrands, searchBrandsByModel } from '../services/carsData';
import { addVehicle, setSelectedVehicle } from '../services/vehicleApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getVehicleKeys } from '../services/addressStorage';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Comprehensive mapping of brand names to their slug format in the dataset
// The dataset uses lowercase slugs (e.g., "volkswagen", "tata", "honda")
const BRAND_NAME_MAP = {
    'tata': 'tata',
    'honda': 'honda',
    'hyundai': 'hyundai',
    'mahindra': 'mahindra',
    'kia': 'kia',
    'maruti suzuki': 'maruti',
    'maruti-suzuki': 'maruti',
    'mercedes-benz': 'mercedes',
    'mercedes benz': 'mercedes',
    'land rover': 'land-rover',
    'land-rover': 'land-rover',
    'land rover rover': 'land-rover',
    'rolls-royce': 'rolls-royce',
    'rolls royce': 'rolls-royce',
    'aston martin': 'aston-martin',
    'aston-martin': 'aston-martin',
    'bmw': 'bmw',
    'volkswagen': 'volkswagen',
    'ford': 'ford',
    'toyota': 'toyota',
    'nissan': 'nissan',
    'renault': 'renault',
    'skoda': 'skoda',
    'mg': 'mg',
    'volvo': 'volvo',
    'jeep': 'jeep',
    'jaguar': 'jaguar',
    'fiat': 'fiat',
    'isuzu': 'isuzu',
    'force': 'force',
    'datsun': 'datsun',
    'bajaj': 'bajaj',
    'ferrari': 'ferrari',
    'lamborghini': 'lamborghini',
    'porsche': 'porsche',
    'bentley': 'bentley',
    'maserati': 'maserati',
    'lexus': 'lexus',
    'mini': 'mini',
    'mitsubishi': 'mitsubishi',
    'premier': 'premier',
    'dc': 'dc',
    'icml': 'icml',
    'bugatti': 'bugatti',
    'audi': 'audi',
};

// Helper function to get logo URL for a brand
// Uses GitHub CDN: filippofilip95/car-logos-dataset
// Falls back to Clearbit if GitHub logo not found
const getBrandLogoUrl = (brandName) => {
  // Normalize brand name for lookup
  const normalizedName = brandName.toLowerCase().trim();
  
  // Get the mapped file name, or generate a slug
  let fileName = BRAND_NAME_MAP[normalizedName];
  
  if (!fileName) {
    // Fallback: generate slug from brand name
    fileName = normalizedName.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }
  
  // Use optimized version for best balance of quality and performance
  // Structure: /logos/optimized/{fileName}.png
  const githubUrl = `https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/${fileName}.png`;
  
  // Debug: log brand name and generated URL to catch mismatches
  if (brandName.toLowerCase().includes('volvo') || brandName.toLowerCase().includes('volkswagen')) {
    console.log(`Brand: ${brandName} -> Normalized: ${normalizedName} -> FileName: ${fileName} -> URL: ${githubUrl}`);
  }
  
  return githubUrl;
};

// Fallback function for Clearbit (used when GitHub logo fails)
const getClearbitLogoUrl = (brandName) => {
  let cleanName = brandName.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Manual fixes for Clearbit
  const clearbitFixes = {
    'marutisuzuki': 'marutisuzuki',
    'mercedesbenz': 'mercedes-benz',
    'landrover': 'landrover',
    'rollsroyce': 'rolls-royce',
  };
  
  const domain = clearbitFixes[cleanName] || cleanName;
  return `https://logo.clearbit.com/${domain}.com`;
};

// Avatar Component for brand fallback
const BrandAvatar = ({ name, theme, size = 50 }) => {
  const firstLetter = name?.charAt(0)?.toUpperCase() || '?';
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52BE80'
  ];
  // Generate consistent color based on brand name
  const colorIndex = name?.charCodeAt(0) % colors.length || 0;
  const avatarColor = colors[colorIndex];

  return (
    <View style={[styles.avatarContainer, { 
      width: size, 
      height: size, 
      borderRadius: size / 2,
      backgroundColor: avatarColor 
    }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>
        {firstLetter}
      </Text>
    </View>
  );
};

// Brand Card Component (memoized for performance)
const BrandCard = React.memo(({ item, onPress, theme }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(item.logoUrl);
  const [urlAttempt, setUrlAttempt] = useState(0);
  
  // Reset state when item changes
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
    setCurrentImageUrl(item.logoUrl);
    setUrlAttempt(0);
  }, [item.name, item.logoUrl]);
  
  const handleImageError = () => {
    const normalizedName = item.name.toLowerCase().trim();
    let nextUrl = null;
    
    // Get the proper brand slug from the mapping (same logic as getBrandLogoUrl)
    let fileName = BRAND_NAME_MAP[normalizedName];
    if (!fileName) {
      fileName = normalizedName.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }
    
    // Try different URL variations based on the dataset structure
    if (urlAttempt === 0) {
      // Try thumb version (smaller, faster)
      nextUrl = `https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/${fileName}.png`;
      setUrlAttempt(1);
    } else if (urlAttempt === 1) {
      // Try original version (JPG format)
      nextUrl = `https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/original/${fileName}.jpg`;
      setUrlAttempt(2);
    } else if (urlAttempt === 2) {
      // Try alternative slug format (without hyphens) - only if different
      const altSlug = normalizedName.replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
      if (altSlug !== fileName.replace(/-/g, '')) {
        nextUrl = `https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/${altSlug}.png`;
        setUrlAttempt(3);
      } else {
        // Skip to Clearbit if altSlug is same
        nextUrl = getClearbitLogoUrl(item.name);
        setUrlAttempt(4);
      }
    } else if (urlAttempt === 3) {
      // Try Clearbit as final fallback
      nextUrl = getClearbitLogoUrl(item.name);
      setUrlAttempt(4);
    } else {
      // All attempts failed, show avatar fallback
      setImageError(true);
      return;
    }
    
    if (nextUrl) {
      setCurrentImageUrl(nextUrl);
      setImageLoaded(false); // Reset loaded state when trying new URL
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };
  
  return (
    <View style={styles.brandCard}>
      <TouchableOpacity 
        style={styles.brandContent}
        onPress={() => onPress(item)}
        activeOpacity={0.7}
      >
        {imageError || urlAttempt >= 4 ? (
          <BrandAvatar name={item.name} theme={theme} size={50} />
        ) : (
          <View style={styles.imageContainer}>
            {!imageLoaded && (
              <BrandAvatar name={item.name} theme={theme} size={50} />
            )}
            <Image 
              source={{ uri: currentImageUrl }}
              style={[styles.logoImage, !imageLoaded && styles.hiddenImage]}
              contentFit="contain"
              cachePolicy="memory-disk"
              transition={200}
              onError={handleImageError}
              onLoad={handleImageLoad}
              key={`${item.name}-${urlAttempt}-${currentImageUrl}`}
            />
          </View>
        )}
        <Text style={[styles.brandName, { color: theme.textPrimary }]} numberOfLines={2}>
          {item.name}
        </Text>
      </TouchableOpacity>
      <View style={[styles.separator, { backgroundColor: theme.cardBorder }]} />
    </View>
  );
});

// Header Component for sections
const SectionHeader = React.memo(({ title, theme }) => (
  <View style={[styles.sectionHeader, { width: '100%' }]}>
    <Text style={[styles.sectionHeaderText, { color: theme.textPrimary }]}>
      {title}
    </Text>
  </View>
));

export default function BrandsScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const debounceTimerRef = useRef(null);
  
  // Get vehicle type from route params (4WHEELER or 2WHEELER)
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
  
  // Prepare brands data with headers and pre-calculated logo URLs
  const brandsData = useMemo(() => {
    const popularBrands = getPopularBrands();
    const allBrands = getAllBrands();
    
    // Filter out popular brands from all brands
    const popularBrandNames = new Set(popularBrands.map(b => b.name.toLowerCase()));
    const otherBrands = allBrands.filter(b => !popularBrandNames.has(b.name.toLowerCase()));
    
    // Pre-calculate logo URLs for all brands
    const popularBrandsWithLogos = popularBrands.map(brand => ({
      ...brand,
      type: 'brand',
      logoUrl: getBrandLogoUrl(brand.name),
    }));
    
    const otherBrandsWithLogos = otherBrands.map(brand => ({
      ...brand,
      type: 'brand',
      logoUrl: getBrandLogoUrl(brand.name),
    }));
    
    // Build flat array with headers
    const data = [
      { id: 'header-popular', type: 'header', name: 'Popular Vehicles' },
      ...popularBrandsWithLogos,
      { id: 'header-all', type: 'header', name: 'All Brands' },
      ...otherBrandsWithLogos,
    ];
    
    return data;
  }, []);
  
  // Filter brands based on debounced search query
  const filteredData = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return brandsData;
    }
    
    const query = debouncedSearchQuery.toLowerCase().trim();
    
    // Search by brand name
    const allBrands = getAllBrands();
    const brandMatches = allBrands
      .filter(brand => brand.name.toLowerCase().includes(query))
      .map(brand => ({
        ...brand,
        type: 'brand',
        logoUrl: getBrandLogoUrl(brand.name),
      }));
    
    // Also search by model name to find brands that have matching models
    const modelMatches = searchBrandsByModel(debouncedSearchQuery);
    const modelMatchesWithLogos = modelMatches.map(brand => ({
      ...brand,
      type: 'brand',
      logoUrl: getBrandLogoUrl(brand.name),
    }));
    
    // Combine both results and remove duplicates
    const combinedResults = [...brandMatches];
    const brandNamesSet = new Set(brandMatches.map(b => b.name.toLowerCase()));
    
    // Add model matches that aren't already in brand matches
    modelMatchesWithLogos.forEach(brand => {
      if (!brandNamesSet.has(brand.name.toLowerCase())) {
        combinedResults.push(brand);
        brandNamesSet.add(brand.name.toLowerCase());
      }
    });
    
    // If we have results from model search, prioritize them if no direct brand match
    // Otherwise return combined results
    if (brandMatches.length === 0 && modelMatchesWithLogos.length > 0) {
      return modelMatchesWithLogos;
    }
    
    return combinedResults.length > 0 ? combinedResults : brandMatches;
  }, [debouncedSearchQuery, brandsData]);
  
  const handleBrandSelect = useCallback((brand) => {
    // Navigate to model selection screen
    navigation.navigate('ModelSelection', { 
      brandName: brand.name,
      vehicleType: vehicleType 
    });
  }, [navigation, vehicleType]);
  
  const [showCustomVehicleModal, setShowCustomVehicleModal] = useState(false);
  const [customBrand, setCustomBrand] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [savingCustomVehicle, setSavingCustomVehicle] = useState(false);

  const handleCantFindVehicle = useCallback(() => {
    setShowCustomVehicleModal(true);
  }, []);

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
        const keys = await getVehicleKeys();
        await AsyncStorage.setItem(keys.vehicleType, vehicleType);
        await AsyncStorage.setItem(keys.vehicleModel, vehicleModel);
      }
      
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
              // Navigate to home/main screen after saving
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
              });
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
  }, [customBrand, customModel, vehicleType, navigation, savingCustomVehicle]);
  
  const renderItem = useCallback(({ item }) => {
    if (item.type === 'header') {
      // Header needs to span all 3 columns, so we calculate full width
      return (
        <SectionHeader title={item.name} theme={theme} />
      );
    }
    return <BrandCard item={item} onPress={handleBrandSelect} theme={theme} />;
  }, [handleBrandSelect, theme]);
  
  const getItemType = useCallback((item) => item.type, []);
  
  const overrideItemLayout = useCallback((layout, item) => {
    if (item.type === 'header') {
      layout.span = 3; // Forces header to take the full row
      layout.size = 60; // Fixed height
    } else {
      layout.span = 1; // Cards take 1/3 of the row
      layout.size = 110; // Fixed height matches brandCard height
    }
  }, []);
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: theme.background }]}>
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
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            Select Vehicle
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.cantFindButton}
          onPress={handleCantFindVehicle}
          activeOpacity={0.7}
        >
          <Text style={styles.cantFindButtonText}>Can't find your Vehicle?</Text>
        </TouchableOpacity>
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
            placeholder="Search brand or model (e.g., &quot;Audi&quot; or &quot;A4&quot;)"
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
      
      {/* Brands List */}
      <FlashList
        data={filteredData}
        numColumns={3}
        estimatedItemSize={120}
        keyExtractor={(item) => item.id}
        getItemType={getItemType}
        overrideItemLayout={overrideItemLayout}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        extraData={theme}
      />

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
        <View style={[styles.modalContent, { backgroundColor: theme.background, paddingBottom: insets.bottom }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Enter Your Vehicle Details</Text>
            <TouchableOpacity
              onPress={() => setShowCustomVehicleModal(false)}
              style={styles.modalCloseButton}
            >
              <MaterialCommunityIcons name="close" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cantFindButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 6,
    maxWidth: 140,
  },
  cantFindButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
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
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  sectionHeader: {
    marginTop: 20,
    marginBottom: 12,
    width: '100%',
    alignSelf: 'stretch',
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  brandCard: {
    flex: 1,
    margin: 6,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 110, // Fixed height keeps FlashList snappy
  },
  brandContent: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  imageContainer: {
    width: 50,
    height: 50,
    marginBottom: 8,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 50,  // Keep logos small
    height: 50,
    position: 'absolute',
  },
  hiddenImage: {
    opacity: 0,
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  brandName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  separator: {
    height: 1,
    width: '100%',
    marginTop: 8,
  },
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
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
});
