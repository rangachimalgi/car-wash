import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import MinimalBackHeader from '../components/MinimalBackHeader';
import OrderHistoryCard from '../components/OrderHistoryCard';
import RatingModal from '../components/RatingModal';
import { getOrders, submitOrderRating } from '../services/orderApi';
import { useTheme } from '../theme/ThemeContext';
import { normalizeOrderStatus } from '../utils/orderStatus';
import { mapOrderToHistory, getReorderRoute } from '../utils/orderDisplay';
import { wooshGreen } from '../theme/wooshGreen';

export default function YourOrdersScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const rateOrderIdParam = route?.params?.rateOrderId;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingOrder, setRatingOrder] = useState(null);
  const { theme, isLightMode } = useTheme();
  const styles = useMemo(() => createStyles(theme, isLightMode), [theme, isLightMode]);
  const searchAccent = isLightMode ? wooshGreen.primary : theme.accent;

  const fetchOrders = async () => {
    try {
      const response = await getOrders();
      if (response.success) {
        const recentStatuses = ['Completed', 'Cancelled'];
        const list = (response.data || [])
          .filter((order) => recentStatuses.includes(normalizeOrderStatus(order.status)))
          .map(mapOrderToHistory)
          .sort((a, b) => (b.sortAt || 0) - (a.sortAt || 0));
        setOrders(list);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchOrders().finally(() => setLoading(false));
    }, [])
  );

  useEffect(() => {
    if (!rateOrderIdParam || orders.length === 0) return;
    const match = orders.find((o) => String(o.id) === String(rateOrderIdParam));
    if (match && !(typeof match.rating === 'number' && match.rating >= 1)) {
      setRatingOrder({ id: match.id, serviceName: match.serviceName });
      navigation.setParams({ rateOrderId: undefined });
    }
  }, [rateOrderIdParam, orders, navigation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchOrders();
    } finally {
      setRefreshing(false);
    }
  }, []);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        o.serviceName?.toLowerCase().includes(q) ||
        o.serviceType?.toLowerCase().includes(q) ||
        o.serviceName?.toLowerCase().includes(q)
    );
  }, [orders, searchQuery]);

  const handleOpenDetails = (order) => {
    navigation.navigate('OrderDetails', { orderId: order.id });
  };

  const handleReorder = (order) => {
    const route = getReorderRoute(order.category);
    navigation.navigate(route.name, route.params);
  };

  const handleRate = (order) => {
    setRatingOrder({ id: order.id, serviceName: order.serviceName });
  };

  const handleRatingSubmit = async (payload) => {
    if (!ratingOrder?.id) return;
    try {
      const res = await submitOrderRating(ratingOrder.id, payload);
      if (res.success) {
        await fetchOrders();
      } else {
        throw new Error(res.message || 'Failed to submit rating');
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Could not submit rating. Please try again.';
      Alert.alert('Error', message);
      throw err;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style={isLightMode ? 'dark' : 'light'} />
      <MinimalBackHeader navigation={navigation} title="Your Orders" />

      <View style={styles.searchWrap}>
        <MaterialCommunityIcons name="magnify" size={22} color={searchAccent} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search your orders"
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 ? (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
            <MaterialCommunityIcons name="close-circle" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {loading && orders.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} colors={[theme.accent]} />
          }
        >
          {filteredOrders.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={64} color={theme.textSecondary} />
              <Text style={styles.emptyTitle}>{searchQuery ? 'No matching orders' : 'No orders yet'}</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? 'Try a different search term'
                  : 'Completed and cancelled washes will show up here'}
              </Text>
            </View>
          ) : (
            filteredOrders.map((order) => (
              <OrderHistoryCard
                key={order.id}
                order={order}
                onPress={handleOpenDetails}
                onReorder={handleReorder}
                onRate={handleRate}
              />
            ))
          )}
        </ScrollView>
      )}

      <RatingModal
        visible={!!ratingOrder}
        onClose={() => setRatingOrder(null)}
        onSubmit={handleRatingSubmit}
        serviceName={ratingOrder?.serviceName}
      />
    </View>
  );
}

const createStyles = (theme, isLightMode) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isLightMode ? '#F5F6F8' : theme.background,
    },
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      marginBottom: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 28,
      backgroundColor: theme.cardBackground,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    searchIcon: {
      marginRight: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: theme.textPrimary,
      padding: 0,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 4,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 72,
      paddingHorizontal: 24,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.textPrimary,
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
  });
