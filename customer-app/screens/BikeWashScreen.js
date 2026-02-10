import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import BackHeader from '../components/BackHeader';
import ServiceAccordionCard from '../components/ServiceAccordionCard';
import ServiceDetailsBottomSheet from '../components/ServiceDetailsBottomSheet';
import AddOnServicesList from '../components/AddOnServicesList';
import PricingPackages, { AddToCartButton } from '../components/PricingPackages';
import ServiceCoverage from '../components/ServiceCoverage';
import { getServiceById, getServicesByCategory } from '../services/serviceApi';
import { useTheme } from '../theme/ThemeContext';

const FALLBACK_BIKE_IMAGE = require('../assets/carwash.png');
const FALLBACK_ADDON_IMAGE = require('../assets/carwash.png');

const FALLBACK_ADD_ONS = [
  { _id: 'mock_addon_interior', title: 'Normal Interior Cleaning', price: 119, imageSource: FALLBACK_ADDON_IMAGE },
  { _id: 'mock_addon_dashboard', title: 'Dashboard Polish', price: 49, imageSource: FALLBACK_ADDON_IMAGE },
  { _id: 'mock_addon_freshener', title: '30 Days Air Freshener', price: 89, imageSource: FALLBACK_ADDON_IMAGE },
  { _id: 'mock_addon_dustbin', title: 'Dustbin', price: 59, imageSource: FALLBACK_ADDON_IMAGE },
  { _id: 'mock_addon_windshield', title: 'Windshield Cleaning Tablet and Refill', price: 39, imageSource: FALLBACK_ADDON_IMAGE },
];

