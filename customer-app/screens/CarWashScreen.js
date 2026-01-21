import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BackHeader from '../components/BackHeader';
import ServiceCard from '../components/ServiceCard';
import { getServicesByCategory } from '../services/serviceApi';

export default function CarWashScreen({ navigation }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getServicesByCategory('CarWash');
      
      if (response.success) {
        setServices(response.data || []);
      } else {
        throw new Error('Failed to fetch services');
      }
    } catch (err) {
      console.error('Error fetching car wash services:', err);
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
    navigation.navigate('CarWashDetails', {
      serviceId: service._id,
      serviceTitle: service.name,
      price: formatPrice(service.basePrice),
      duration: service.duration,
      service: service, // Pass full service object
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <BackHeader navigation={navigation} title="Car Wash" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#85E4FC" />
          <Text style={styles.loadingText}>Loading services...</Text>
        </View>
      </View>
    );
  }

  if (error && services.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <BackHeader navigation={navigation} title="Car Wash" />
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={64} color="#FF3B30" />
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
      <StatusBar style="light" />
      <BackHeader navigation={navigation} title="Car Wash" />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchServices}
            tintColor="#85E4FC"
          />
        }
      >
        <View style={styles.content}>
          <Text style={styles.browseTitle}>browse woosh!</Text>
          
          {services.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="car-wash" size={64} color="#666666" />
              <Text style={styles.emptyText}>No services available</Text>
              <Text style={styles.emptySubtext}>Check back later for car wash services</Text>
            </View>
          ) : (
            services.map((service) => (
              <View key={service._id} style={styles.serviceSection}>
                <ServiceCard
                  imageUri={service.image || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop'}
                  title={service.name}
                  description={service.description}
                  price={formatPrice(service.basePrice)}
                  duration={service.duration}
                  onReadMore={() => handleServicePress(service)}
                  onBookService={() => {
                    // Navigate to service details or add to cart
                    handleServicePress(service);
                  }}
                  onCardPress={() => handleServicePress(service)}
                />
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
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
    color: '#FFFFFF',
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
    color: '#FFFFFF',
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
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#85E4FC',
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
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
  },
});
