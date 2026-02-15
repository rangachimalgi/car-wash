import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { getPopularBrands, getAllBrands, searchBrandsByModel } from '../services/carsData';

const CAR_IMAGE = require('../assets/fallback.png');

export default function FourWheelerDetailsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { theme, isLightMode } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [searchQuery, setSearchQuery] = useState('');

  // Get brands from local data
  const popularBrands = useMemo(() => getPopularBrands(), []);
  const allBrands = useMemo(() => getAllBrands(), []);

  // Search brands by model name if search query exists
  const brandsByModel = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchBrandsByModel(searchQuery);
  }, [searchQuery]);

  // Filter brands based on search query (brand name or model name)
  const filteredPopularBrands = useMemo(() => {
    if (!searchQuery.trim()) return popularBrands;
    const query = searchQuery.toLowerCase();
    
    // First, try to find brands by model name
    if (brandsByModel.length > 0) {
      // Filter popular brands that match the model search
      return popularBrands.filter(brand => 
        brandsByModel.some(b => b.name === brand.name)
      );
    }
    
    // Fallback to brand name search
    return popularBrands.filter(brand => 
      brand.name.toLowerCase().includes(query)
    );
  }, [popularBrands, searchQuery, brandsByModel]);

  const filteredAllBrands = useMemo(() => {
    if (!searchQuery.trim()) return allBrands;
    const query = searchQuery.toLowerCase();
    
    // First, try to find brands by model name
    if (brandsByModel.length > 0) {
      // Return brands that match the model search
      return brandsByModel;
    }
    
    // Fallback to brand name search
    return allBrands.filter(brand => 
      brand.name.toLowerCase().includes(query)
    );
  }, [allBrands, searchQuery, brandsByModel]);

  const handleBrandPress = (brand) => {
    navigation.navigate('CarModels', { brandName: brand.name });
  };

  const handleCantFindVehicle = () => {
    // TODO: Handle "Can't find your Vehicle?" action
    console.log('Can\'t find vehicle pressed');
  };

  const getBrandLogoUrl = (brandName) => {
    if (!brandName) return '';
    
    // Mapping brand names to their slugs in the repository
    // Based on the repository structure: thumb/optimized/original folders
    const nameMapping = {
      'Maruti Suzuki': 'suzuki',
      'Tata': 'tata',
      'Mahindra': 'mahindra',
      'MG Motor': 'mg',
      'Hyundai': 'hyundai',
      'Kia': 'kia',
      'Honda': 'honda',
      'Toyota': 'toyota',
      'Volkswagen': 'volkswagen', // Correct slug is 'volkswagen' not 'vw'
      'Ford': 'ford',
      'Skoda': 'skoda',
      'Renault': 'renault',
      'BMW': 'bmw',
      'Nissan': 'nissan',
      'Mercedes-Benz': 'mercedes',
      'Mercedes': 'mercedes',
      'Porsche': 'porsche',
      'Premier': null, // Might not exist in repo, will use fallback
      'Volvo': 'volvo',
      'Datsun': 'datsun',
      'Isuzu': 'isuzu',
      'Jeep': 'jeep',
      'Land Rover': 'land-rover',
      'Mini': 'mini',
      'Mitsubishi': 'mitsubishi',
      'Opel': 'opel',
      'Peugeot': 'peugeot',
      'Fiat': 'fiat',
      'Audi': 'audi',
      'Bentley': 'bentley',
      'Jaguar': 'jaguar',
      'Lexus': 'lexus',
      'Mazda': 'mazda',
      'Suzuki': 'suzuki',
    };
  
    const slug = nameMapping[brandName];
    
    // If mapping returns null, the brand doesn't exist in repo - return empty to trigger fallback
    if (slug === null) return '';
    
    // If no mapping found, try the default format
    const finalSlug = slug || brandName.toLowerCase().trim().replace(/\s+/g, '-');
  
    // Use the thumb version for small logo display (60x60)
    // Repository structure: /filippofilip95/car-logos-dataset/master/logos/thumb/{slug}.png
    return `https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/${finalSlug}.png`;
  };
  


  const [imageErrors, setImageErrors] = useState({});

  const handleImageError = (brandId, name) => {
    console.log(`❌ Failed: ${name} | URL: ${getBrandLogoUrl(name)}`);
    setImageErrors(prev => ({ ...prev, [brandId]: true }));
  };

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
          <Text style={styles.headerTitle}>Select Vehicle</Text>
          <TouchableOpacity 
            style={styles.cantFindButton}
            onPress={handleCantFindVehicle}
          >
            <Text style={styles.cantFindButtonText}>Can't find your Vehicle?</Text>
          </TouchableOpacity>
        </View>
      </View>

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
            placeholder='Search "Audi A4"'
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Popular Vehicles Section */}
        {filteredPopularBrands.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Popular Vehicles</Text>
            <View style={styles.separatorLine} />
            <View style={styles.brandsGrid}>
              {filteredPopularBrands.map((brand) => {
                const logoUrl = getBrandLogoUrl(brand?.name);
                return (
                  <TouchableOpacity
                    key={brand.id}
                    style={styles.brandCard}
                    onPress={() => handleBrandPress(brand)}
                    activeOpacity={0.7}
                  >
                    <Image 
                      source={imageErrors[brand.id] || !brand?.name || !logoUrl ? CAR_IMAGE : { uri: logoUrl }}
                      style={styles.brandImage} 
                      resizeMode="contain"
                      onError={() => handleImageError(brand.id, brand?.name || 'Unknown')}
                      defaultSource={CAR_IMAGE}
                    />
                    <Text style={styles.brandName}>{brand?.name || 'Unknown'}</Text>
                    <View style={styles.brandSeparatorLine} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* All Brands Section */}
        {filteredAllBrands.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>All Brands</Text>
            <View style={styles.separatorLine} />
            <View style={styles.brandsGrid}>
              {filteredAllBrands.map((brand) => {
                const logoUrl = getBrandLogoUrl(brand?.name);
                return (
                  <TouchableOpacity
                    key={brand.id}
                    style={styles.brandCard}
                    onPress={() => handleBrandPress(brand)}
                    activeOpacity={0.7}
                  >
                    <Image 
                      source={imageErrors[brand.id] || !brand?.name || !logoUrl ? CAR_IMAGE : { uri: logoUrl }}
                      style={styles.brandImage} 
                      resizeMode="contain"
                      onError={() => handleImageError(brand.id, brand?.name || 'Unknown')}
                      defaultSource={CAR_IMAGE}
                    />
                    <Text style={styles.brandName}>{brand?.name || 'Unknown'}</Text>
                    <View style={styles.brandSeparatorLine} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* No results message */}
        {searchQuery.trim() && filteredPopularBrands.length === 0 && filteredAllBrands.length === 0 && (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>No brands found matching "{searchQuery}"</Text>
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
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.textPrimary,
      flex: 1,
      marginLeft: 8,
    },
    cantFindButton: {
      backgroundColor: '#FFD700',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    cantFindButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#000000',
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
    brandsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 32,
    },
    brandCard: {
      width: '32%',
      alignItems: 'center',
      marginBottom: 20,
    },
    brandImage: {
      width: 100,
      height: 80,
      marginBottom: 8,
    },
    brandName: {
      fontSize: 12,
      fontWeight: '500',
      color: '#8c8c88',
      textAlign: 'center',
      marginBottom: 8,
    },
    brandSeparatorLine: {
      width: '100%',
      height: 1,
      backgroundColor: theme.cardBorder || '#E0E0E0',
      marginTop: 4,
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
