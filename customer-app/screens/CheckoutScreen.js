import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Dimensions, Alert, Share } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BackHeader from '../components/BackHeader';
import { createOrder } from '../services/orderApi';
import { getCoupons as getCouponsApi, validateCoupon as validateCouponApi } from '../services/couponApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAddressKeys, getVehicleKeys } from '../services/addressStorage';
import { getWallet, getReferralInfo } from '../services/walletApi';
import { useTheme } from '../theme/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const LIGHT_BLUE = '#85E4FC';

export default function CheckoutScreen({ navigation, route }) {
  const [checkoutCartItems, setCheckoutCartItems] = useState(() => route?.params?.cartItems || []);

  // Convert ISO string back to Date object (it was serialized for navigation)
  const selectedDateParam = route?.params?.selectedDate;
  const selectedTimeSlotParam = route?.params?.selectedTimeSlot || null;
  const slotItem =
    checkoutCartItems.find((item) => item.selectedDate && item.selectedTimeSlot) || null;
  const selectedDate = selectedDateParam
    ? new Date(selectedDateParam)
    : slotItem?.selectedDate
      ? new Date(slotItem.selectedDate)
      : null;
  const selectedTimeSlot = selectedTimeSlotParam || slotItem?.selectedTimeSlot || null;

  const subtotal = useMemo(
    () =>
      checkoutCartItems.reduce(
        (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
        0
      ),
    [checkoutCartItems]
  );
  const tax = useMemo(() => subtotal * 0.18, [subtotal]);
  const total = useMemo(() => subtotal + tax, [subtotal, tax]);

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponSuggestions, setCouponSuggestions] = useState([]);
  const [address, setAddress] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletLoading, setWalletLoading] = useState(false);
  const [useWallet, setUseWallet] = useState(false);
  const [referralInfo, setReferralInfo] = useState({
    code: '',
    totalReferrals: 0,
    totalEarnings: 0,
    perReferralRewardReferred: 100,
  });
  const { theme, isLightMode } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  // Load address and vehicle data
  const loadAddressAndVehicle = useCallback(async () => {
    try {
      const keys = await getAddressKeys();
      const [storedAddress, storedPhone, storedLat, storedLng] = await Promise.all([
        AsyncStorage.getItem(keys.currentAddress),
        AsyncStorage.getItem('authPhone'),
        AsyncStorage.getItem(keys.currentLat),
        AsyncStorage.getItem(keys.currentLng),
      ]);

      if (storedAddress) {
        setAddress({
          address: storedAddress,
          latitude: storedLat ? Number(storedLat) : null,
          longitude: storedLng ? Number(storedLng) : null,
        });
      } else {
        setAddress(null);
      }

      if (storedPhone) {
        const vKeys = await getVehicleKeys();
        const [storedVehicleType, storedVehicleModel] = await Promise.all([
          AsyncStorage.getItem(vKeys.vehicleType),
          AsyncStorage.getItem(vKeys.vehicleModel),
        ]);

        if (storedVehicleType && storedVehicleModel) {
          setVehicle({
            type: storedVehicleType,
            model: storedVehicleModel,
          });
        } else {
          setVehicle(null);
        }
      } else {
        setVehicle(null);
      }

      // Load wallet balance and referral info (if logged in)
      if (storedPhone) {
        try {
          setWalletLoading(true);
          const wallet = await getWallet();
          setWalletBalance(wallet.walletBalance || 0);
        } catch (err) {
          console.warn('Failed to load wallet:', err);
          setWalletBalance(0);
        } finally {
          setWalletLoading(false);
        }
        try {
          const referral = await getReferralInfo(storedPhone);
          if (referral) {
            setReferralInfo((prev) => ({
              ...prev,
              code: referral.referralCode || '',
              totalReferrals: referral.totalReferrals || 0,
              totalEarnings: referral.totalReferralEarnings || 0,
              perReferralRewardReferred: referral.perReferralRewardReferred ?? prev.perReferralRewardReferred,
            }));
          }
        } catch (_) {}
      } else {
        setWalletBalance(0);
      }
    } catch (error) {
      console.error('Error loading address/vehicle:', error);
    }
  }, []);

  // Load on mount and when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadAddressAndVehicle();
    }, [loadAddressAndVehicle])
  );

  useEffect(() => {
    let cancelled = false;
    const loadCouponSuggestions = async () => {
      try {
        const response = await getCouponsApi();
        const now = Date.now();
        const suggestions = (response?.data || [])
          .filter((c) => c?.isActive)
          .filter((c) => !c?.expiryDate || new Date(c.expiryDate).getTime() >= now)
          .slice(0, 3);
        if (!cancelled) setCouponSuggestions(suggestions);
      } catch (_) {
        if (!cancelled) setCouponSuggestions([]);
      }
    };
    loadCouponSuggestions();
    return () => {
      cancelled = true;
    };
  }, []);

  const formatDate = (date) => {
    if (!date) return '';
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
  };

  const getCheckoutItemTitle = (item) => {
    const packageType = item?.packageType || 'OneTime';
    if (packageType === 'Membership') {
      return item?.serviceName || item?.title || 'Woosh Black';
    }
    if (packageType !== 'OneTime') {
      if (item?.serviceName) return item.serviceName;
      if (typeof item?.title === 'string' && item.title.includes(' - ')) {
        return item.title.split(' - ')[0];
      }
    }
    return item?.title || 'Service';
  };

  const applyCoupon = async (overrideCode) => {
    const trimmedCode = (overrideCode || couponCode).trim().toUpperCase();
    if (!trimmedCode) return;

    try {
      setCouponLoading(true);
      const storedPhone = await AsyncStorage.getItem('authPhone');
      const couponRes = await validateCouponApi({
        code: trimmedCode,
        orderAmount: total,
        phone: storedPhone || '',
      });
      const discountAmount = Number(couponRes?.data?.discountAmount || 0);
      setDiscount(discountAmount);
      setAppliedCoupon(trimmedCode);
      setCouponCode('');
    } catch (error) {
      const msg = error?.response?.data?.message || 'Invalid Woosh Coin code';
      Alert.alert('Woosh Coin', msg);
      setCouponCode('');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
  };

  const removeCheckoutItem = useCallback(
    (id) => {
      setCheckoutCartItems((prev) => {
        const next = prev.filter((i) => i.id !== id);
        AsyncStorage.setItem('cartItems', JSON.stringify(next)).catch(() => {});
        if (next.length === 0) {
          setTimeout(() => navigation.goBack(), 0);
        }
        return next;
      });
      setAppliedCoupon(null);
      setDiscount(0);
    },
    [navigation]
  );

  const baseTotalAfterDiscount = total - discount;
  const walletUsable = useWallet ? Math.min(walletBalance, baseTotalAfterDiscount) : 0;
  const finalTotal = baseTotalAfterDiscount - walletUsable;
  const isPackageCheckout = checkoutCartItems.some((item) => {
    const t = item?.packageType || 'OneTime';
    return t !== 'OneTime' && t !== 'Membership';
  });

  const isScheduleComplete = (item) => {
    if (item?.packageType === 'Membership') return true;
    const packageType = item?.packageType || 'OneTime';
    if (packageType === 'OneTime') {
      return Boolean(item?.selectedDate && item?.selectedTimeSlot);
    }
    const times = Number(item?.packageTimes || 0);
    if (Array.isArray(item?.scheduledSlots) && item.scheduledSlots.length === times) return true;
    // Backend can also auto-generate if startDate + startTimeSlot exist
    return Boolean(item?.startDate && item?.startTimeSlot);
  };

  const handlePayNow = async () => {
    if (checkoutCartItems.length === 0) return;

    // Validate address and vehicle before proceeding
    if (!address || !address.address || address.address.trim() === '') {
      Alert.alert(
        'Address Required',
        'Please add your delivery address before placing the order.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add Address',
            onPress: () => navigation.navigate('Addresses', { returnTo: 'Checkout' }),
          },
        ]
      );
      return;
    }

    if (!vehicle || !vehicle.type || !vehicle.model || vehicle.model.trim() === '') {
      Alert.alert(
        'Vehicle Details Required',
        'Please add your vehicle details before placing the order.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add Vehicle',
            onPress: () => navigation.navigate('VehicleDetails', { returnTo: 'Checkout' }),
          },
        ]
      );
      return;
    }

    const incomplete = checkoutCartItems.find((i) => !isScheduleComplete(i));
    if (incomplete) {
      Alert.alert('Select slot(s) required', 'Please select the required slot(s) for all items before placing the order.');
      navigation.navigate('Cart');
      return;
    }

    if (isPackageCheckout) {
      const primaryItem = checkoutCartItems[0];
      const packageName =
        primaryItem?.serviceName ||
        (typeof primaryItem?.title === 'string' ? primaryItem.title.split(' - ')[0] : '') ||
        'Package';
      navigation.navigate('PaymentMethods', {
        amount: `₹${finalTotal.toFixed(2)}`,
        serviceName: packageName,
        fromCheckout: true,
        cartItems: checkoutCartItems,
        subtotal,
        tax,
        total,
        discount,
        walletUsed: walletUsable,
      });
      return;
    }

    try {
      const itemsPayload = checkoutCartItems.map((item) => {
        if (item.packageType === 'Membership') {
          if (!item.serviceId) {
            throw new Error('Membership product is not configured');
          }
          return {
            serviceId: item.serviceId,
            packageType: 'Membership',
            packageTimes: 1,
          };
        }
        const addOnIds = (item.addOns || []).map(addOn => addOn?._id || addOn).filter(Boolean);
        if (!item.serviceId) {
          throw new Error('Service ID missing from cart item');
        }
        const packageType = item.packageType || 'OneTime';
        const packageTimes = item.packageTimes || 1;

        if (packageType === 'OneTime') {
          if (!item.selectedDate || !item.selectedTimeSlot) {
            throw new Error('Scheduled slot missing from cart item');
          }
          return {
            serviceId: item.serviceId,
            addOnIds,
            packageType: 'OneTime',
            packageTimes: 1,
            scheduledDate: item.selectedDate,
            scheduledTimeSlot: item.selectedTimeSlot?.time || item.selectedTimeSlot,
          };
        }

        // Package: send scheduledSlots if available (preferred), else fallback to startDate/startTimeSlot
        if (item.scheduledSlots && Array.isArray(item.scheduledSlots) && item.scheduledSlots.length > 0) {
          return {
            serviceId: item.serviceId,
            addOnIds,
            packageType,
            packageTimes,
            scheduledSlots: item.scheduledSlots,
            customPackage: item.customPackage || undefined,
          };
        }
        if (item.startDate && item.startTimeSlot) {
          return {
            serviceId: item.serviceId,
            addOnIds,
            packageType,
            packageTimes,
            startDate: item.startDate,
            startTimeSlot: item.startTimeSlot?.time || item.startTimeSlot,
            customPackage: item.customPackage || undefined,
          };
        }
        throw new Error('Scheduled slots missing from package cart item');

      });

      const [storedName, storedPhone] = await Promise.all([
        AsyncStorage.getItem('authName'),
        AsyncStorage.getItem('authPhone'),
      ]);

      // Use the loaded address and vehicle state (already validated above)
      console.log('Creating order payload:', itemsPayload);
      const response = await createOrder({
        items: itemsPayload,
        customer: {
          name: storedName || '',
          phone: storedPhone || '',
          address: address.address,
          vehicleType: vehicle.type,
          vehicleModel: vehicle.model,
          latitude: address.latitude || undefined,
          longitude: address.longitude || undefined,
        },
        walletUsedAmount: walletUsable,
        couponCode: appliedCoupon || undefined,
      });
      console.log('Order created:', response);

      await AsyncStorage.removeItem('cartItems');

      const orderId = response?.data?._id ? String(response.data._id) : '';
      const shortId = orderId ? orderId.slice(-6).toUpperCase() : '';
      navigation.replace('BookingConfirmation', {
        orderId: shortId ? `Order #${shortId}` : '',
        subtitle: 'We’ll assign a professional.',
      });
    } catch (error) {
      console.error('Order creation failed:', error);
      Alert.alert('Order failed', 'Unable to place order right now.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style={isLightMode ? 'dark' : 'light'} />
      <BackHeader navigation={navigation} title="Checkout" />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Service Details */}
        {selectedDate && selectedTimeSlot && (
          <View style={styles.serviceDetailsSection}>
            <View style={styles.serviceDetailRow}>
              <MaterialCommunityIcons name="calendar" size={20} color={LIGHT_BLUE} />
              <Text style={styles.serviceDetailText}>
                {formatDate(selectedDate)}
              </Text>
            </View>
            <View style={styles.serviceDetailRow}>
              <MaterialCommunityIcons name="clock-outline" size={20} color={LIGHT_BLUE} />
              <Text style={styles.serviceDetailText}>
                {selectedTimeSlot.time}
              </Text>
            </View>
          </View>
        )}

        {/* Address Section */}
        <View style={styles.infoSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Addresses', { returnTo: 'Checkout' })}
            >
              <Text style={styles.editButtonText}>
                {address ? 'Change' : 'Add'}
              </Text>
            </TouchableOpacity>
          </View>
          {address ? (
            <View style={styles.infoCard}>
              <MaterialCommunityIcons name="map-marker" size={20} color={LIGHT_BLUE} />
              <Text style={styles.infoText}>{address.address}</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addInfoCard}
              onPress={() => navigation.navigate('Addresses', { returnTo: 'Checkout' })}
            >
              <MaterialCommunityIcons name="plus-circle" size={24} color={LIGHT_BLUE} />
              <Text style={styles.addInfoText}>Add Delivery Address</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Vehicle Section */}
        <View style={styles.infoSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Vehicle Details</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('VehicleDetails', { returnTo: 'Checkout' })}
            >
              <Text style={styles.editButtonText}>
                {vehicle ? 'Change' : 'Add'}
              </Text>
            </TouchableOpacity>
          </View>
          {vehicle ? (
            <View style={styles.infoCard}>
              <MaterialCommunityIcons name="car" size={20} color={LIGHT_BLUE} />
              <Text style={styles.infoText}>
                {vehicle.type} - {vehicle.model}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addInfoCard}
              onPress={() => navigation.navigate('VehicleDetails', { returnTo: 'Checkout' })}
            >
              <MaterialCommunityIcons name="plus-circle" size={24} color={LIGHT_BLUE} />
              <Text style={styles.addInfoText}>Add Vehicle Details</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Items Section */}
        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>Items</Text>
          <View style={styles.itemsContainer}>
            {checkoutCartItems.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Image
                  source={
                    item.packageType === 'Membership'
                      ? require('../assets/appicon.png')
                      : { uri: item.image }
                  }
                  style={styles.itemImage}
                  resizeMode="cover"
                />
                <View style={styles.itemDetails}>
                  <Text style={styles.itemTitle}>{getCheckoutItemTitle(item)}</Text>
                  <Text style={styles.itemQuantity}>Quantity: {item.quantity}</Text>
                </View>
                <View style={styles.itemRowRight}>
                  <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.checkoutRemoveTouch}
                    onPress={() => removeCheckoutItem(item.id)}
                    accessibilityRole="button"
                    accessibilityLabel="Remove item from order"
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={22} color="#b91c1c" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Apply Woosh Coin Section */}
        <View style={styles.couponSection}>
          <View style={styles.couponHeader}>
            <MaterialCommunityIcons name="ticket-percent" size={20} color={'LIGHT_BLUE'} />
            <Text style={styles.sectionTitle}>Apply Woosh Coin</Text>
          </View>
          {appliedCoupon ? (
            <View style={styles.appliedCouponContainer}>
              <View style={styles.appliedCouponRow}>
                <MaterialCommunityIcons name="check-circle" size={20} color={LIGHT_BLUE} />
                <Text style={styles.appliedCouponText}>{appliedCoupon} Woosh Coin Applied</Text>
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
            <>
              <View style={styles.couponInputContainer}>
                <TextInput
                  style={styles.couponInput}
                  placeholder="Enter Woosh Coin code"
                  placeholderTextColor={theme.textSecondary}
                  value={couponCode}
                  onChangeText={setCouponCode}
                  autoCapitalize="characters"
                />
                <TouchableOpacity 
                  style={styles.applyButton}
                  onPress={applyCoupon}
                  disabled={couponLoading}
                >
                  <Text style={styles.applyButtonText}>{couponLoading ? 'Applying...' : 'Apply'}</Text>
                </TouchableOpacity>
              </View>
              {couponSuggestions.length > 0 && (
                <View style={styles.couponSuggestionsWrap}>
                  <Text style={styles.couponSuggestionsTitle}>Suggested Woosh Coins</Text>
                  <View style={styles.couponSuggestionsRow}>
                    {couponSuggestions.map((coupon) => (
                      <TouchableOpacity
                        key={coupon._id || coupon.code}
                        style={styles.couponSuggestionChip}
                        activeOpacity={0.85}
                        onPress={() => applyCoupon(coupon.code)}
                      >
                        <MaterialCommunityIcons name="ticket-percent" size={14} color={LIGHT_BLUE} />
                        <Text style={styles.couponSuggestionCode}>{coupon.code}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </>
          )}
        </View>

        {/* Wallet Section */}
        {walletBalance > 0 && (
          <View style={styles.walletSection}>
            <View style={styles.walletHeader}>
              <MaterialCommunityIcons name="wallet" size={20} color={LIGHT_BLUE} />
              <Text style={styles.sectionTitle}>Wallet</Text>
            </View>
            <View style={styles.walletCard}>
              <View style={styles.walletRow}>
                <View>
                  <Text style={styles.walletBalanceLabel}>Available balance</Text>
                  <Text style={styles.walletBalanceValue}>₹{walletBalance.toFixed(2)}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.walletToggle, useWallet && styles.walletToggleActive]}
                  onPress={() => setUseWallet(!useWallet)}
                  disabled={walletLoading || baseTotalAfterDiscount <= 0}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.walletToggleText, useWallet && styles.walletToggleTextActive]}>
                    {useWallet ? 'Using wallet' : 'Use wallet'}
                  </Text>
                </TouchableOpacity>
              </View>
              {useWallet && walletUsable > 0 && (
                <View style={styles.walletAppliedRow}>
                  <Text style={styles.walletAppliedLabel}>Wallet applied</Text>
                  <Text style={styles.walletAppliedValue}>-₹{walletUsable.toFixed(2)}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Refer & Earn — matches Home */}
        <View style={styles.checkoutReferralSection}>
          <View style={styles.checkoutReferralBanner}>
            <View style={styles.checkoutReferralLeft}>
              <View style={styles.checkoutReferralTitleWrap}>
                <MaterialCommunityIcons name="gift-outline" size={18} color={theme.accent} />
                <Text style={styles.checkoutReferralTitle}>Refer &amp; Earn</Text>
              </View>
              <Text style={styles.checkoutReferralSubtitle}>
                Invite friends and both of you get ₹{referralInfo.perReferralRewardReferred || 100} in wallet.
              </Text>
              <View style={styles.checkoutReferralCodeChip}>
                <Text style={styles.checkoutReferralCodeChipLabel}>Code</Text>
                <Text style={styles.checkoutReferralCodeChipValue}>{referralInfo.code || 'COMINGSOON'}</Text>
              </View>
              <Text style={styles.checkoutReferralStats}>
                {referralInfo.totalReferrals} joined  |  ₹{referralInfo.totalEarnings} earned
              </Text>
            </View>
            <View style={styles.checkoutReferralRight}>
              <View style={styles.checkoutReferralIconWrap}>
                <MaterialCommunityIcons name="gift" size={24} color={theme.accent} />
              </View>
              <TouchableOpacity
                style={styles.checkoutReferralShareBtn}
                activeOpacity={0.85}
                onPress={() => {
                  const codeText = referralInfo.code || 'your Woosh referral code';
                  Share.share({
                    message: `Use my Woosh referral code ${codeText} and we both get ₹${referralInfo.perReferralRewardReferred || 100} in wallet on your first order!`,
                  }).catch(() => {});
                }}
              >
                <MaterialCommunityIcons name="share-variant" size={16} color="#000000" />
                <Text style={styles.checkoutReferralShareText}>Invite</Text>
              </TouchableOpacity>
            </View>
          </View>
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
            {walletUsable > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Wallet used</Text>
                <Text style={[styles.summaryValue, styles.discountValue]}>
                  -₹{walletUsable.toFixed(2)}
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
    color: '#0B0B0B',
  },
  itemRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkoutRemoveTouch: {
    padding: 4,
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
  couponSuggestionsWrap: {
    marginTop: 10,
  },
  couponSuggestionsTitle: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '600',
    marginBottom: 8,
  },
  couponSuggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  couponSuggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    backgroundColor: theme.background,
  },
  couponSuggestionCode: {
    fontSize: 12,
    color: theme.textPrimary,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  couponInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: theme.textPrimary,
  },
  applyButton: {
    backgroundColor: '#000000',
    borderLeftWidth: 1,
    borderLeftColor: theme.cardBorder,
    paddingHorizontal: 24,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  appliedCouponContainer: {
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: LIGHT_BLUE,
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
    color: LIGHT_BLUE,
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
  checkoutReferralSection: {
    paddingHorizontal: 16,
    marginTop: 20,
    paddingTop: 4,
    paddingBottom: 4,
  },
  checkoutReferralBanner: {
    backgroundColor: theme.cardBackground,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkoutReferralLeft: {
    flex: 1,
  },
  checkoutReferralRight: {
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 118,
    paddingVertical: 2,
  },
  checkoutReferralIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutReferralTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  checkoutReferralTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.textPrimary,
  },
  checkoutReferralSubtitle: {
    fontSize: 12,
    color: theme.textSecondary,
    lineHeight: 17,
    marginBottom: 8,
  },
  checkoutReferralCodeChip: {
    backgroundColor: theme.accentSoft,
    borderRadius: 999,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 7,
  },
  checkoutReferralCodeChipLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  checkoutReferralCodeChipValue: {
    fontSize: 12,
    fontWeight: '900',
    color: theme.textPrimary,
    letterSpacing: 0.5,
  },
  checkoutReferralStats: {
    fontSize: 11,
    color: theme.textSecondary,
  },
  checkoutReferralShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.accent,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  checkoutReferralShareText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
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
    color: LIGHT_BLUE,
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
    color: '#0B0B0B',
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
    color: '#0B0B0B',
  },
  payNowButton: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  payNowButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginRight: 8,
  },
  toastContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  toastIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  toastTextWrap: {
    flex: 1,
  },
  toastTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  toastOrderId: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 2,
  },
  toastSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.92)',
  },
  infoSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0B0B0B',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    padding: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: theme.textPrimary,
    lineHeight: 20,
  },
  addInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    borderStyle: 'dashed',
    padding: 20,
    gap: 12,
  },
  addInfoText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0B0B0B',
  },
  walletSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  walletCard: {
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    padding: 16,
  },
  walletRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletBalanceLabel: {
    fontSize: 13,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  walletBalanceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  walletToggle: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    backgroundColor: theme.background,
  },
  walletToggleActive: {
    borderColor: LIGHT_BLUE,
    backgroundColor: '#E0F7FF',
  },
  walletToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  walletToggleTextActive: {
    color: '#000000',
  },
  walletAppliedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  walletAppliedLabel: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  walletAppliedValue: {
    fontSize: 14,
    fontWeight: '600',
    color: LIGHT_BLUE,
  },
});
