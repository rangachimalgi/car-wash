import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import CustomHeader from '../components/CustomHeader';
import UpcomingWashCard from '../components/UpcomingWashCard';
import RecentServiceCard from '../components/RecentServiceCard';
import { getOrders, updateOrderStatus } from '../services/orderApi';

export default function BookingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [upcomingWashes, setUpcomingWashes] = useState([]);
  const [recentServices, setRecentServices] = useState([]);
  const [loading, setLoading] = useState(false);

  const formatShortDate = (dateValue) => {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '';
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString();
  };

  const formatRecentDate = (dateValue) => {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString();
  };

  const getServiceTypeLabel = (category) => {
    if (category === 'CarWash') return 'Car Wash';
    if (category === 'BikeWash') return 'Bike Wash';
    return 'Service';
  };

  const getServiceImage = (category) => {
    if (category === 'BikeWash') {
      return 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=300&h=200&fit=crop&auto=format';
    }
    return 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&auto=format';
  };

  const mapOrderToUpcoming = (order) => {
    const item = order.items?.[0];
    const category = item?.service?.category;
    return {
      id: order._id,
      serviceType: getServiceTypeLabel(category),
      serviceName: item?.service?.name || 'Service',
      date: formatShortDate(item?.scheduledDate),
      time: item?.scheduledTimeSlot || '',
      address: order.customer?.address || 'Address not set',
      price: `₹${order.totalAmount?.toFixed(2)}`,
      image: getServiceImage(category),
    };
  };

  const mapOrderToRecent = (order) => {
    const item = order.items?.[0];
    const category = item?.service?.category;
    return {
      id: order._id,
      serviceType: getServiceTypeLabel(category),
      serviceName: item?.service?.name || 'Service',
      date: formatRecentDate(order.createdAt),
      status: order.status || 'Completed',
      price: `₹${order.totalAmount?.toFixed(2)}`,
      image: getServiceImage(category),
    };
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await getOrders();
      if (response.success) {
        const orders = response.data || [];
        const upcomingStatuses = ['Pending', 'Paid', 'Scheduled'];
        const recentStatuses = ['Completed', 'Cancelled'];

        setUpcomingWashes(orders.filter(order => upcomingStatuses.includes(order.status)).map(mapOrderToUpcoming));
        setRecentServices(orders.filter(order => recentStatuses.includes(order.status)).map(mapOrderToRecent));
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const handleDelivered = async (wash) => {
    try {
      await updateOrderStatus(wash.id, 'Completed');
      fetchOrders();
    } catch (error) {
      console.error('Failed to mark delivered:', error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <CustomHeader navigation={navigation} />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Upcoming Wash Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Wash</Text>
          </View>
          
          {upcomingWashes.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="calendar-remove" size={64} color="#666666" />
              <Text style={styles.emptyStateText}>No upcoming washes</Text>
              <Text style={styles.emptyStateSubtext}>Book a service to see it here</Text>
            </View>
          ) : (
            upcomingWashes.map((wash) => (
              <UpcomingWashCard 
                key={wash.id} 
                wash={wash}
                onDelivered={handleDelivered}
                onPress={() => {
                  // Handle card press if needed
                  console.log('View wash:', wash);
                }}
              />
            ))
          )}
        </View>

        {/* Recent Services Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Services</Text>
          </View>
          
          {recentServices.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="history" size={64} color="#666666" />
              <Text style={styles.emptyStateText}>No recent services</Text>
              <Text style={styles.emptyStateSubtext}>Your service history will appear here</Text>
            </View>
          ) : (
            recentServices.map((service) => (
              <RecentServiceCard 
                key={service.id} 
                service={service}
                onReBook={(service) => {
                  // Handle re-book logic here
                  console.log('Re-book service:', service);
                }}
                onPress={() => {
                  // Handle card press if needed
                  console.log('View service:', service);
                }}
              />
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
    backgroundColor: '#28282A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
  },
});
