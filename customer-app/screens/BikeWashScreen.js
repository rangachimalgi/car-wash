import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BackHeader from '../components/BackHeader';
import ServiceAccordionCard from '../components/ServiceAccordionCard';
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
    navigation.navigate('BikeWashDetails', {
      serviceId: service._id,
      serviceTitle: service.name,
      price: formatPrice(service.basePrice),
      duration: service.duration,
      service: service, // Pass full service object
    });
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
