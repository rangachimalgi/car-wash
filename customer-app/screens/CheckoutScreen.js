import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Dimensions, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BackHeader from '../components/BackHeader';
import { createOrder } from '../services/orderApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext';

const { width } = Dimensions.get('window');

export default function CheckoutScreen({ navigation, route }) {
  const cartItems = route?.params?.cartItems || [];
  // Convert ISO string back to Date object (it was serialized for navigation)
  const selectedDateParam = route?.params?.selectedDate;
  const selectedTimeSlotParam = route?.params?.selectedTimeSlot || null;
  const slotItem = cartItems.find(item => item.selectedDate && item.selectedTimeSlot) || null;
  const selectedDate = selectedDateParam
    ? new Date(selectedDateParam)
    : slotItem?.selectedDate
      ? new Date(slotItem.selectedDate)
      : null;
  const selectedTimeSlot = selectedTimeSlotParam || slotItem?.selectedTimeSlot || null;
  const subtotal = route?.params?.subtotal || 0;
  const tax = route?.params?.tax || 0;
  const total = route?.params?.total || 0;

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const { theme, isLightMode } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const formatDate = (date) => {
    if (!date) return '';
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
  };

  const applyCoupon = () => {
    if (couponCode.trim() === '') return;
    
    // Simulate coupon validation
    const validCoupons = {
      'WELCOME10': 10,
      'SAVE20': 20,
      'FIRST50': 50,
    };

    if (validCoupons[couponCode.toUpperCase()]) {
      const discountPercent = validCoupons[couponCode.toUpperCase()];
      const discountAmount = (subtotal * discountPercent) / 100;
      setDiscount(discountAmount);
      setAppliedCoupon(couponCode.toUpperCase());
      setCouponCode('');
    } else {
      // Show error - invalid coupon
      setCouponCode('');
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
  };

  const finalTotal = total - discount;

  const handlePayNow = async () => {
    try {
      const itemsPayload = cartItems.map((item) => {
        const addOnIds = (item.addOns || []).map(addOn => addOn?._id || addOn).filter(Boolean);
        if (!item.serviceId) {
          throw new Error('Service ID missing from cart item');
        }
        if (!item.selectedDate || !item.selectedTimeSlot) {
          throw new Error('Scheduled slot missing from cart item');
        }

        return {
          serviceId: item.serviceId,
          addOnIds,
          packageType: item.packageType || 'OneTime',
          packageTimes: item.packageTimes || 1,
          scheduledDate: item.selectedDate,
          scheduledTimeSlot: item.selectedTimeSlot?.time || item.selectedTimeSlot,
        };
      });

      console.log('Creating order payload:', itemsPayload);
      const response = await createOrder({
        items: itemsPayload,
        customer: {
          name: '',
          phone: '',
          address: '',
        },
      });
      console.log('Order created:', response);

      await AsyncStorage.removeItem('cartItems');

      // Show toast notification
      setShowToast(true);
      
      // Hide toast after 2 seconds and navigate to home
      setTimeout(() => {
        setShowToast(false);
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      }, 2000);
    } catch (error) {
      console.error('Order creation failed:', error);
      Alert.alert('Order failed', 'Unable to place order right now.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style={isLightMode ? 'dark' : 'light'} />
      <BackHeader navigation={navigation} title="Checkout" />
      
      {/* Toast Notification */}
      {showToast && (
        <View style={styles.toastContainer}>
          <MaterialCommunityIcons name="check-circle" size={24} color={theme.accent} />
          <Text style={styles.toastText}>Service booked</Text>
        </View>
      )}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Service Details */}
        {selectedDate && selectedTimeSlot && (
          <View style={styles.serviceDetailsSection}>
            <View style={styles.serviceDetailRow}>
              <MaterialCommunityIcons name="calendar" size={20} color={theme.accent} />
              <Text style={styles.serviceDetailText}>
                {formatDate(selectedDate)}
              </Text>
            </View>
            <View style={styles.serviceDetailRow}>
              <MaterialCommunityIcons name="clock-outline" size={20} color={theme.accent} />
              <Text style={styles.serviceDetailText}>
                {selectedTimeSlot.time}
              </Text>
            </View>
          </View>
        )}

        {/* Items Section */}
        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>Items</Text>
          <View style={styles.itemsContainer}>
            {cartItems.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Image 
                  source={{ uri: item.image }} 
                  style={styles.itemImage}
                  resizeMode="cover"
                />
                <View style={styles.itemDetails}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemQuantity}>Quantity: {item.quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Apply Coupon Section */}
        <View style={styles.couponSection}>
          <View style={styles.couponHeader}>
            <MaterialCommunityIcons name="ticket-percent" size={20} color={theme.accent} />
            <Text style={styles.sectionTitle}>Apply Coupon</Text>
          </View>
          {appliedCoupon ? (
            <View style={styles.appliedCouponContainer}>
              <View style={styles.appliedCouponRow}>
                <MaterialCommunityIcons name="check-circle" size={20} color={theme.accent} />
                <Text style={styles.appliedCouponText}>{appliedCoupon} Applied</Text>
                <Text style={styles.discountText}>-₹{discount.toFixed(2)}</Text>
              </View>
              <TouchableOpacity 
                style={styles.removeCouponButton}
                onPress={removeCoupon}
              >
                <Text style={styles.removeCouponText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.couponInputContainer}>
              <TextInput
                style={styles.couponInput}
                placeholder="Enter coupon code"
                placeholderTextColor={theme.textSecondary}
                value={couponCode}
                onChangeText={setCouponCode}
                autoCapitalize="characters"
              />
              <TouchableOpacity 
                style={styles.applyButton}
                onPress={applyCoupon}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Payment Summary Section */}
        <View style={styles.paymentSummarySection}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>₹{subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax (18%)</Text>
              <Text style={styles.summaryValue}>₹{tax.toFixed(2)}</Text>
            </View>
            {appliedCoupon && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount ({appliedCoupon})</Text>
                <Text style={[styles.summaryValue, styles.discountValue]}>
                  -₹{discount.toFixed(2)}
                </Text>
              </View>
            )}
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{finalTotal.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Pay Now Button */}
      <View style={styles.payNowContainer}>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Total Amount</Text>
          <Text style={styles.amountValue}>₹{finalTotal.toFixed(2)}</Text>
        </View>
        <TouchableOpacity 
          style={styles.payNowButton}
          onPress={handlePayNow}
        >
          <Text style={styles.payNowButtonText}>Book Now</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color="#000000" />
        </TouchableOpacity>
      </View>
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
    paddingBottom: 120,
  },
  serviceDetailsSection: {
    backgroundColor: theme.cardBackground,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  serviceDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceDetailText: {
    fontSize: 14,
    color: theme.textPrimary,
    marginLeft: 8,
  },
  itemsSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.textPrimary,
    marginBottom: 16,
  },
  itemsContainer: {
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    padding: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.cardBorder,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  couponSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  couponHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  couponInputContainer: {
    flexDirection: 'row',
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    overflow: 'hidden',
  },
  couponInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: theme.textPrimary,
  },
  applyButton: {
    backgroundColor: theme.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  appliedCouponContainer: {
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.accent,
    padding: 16,
  },
  appliedCouponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  appliedCouponText: {
    flex: 1,
    fontSize: 14,
    color: theme.textPrimary,
    marginLeft: 8,
    fontWeight: '600',
  },
  discountText: {
    fontSize: 14,
    color: theme.accent,
    fontWeight: '600',
  },
  removeCouponButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  removeCouponText: {
    fontSize: 12,
    color: theme.danger,
    fontWeight: '600',
  },
  paymentSummarySection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  summaryContainer: {
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    color: theme.textPrimary,
    fontWeight: '600',
  },
  discountValue: {
    color: theme.accent,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: theme.cardBorder,
    paddingTop: 12,
    marginTop: 4,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.textPrimary,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.accent,
  },
  payNowContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.background,
    borderTopWidth: 1,
    borderTopColor: theme.cardBorder,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  amountLabel: {
    fontSize: 16,
    color: theme.textSecondary,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.accent,
  },
  payNowButton: {
    flexDirection: 'row',
    backgroundColor: theme.accent,
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  payNowButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginRight: 8,
  },
  toastContainer: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 16,
    backgroundColor: theme.cardBackground,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.accent,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
    marginLeft: 12,
  },
});
