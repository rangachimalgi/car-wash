import React, { useMemo, useState, useEffect, useRef } from 'react';
import { ActivityIndicator, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { resolveAssetUrl } from '../config/api';
import { getServiceById } from '../services/serviceApi';
import { useTheme } from '../theme/ThemeContext';
import ServiceDetailsBottomSheet from '../components/ServiceDetailsBottomSheet';
import AddOnServicesList from '../components/AddOnServicesList';
import PricingPackages, { AddToCartButton } from '../components/PricingPackages';
import ServiceCoverage from '../components/ServiceCoverage';

const FALLBACK_ADDON_IMAGE = require('../assets/carwash.png');

export default function ServiceDetailsScreen({ navigation, route }) {
  const { serviceId, serviceTitle, service: serviceFromRoute, category } = route.params || {};
  const [service, setService] = useState(serviceFromRoute || null);
  const [loading, setLoading] = useState(!serviceFromRoute);
  const [error, setError] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState('oneTime');
  const [selectedAddOns, setSelectedAddOns] = useState([]); // Array of add-on IDs
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef(null);

  useEffect(() => {
    // Fetch from API to get add-ons (list API doesn't include add-ons)
    if (serviceId) {
      fetchServiceDetails();
    } else {
      setError('Service ID is required');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId]);

  const fetchServiceDetails = async () => {
    try {
      // Only show loading if we don't have service data yet
      if (!service) {
        setLoading(true);
      }
      setError(null);

      const response = await getServiceById(serviceId);

      if (response.success) {
        // Merge with existing service data (if any) to preserve what we already have
        setService(prev => ({
          ...prev,
          ...response.data,
          // Ensure add-ons are included
          addOnServices: response.data.addOnServices || prev?.addOnServices || [],
          // Ensure packages are included from API
          packages: response.data.packages || prev?.packages || null,
        }));
      } else {
        throw new Error('Failed to fetch service details');
      }
    } catch (err) {
      console.error('Error fetching service details:', err);
      // Only set error if we don't have service data to show
      if (!service) {
        setError(err.message || 'Failed to load service details');
      }
      // If we have service from route, still show it (just without add-ons)
      if (serviceFromRoute && !service) {
        setService(serviceFromRoute);
      }
    } finally {
      setLoading(false);
    }
  };

  const getDefaultImageForCategory = effectiveCategory => {
    if (effectiveCategory === 'BikeWash') {
      return 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&h=400&fit=crop&auto=format';
    }
    // Default to car-wash style image
    return 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop';
  };

  // Get service data from API - coverage comes from specifications.coverage and notIncluded
  const getServiceData = () => {
    if (service) {
      const effectiveCategory = service.category || category;
      return {
        imageUri: resolveAssetUrl(service.image || '') || getDefaultImageForCategory(effectiveCategory),
        specs: {
          duration: service.duration || '',
          rating: service.rating?.toFixed(1) || '0',
        },
        // Coverage from API - specifications.coverage and notIncluded arrays
        included: service.specifications?.coverage || [],
        notIncluded: service.specifications?.notIncluded || [],
      };
    }
    // Fallback (shouldn't reach here if service exists)
    const effectiveCategory = category;
    return {
      imageUri: getDefaultImageForCategory(effectiveCategory),
      specs: { duration: '', rating: '0' },
      included: [],
      notIncluded: [],
    };
  };

  // Map API add-on services to component format
  const addOnServices = service?.addOnServices?.map(addon => ({
    imageUri: resolveAssetUrl(addon.image || '') || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop',
    imageSource: !addon.image ? FALLBACK_ADDON_IMAGE : undefined,
    title: addon.name,
    price: addon.basePrice,
    _id: addon._id,
  })) || [];

  // Temporary fallback add-ons for UI (when API doesn't return add-ons yet)
  const fallbackAddOns = [
    { _id: 'mock_addon_interior', title: 'Normal Interior Cleaning', price: 119, imageSource: FALLBACK_ADDON_IMAGE },
    { _id: 'mock_addon_dashboard', title: 'Dashboard Polish', price: 49, imageSource: FALLBACK_ADDON_IMAGE },
    { _id: 'mock_addon_freshener', title: '30 Days Air Freshener', price: 89, imageSource: FALLBACK_ADDON_IMAGE },
    { _id: 'mock_addon_dustbin', title: 'Dustbin', price: 59, imageSource: FALLBACK_ADDON_IMAGE },
    { _id: 'mock_addon_windshield', title: 'Windshield Cleaning Tablet and Refill', price: 39, imageSource: FALLBACK_ADDON_IMAGE },
  ];
  const resolvedAddOns = addOnServices.length > 0 ? addOnServices : fallbackAddOns;

  const getCategoryText = () => {
    const effectiveCategory = service?.category || category;
    if (effectiveCategory) {
      return `${effectiveCategory.toUpperCase()} SERVICE`;
    }
    return 'SERVICE DETAILS';
  };

  // Use basePrice from API (service) - this is the source of truth
  const oneTimePrice = service?.basePrice || route.params?.price || 0;

  // Toggle add-on selection
  const toggleAddOn = (addOnId) => {
    setSelectedAddOns(prev => {
      if (prev.includes(addOnId)) {
        // Remove if already selected
        return prev.filter(id => id !== addOnId);
      } else {
        // Add if not selected
        return [...prev, addOnId];
      }
    });
  };

  // Calculate total price: base price + selected add-ons
  const calculateTotalPrice = () => {
    let basePrice = 0;

    // Get base price based on selected package
    if (selectedPackage === 'oneTime') {
      basePrice = oneTimePrice;
    } else if (selectedPackage && selectedPackage.price) {
      basePrice = selectedPackage.price;
    } else {
      basePrice = oneTimePrice;
    }

    // Add selected add-ons prices
    const addOnsTotal = selectedAddOns.reduce((total, addOnId) => {
      const addOn = resolvedAddOns.find(a => a._id === addOnId);
      return total + (addOn?.price || 0);
    }, 0);

    return basePrice + addOnsTotal;
  };

  const totalPrice = calculateTotalPrice();

  // If we have service data, render immediately (even if add-ons are still loading)
  if (service) {
    return (
      <View style={styles.container}>
        {/* Simple header (no hero image) */}
        <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => navigation.goBack()}
            >
              <MaterialCommunityIcons name="chevron-left" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
            <View style={styles.headerRight} />
          </View>
        </View>

        {/* Just the bottom sheet with details */}
        <ServiceDetailsBottomSheet
          ref={bottomSheetRef}
          footer={
            <View style={styles.addToCartFooter}>
              <AddToCartButton
                selectedPackage={selectedPackage}
                oneTimePrice={oneTimePrice}
                totalPrice={totalPrice}
                duration={getServiceData().specs?.duration}
                serviceId={service?._id || serviceId}
                serviceTitle={service?.name || serviceTitle}
                serviceImage={getServiceData().imageUri}
                selectedAddOns={selectedAddOns}
                addOnServices={resolvedAddOns}
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
            <Text style={styles.categoryText}>{getCategoryText()}</Text>
            <View style={styles.titleRow}>
              <Text style={styles.serviceTitle}>{service?.name || serviceTitle}</Text>
            </View>
            {service?.description ? (
              <Text style={styles.serviceDescription}>{service.description}</Text>
            ) : null}
            <View style={styles.ratingRow}>
              {[...Array(5)].map((_, i) => {
                const rating = parseFloat(getServiceData().specs?.rating || 0);
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
            {resolvedAddOns.length > 0 && (
              <AddOnServicesList 
                services={resolvedAddOns}
                maxVisible={4}
                selectedAddOns={selectedAddOns}
                onToggleAddOn={toggleAddOn}
              />
            )}

            {/* Pricing Packages */}
            <PricingPackages
              oneTimePrice={oneTimePrice}
              serviceTitle={service?.name || serviceTitle}
              serviceImage={getServiceData().imageUri}
              duration={getServiceData().specs?.duration}
              navigation={navigation}
              onSelectionChange={setSelectedPackage}
              packages={service?.packages}
              hideSubscriptions={false}
              forceOneTime={false}
              showOnlyMonthly
            />

            {/* Service Coverage Table (optional here; can be hidden if you want totally minimal) */}
            <ServiceCoverage 
              included={getServiceData().included || []}
              notIncluded={getServiceData().notIncluded || []}
            />
          </BottomSheetScrollView>
        </ServiceDetailsBottomSheet>
      </View>
    );
  }

  // Only show loading/error if we truly don't have service data
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={styles.loadingText}>Loading service details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load service details</Text>
      </View>
    );
  }

  // Fallback (shouldn't reach here if serviceFromRoute is passed)
  return null;
}

const createStyles = theme => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  headerContainer: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingBottom: 12,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButton: {
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
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
    backgroundColor: theme.background,
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
    backgroundColor: theme.background,
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: theme.danger,
    textAlign: 'center',
  },
});

