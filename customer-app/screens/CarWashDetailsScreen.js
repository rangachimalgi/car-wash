import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import ServiceDetailsLayout from '../components/ServiceDetailsLayout';
import { getServiceById } from '../services/serviceApi';

export default function CarWashDetailsScreen({ navigation, route }) {
  const { serviceId, serviceTitle, service: serviceFromRoute } = route.params || {};
  const [service, setService] = useState(serviceFromRoute || null);
  const [loading, setLoading] = useState(!serviceFromRoute);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch from API to get add-ons (list API doesn't include add-ons)
    if (serviceId) {
      fetchServiceDetails();
    } else {
      setError('Service ID is required');
      setLoading(false);
    }
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

  // Get service data from API - coverage comes from specifications.coverage and notIncluded
  const getServiceData = () => {
    if (service) {
      return {
        imageUri: service.image || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop',
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
    return {
      imageUri: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop',
      specs: { duration: '', rating: '0' },
      included: [],
      notIncluded: [],
    };
  };

  // Map API add-on services to component format
  const addOnServices = service?.addOnServices?.map(addon => ({
    imageUri: addon.image || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop',
    title: addon.name,
    price: addon.basePrice,
    _id: addon._id,
  })) || [];

  // If we have service data, render immediately (even if add-ons are still loading)
  if (service) {
    return (
      <ServiceDetailsLayout
        navigation={navigation}
        route={route}
        serviceData={service}
        serviceId={service?._id || serviceId}
        getServiceData={getServiceData}
        categoryText={service?.category ? `${service.category.toUpperCase()} SERVICE` : "CAR WASH SERVICE"}
        addOnServices={addOnServices}
      />
    );
  }

  // Only show loading/error if we truly don't have service data
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2CD4FB" />
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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
});

