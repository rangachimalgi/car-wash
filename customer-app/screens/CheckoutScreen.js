import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Dimensions, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BackHeader from '../components/BackHeader';

const { width } = Dimensions.get('window');

export default function CheckoutScreen({ navigation, route }) {
  const cartItems = route?.params?.cartItems || [];
  // Convert ISO string back to Date object (it was serialized for navigation)
  const selectedDateParam = route?.params?.selectedDate;
  const selectedDate = selectedDateParam ? new Date(selectedDateParam) : null;
  const selectedTimeSlot = route?.params?.selectedTimeSlot || null;
  const subtotal = route?.params?.subtotal || 0;
  const tax = route?.params?.tax || 0;
  const total = route?.params?.total || 0;

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [showToast, setShowToast] = useState(false);

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

  const handlePayNow = () => {
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
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <BackHeader navigation={navigation} title="Checkout" />
      
      {/* Toast Notification */}
      {showToast && (
        <View style={styles.toastContainer}>
          <MaterialCommunityIcons name="check-circle" size={24} color="#31C5FF" />
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
              <MaterialCommunityIcons name="calendar" size={20} color="#31C5FF" />
              <Text style={styles.serviceDetailText}>
                {formatDate(selectedDate)}
              </Text>
            </View>
            <View style={styles.serviceDetailRow}>
              <MaterialCommunityIcons name="clock-outline" size={20} color="#31C5FF" />
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
            <MaterialCommunityIcons name="ticket-percent" size={20} color="#31C5FF" />
            <Text style={styles.sectionTitle}>Apply Coupon</Text>
          </View>
          {appliedCoupon ? (
            <View style={styles.appliedCouponContainer}>
              <View style={styles.appliedCouponRow}>
                <MaterialCommunityIcons name="check-circle" size={20} color="#31C5FF" />
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
                placeholderTextColor="#666666"
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
          <Text style={styles.payNowButtonText}>Pay Now</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color="#000000" />
        </TouchableOpacity>
      </View>
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
    paddingBottom: 120,
  },
  serviceDetailsSection: {
    backgroundColor: '#1A1A1A',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  serviceDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceDetailText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  itemsSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  itemsContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    padding: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
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
    color: '#FFFFFF',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 12,
    color: '#CCCCCC',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    overflow: 'hidden',
  },
  couponInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: '#FFFFFF',
  },
  applyButton: {
    backgroundColor: '#31C5FF',
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
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#31C5FF',
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
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '600',
  },
  discountText: {
    fontSize: 14,
    color: '#31C5FF',
    fontWeight: '600',
  },
  removeCouponButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  removeCouponText: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '600',
  },
  paymentSummarySection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  summaryContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
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
    color: '#CCCCCC',
  },
  summaryValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  discountValue: {
    color: '#31C5FF',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#333333',
    paddingTop: 12,
    marginTop: 4,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#31C5FF',
  },
  payNowContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: '#333333',
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
    color: '#CCCCCC',
  },
  amountValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#31C5FF',
  },
  payNowButton: {
    flexDirection: 'row',
    backgroundColor: '#31C5FF',
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
    backgroundColor: '#1A1A1A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#31C5FF',
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
    color: '#FFFFFF',
    marginLeft: 12,
  },
});