export default function BikeWashScreen({ navigation }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedServiceId, setExpandedServiceId] = useState(null);
  const [serviceDetailsById, setServiceDetailsById] = useState({});
  const [loadingDetailsId, setLoadingDetailsId] = useState(null);
  const [selectedAddOnsByServiceId, setSelectedAddOnsByServiceId] = useState({});
  const [sheetService, setSheetService] = useState(null);
  const [sheetSelectedPackage, setSheetSelectedPackage] = useState('oneTime');
  const [sheetSelectedAddOns, setSheetSelectedAddOns] = useState([]);
  const bottomSheetRef = useRef(null);
  const { theme, isLightMode } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getServicesByCategory('BikeWash');
      
      if (response.success) {
        setServices(response.data || []);
      } else {
        throw new Error('Failed to fetch services');
      }
    } catch (err) {
      console.error('Error fetching bike wash services:', err);
      setError(err.message || 'Failed to load services');
      Alert.alert(
        'Error',
        'Failed to load services. Please check your connection and try again.',
        [{ text: 'Retry', onPress: fetchServices }, { text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return `₹${price}`;
  };

  const handleServicePress = (service) => {
    if (!service) return;
    setSheetService(service);
    setSheetSelectedPackage('oneTime');
    setSheetSelectedAddOns(selectedAddOnsByServiceId[service._id] || []);
    setTimeout(() => {
      bottomSheetRef.current?.expand?.();
    }, 0);
  };

  const toggleService = async (service) => {
    const id = service?._id;
    if (!id) return;

    setExpandedServiceId(prev => (prev === id ? null : id));

    // Fetch full details (add-ons/packages) only when expanding and if we don't have them cached
    if (expandedServiceId === id) return; // collapsing
    if (serviceDetailsById[id]) return;

    try {
      setLoadingDetailsId(id);
      const response = await getServiceById(id);
      if (response?.success) {
        setServiceDetailsById(prev => ({ ...prev, [id]: response.data }));
      }
    } catch (e) {
      console.error('Error fetching service details for accordion:', e);
    } finally {
      setLoadingDetailsId(null);
    }
  };

  const toggleAddOn = (serviceId, addOnId) => {
    if (!serviceId || !addOnId) return;
    setSelectedAddOnsByServiceId(prev => {
      const current = prev[serviceId] || [];
      const next = current.includes(addOnId)
        ? current.filter(id => id !== addOnId)
        : [...current, addOnId];
      return { ...prev, [serviceId]: next };
    });
  };

  // Data helpers for bottom sheet
  const getSheetData = () => {
    if (!sheetService) return null;
    return {
      imageUri:
        sheetService.image ||
        'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&h=400&fit=crop&auto=format',
      specs: {
        duration: sheetService.duration || '',
        rating: sheetService.rating?.toFixed(1) || '0',
      },
      included: sheetService.specifications?.coverage || [],
      notIncluded: sheetService.specifications?.notIncluded || [],
    };
  };

  const getSheetAddOns = () => {
    if (!sheetService) return [];
    const fromApi =
      sheetService.addOnServices?.map((addon) => ({
        imageUri:
          addon.image ||
          'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=200&h=200&fit=crop',
        imageSource: !addon.image ? FALLBACK_ADDON_IMAGE : undefined,
        title: addon.name,
        price: addon.basePrice,
        _id: addon._id,
      })) || [];
    return fromApi.length > 0 ? fromApi : FALLBACK_ADD_ONS;
  };

  const oneTimeSheetPrice =
    sheetService?.basePrice !== undefined ? sheetService.basePrice : 0;

  const calculateSheetTotalPrice = () => {
    if (!sheetService) return 0;

    let basePrice = 0;
    if (sheetSelectedPackage === 'oneTime') {
      basePrice = oneTimeSheetPrice;
    } else if (sheetSelectedPackage && sheetSelectedPackage.price) {
      basePrice = sheetSelectedPackage.price;
    } else {
      basePrice = oneTimeSheetPrice;
    }

    const addOnsList = getSheetAddOns();
    const addOnsTotal = sheetSelectedAddOns.reduce((total, addOnId) => {
      const addOn = addOnsList.find((a) => a._id === addOnId);
      return total + (addOn?.price || 0);
    }, 0);

    return basePrice + addOnsTotal;
  };

  const sheetTotalPrice = calculateSheetTotalPrice();

  const handleToggleSheetAddOn = (addOnId) => {
    setSheetSelectedAddOns((prev) =>
      prev.includes(addOnId)
        ? prev.filter((id) => id !== addOnId)
        : [...prev, addOnId]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style={isLightMode ? 'dark' : 'light'} />
        <BackHeader navigation={navigation} title="Bike Wash" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={styles.loadingText}>Loading services...</Text>
        </View>
      </View>
    );
  }

  if (error && services.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar style={isLightMode ? 'dark' : 'light'} />
        <BackHeader navigation={navigation} title="Bike Wash" />
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={64} color={theme.danger} />
          <Text style={styles.errorText}>Failed to load services</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchServices}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style={isLightMode ? 'dark' : 'light'} />
      <BackHeader navigation={navigation} title="Bike Wash" />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchServices}
            tintColor={theme.accent}
          />
        }
      >
        <View style={styles.content}>
          {/* <Text style={styles.browseTitle}>browse woosh!</Text> */}
          
          {services.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="motorbike" size={64} color={theme.textSecondary} />
              <Text style={styles.emptyText}>No services available</Text>
              <Text style={styles.emptySubtext}>Check back later for bike wash services</Text>
            </View>
          ) : (
            services.map((service) => (
              <View key={service._id} style={styles.serviceSection}>
                <ServiceAccordionCard
                  serviceSummary={service}
                  serviceDetails={serviceDetailsById[service._id]}
                  expanded={expandedServiceId === service._id}
                  isLoadingDetails={loadingDetailsId === service._id}
                  onToggle={() => toggleService(service)}
                  onViewDetails={() => handleServicePress(serviceDetailsById[service._id] || service)}
                  selectedAddOns={selectedAddOnsByServiceId[service._id] || []}
                  onToggleAddOn={(addOnId) => toggleAddOn(service._id, addOnId)}
                  navigation={navigation}
                  fallbackImageSource={FALLBACK_BIKE_IMAGE}
                  fallbackAddOns={FALLBACK_ADD_ONS}
                />
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Bottom sheet for "View Details" – only sheet, no hero image */}
      {sheetService && (
        <ServiceDetailsBottomSheet
          ref={bottomSheetRef}
          footer={
            <View style={styles.addToCartFooter}>
              <AddToCartButton
                selectedPackage={sheetSelectedPackage}
                oneTimePrice={oneTimeSheetPrice}
                totalPrice={sheetTotalPrice}
                duration={getSheetData()?.specs?.duration}
                serviceId={sheetService._id}
                serviceTitle={sheetService.name}
                serviceImage={getSheetData()?.imageUri}
                selectedAddOns={sheetSelectedAddOns}
                addOnServices={getSheetAddOns()}
                navigation={navigation}
                action="add_to_cart"
              />
            </View>
          }
        >
          <BottomSheetScrollView
            contentContainerStyle={styles.bottomSheetContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.categoryText}>
              {(sheetService.category || 'BikeWash').toUpperCase()} SERVICE
            </Text>
            <View style={styles.titleRow}>
              <Text style={styles.serviceTitle}>{sheetService.name}</Text>
            </View>
            {sheetService.description ? (
              <Text style={styles.serviceDescription}>
                {sheetService.description}
              </Text>
            ) : null}
            <View style={styles.ratingRow}>
              {[...Array(5)].map((_, i) => {
                const data = getSheetData();
                const rating = parseFloat(data?.specs?.rating || 0);
                const filledStars = Math.floor(rating);
                const hasHalfStar = rating % 1 >= 0.5;
                let iconName = 'star-outline';
                if (i < filledStars) {
                  iconName = 'star';
                } else if (i === filledStars && hasHalfStar) {
                  iconName = 'star-half-full';
                }
                return (
                  <MaterialCommunityIcons
                    key={i}
                    name={iconName}
                    size={20}
                    color="#FFD700"
                  />
                );
              })}
            </View>

            {/* Add-On Services List */}
            <AddOnServicesList
              services={getSheetAddOns()}
              maxVisible={4}
              selectedAddOns={sheetSelectedAddOns}
              onToggleAddOn={handleToggleSheetAddOn}
            />

            {/* Pricing Packages */}
            <PricingPackages
              oneTimePrice={oneTimeSheetPrice}
              serviceTitle={sheetService.name}
              serviceImage={getSheetData()?.imageUri}
              duration={getSheetData()?.specs?.duration}
              navigation={navigation}
              onSelectionChange={setSheetSelectedPackage}
              packages={sheetService.packages}
              hideSubscriptions={false}
              forceOneTime={false}
              showOnlyMonthly
            />

            {/* Service Coverage */}
            <ServiceCoverage
              included={getSheetData()?.included || []}
              notIncluded={getSheetData()?.notIncluded || []}
            />
          </BottomSheetScrollView>
        </ServiceDetailsBottomSheet>
      )}
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
    paddingBottom: 100,
  },
  content: {
    paddingTop: 20,
  },
  browseTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.textPrimary,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  serviceSection: {
    marginBottom: 12,
  },
  bottomSheetContent: {
    padding: 20,
    paddingBottom: 160,
  },
  addToCartFooter: {
    backgroundColor: theme.cardBackground,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: theme.cardBorder,
  },
  categoryText: {
    fontSize: 12,
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.textPrimary,
    flex: 1,
  },
  serviceDescription: {
    fontSize: 14,
    color: theme.textSecondary,
    opacity: 0.85,
    marginBottom: 16,
    lineHeight: 20,
  },
  ratingRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 100,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: theme.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
  },
});
