import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import CustomHeader from '../components/CustomHeader';
import UpcomingWashCard from '../components/UpcomingWashCard';
import { getOrders } from '../services/orderApi';
import { useTheme } from '../theme/ThemeContext';
import { normalizeOrderStatus } from '../utils/orderStatus';
import {
  getServiceTypeLabel,
  getOrderItemImageUri,
  getOrderItemSchedule,
} from '../utils/orderDisplay';

export default function BookingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [upcomingWashes, setUpcomingWashes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { theme, isLightMode } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

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

  const mapOrderToUpcoming = (order) => {
    const item = order.items?.[0];
    const category = item?.service?.category;
    const { date: scheduledDate, time: scheduledTime } = getOrderItemSchedule(item);
    return {
      id: order._id,
      serviceType: getServiceTypeLabel(category, item),
      serviceName: item?.serviceName || item?.service?.name || 'Service',
      date: formatShortDate(scheduledDate),
      time: scheduledTime,
      address: order.customer?.address || 'Address not set',
      price: `₹${order.totalAmount?.toFixed(2)}`,
      image: getOrderItemImageUri(item),
      status: normalizeOrderStatus(order.status),
      employeeLocation: order.employeeLocation,
      startCode: order.startOtp || '',
    };
  };

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await getOrders();
      if (response.success) {
        const orders = response.data || [];
        const upcomingStatuses = ['Pending', 'Paid', 'Scheduled', 'In Progress'];
        setUpcomingWashes(
          orders
            .filter((order) => upcomingStatuses.includes(normalizeOrderStatus(order.status)))
            .map(mapOrderToUpcoming)
        );
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchOrders(false);
      const intervalId = setInterval(() => {
        fetchOrders(true);
      }, 15000);
      return () => clearInterval(intervalId);
    }, [fetchOrders])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchOrders(true);
    } finally {
      setRefreshing(false);
    }
  }, [fetchOrders]);

  const handleViewLocation = (wash) => {
    navigation.navigate('EmployeeLiveLocation', { orderId: wash.id });
  };

  const handlePayNow = (wash) => {
    navigation.navigate('PaymentMethods', {
      orderId: wash.id,
      amount: wash.price,
      serviceName: wash.serviceName,
    });
  };

  const handleBookAddOns = (wash) => {
    navigation.navigate('OrderUpsell', {
      orderId: wash.id,
      fromUpcomingBookings: true,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style={isLightMode ? 'dark' : 'light'} />
      <CustomHeader navigation={navigation} />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.accent}
            colors={[theme.accent]}
          />
        }
      >
        {/* Upcoming Wash Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Wash</Text>
          </View>
          

          {upcomingWashes.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="calendar-remove" size={64} color={theme.textSecondary} />
              <Text style={styles.emptyStateText}>No upcoming washes</Text>
              <Text style={styles.emptyStateSubtext}>Book a service to see it here</Text>
            </View>
          ) : (
            upcomingWashes.map((wash) => (
              <UpcomingWashCard 
                key={wash.id} 
                wash={wash}
                onViewLocation={handleViewLocation}
                onPayNow={handlePayNow}
                onBook={handleBookAddOns}
                onPress={() => {
                  // Handle card press if needed
                  console.log('View wash:', wash);
                }}
              />
            ))
          )}
        </View>

        <TouchableOpacity
          style={styles.ordersLinkCard}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('YourOrders')}
        >
          <View style={styles.ordersLinkLeft}>
            <MaterialCommunityIcons name="clipboard-text-clock-outline" size={28} color={theme.textPrimary} />
            <View style={styles.ordersLinkTextCol}>
              <Text style={styles.ordersLinkTitle}>Your orders</Text>
              <Text style={styles.ordersLinkSubtitle}>Past washes, reorder & rate</Text>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={theme.textSecondary} />
        </TouchableOpacity>
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
    color: theme.textPrimary,
  },
  addOnHint: {
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 19,
    marginBottom: 16,
  },
  addOnHintBold: {
    fontWeight: '800',
    color: theme.textPrimary,
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
    color: theme.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  ordersLinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  ordersLinkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 14,
  },
  ordersLinkTextCol: {
    flex: 1,
  },
  ordersLinkTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 4,
  },
  ordersLinkSubtitle: {
    fontSize: 13,
    color: theme.textSecondary,
  },
});
