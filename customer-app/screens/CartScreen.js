import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Alert, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BackHeader from '../components/BackHeader';
import AddOnCard from '../components/AddOnCard';
import MonthlyPackageCard from '../components/MonthlyPackageCard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext';
import { getServiceById } from '../services/serviceApi';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const FALLBACK_IMAGE = require('../assets/carwash.png');

export default function CartScreen({ navigation, route }) {
  const [cartItems, setCartItems] = useState([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [serviceDetailsById, setServiceDetailsById] = useState({});
  const [expandedServiceId, setExpandedServiceId] = useState(null);
  const [address, setAddress] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const { theme, isLightMode } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const loadAddressAndVehicle = useCallback(async () => {
    try {
      const [storedAddress, storedPhone, storedLat, storedLng] = await Promise.all([
        AsyncStorage.getItem('currentAddress'),
        AsyncStorage.getItem('authPhone'),
        AsyncStorage.getItem('currentLat'),
        AsyncStorage.getItem('currentLng'),
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
        const [storedVehicleType, storedVehicleModel] = await Promise.all([
          AsyncStorage.getItem(`userVehicleType:${storedPhone}`),
          AsyncStorage.getItem(`userVehicleModel:${storedPhone}`),
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
    } catch (error) {
      console.error('Error loading address/vehicle:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAddressAndVehicle();
    }, [loadAddressAndVehicle])
  );

  const loadCart = async () => {
    try {
      const stored = await AsyncStorage.getItem('cartItems');
      if (stored) {
        const storedItems = JSON.parse(stored);
        setCartItems(prevItems => (prevItems.length ? prevItems : storedItems));
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setCartLoaded(true);
    }
  };

  const saveCart = async (items) => {
    try {
      await AsyncStorage.setItem('cartItems', JSON.stringify(items));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  // Load service details for add-ons/packages customization inside cart
  useEffect(() => {
    const serviceIds = Array.from(
      new Set(
        (cartItems || [])
          .map(i => i?.serviceId)
          .filter(Boolean)
      )
    );
    const missing = serviceIds.filter(id => !serviceDetailsById[id]);
    if (missing.length === 0) return;

    let cancelled = false;
    (async () => {
      try {
        const results = await Promise.all(
          missing.map(async (serviceId) => {
            try {
              const res = await getServiceById(serviceId);
              return res?.success ? res.data : null;
            } catch (e) {
              return null;
            }
          })
        );
        if (cancelled) return;
        setServiceDetailsById(prev => {
          const next = { ...prev };
          missing.forEach((id, idx) => {
            if (results[idx]) next[id] = results[idx];
          });
          return next;
        });
      } catch (e) {
        // ignore; cart still works without customization
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cartItems, serviceDetailsById]);

  useEffect(() => {
    if (cartLoaded) {
      saveCart(cartItems);
    }
  }, [cartItems, cartLoaded]);

  // Handle adding items from navigation params
  useEffect(() => {
    if (route?.params?.addItem) {
      const newItem = route.params.addItem;
      setCartItems(prevItems => {
        const existingIndex = prevItems.findIndex(item => item.id === newItem.id);
        if (existingIndex >= 0) {
          const updated = [...prevItems];
          updated[existingIndex].quantity += 1;
          return updated;
        }
        return [...prevItems, newItem];
      });
      navigation.setParams({ addItem: undefined });
    }
  }, [route?.params?.addItem, navigation]);

  const getServiceName = (item) => {
    if (item?.serviceName) return item.serviceName;
    if (typeof item?.title === 'string' && item.title.includes(' - ')) {
      return item.title.split(' - ')[0];
    }
    return item?.title || 'Service';
  };

  const getMappedAddOns = (serviceId) => {
    const s = serviceDetailsById?.[serviceId];
    const list = s?.addOnServices || [];
    return list.map(addon => ({
      imageUri: addon.image,
      imageSource: !addon.image ? FALLBACK_IMAGE : undefined,
      title: addon.name,
      price: addon.basePrice,
      _id: addon._id,
    }));
  };

  const getAddOnsTotal = (item) => {
    return (item?.addOns || []).reduce((sum, a) => sum + Number(a?.price || a?.basePrice || 0), 0);
  };

  const getBasePrice = (item) => {
    const addOnsTotal = getAddOnsTotal(item);
    if (item?.basePrice !== undefined && item?.basePrice !== null) return Number(item.basePrice);
    const inferred = Number(item?.price || 0) - addOnsTotal;
    return Math.max(0, inferred);
  };

  const handleToggleAddOn = (item, addOnId) => {
    if (!item?.id || !item?.serviceId) return;
    const mapped = getMappedAddOns(item.serviceId);
    const addOnObj = mapped.find(a => a._id === addOnId);
    if (!addOnObj) return;

    setCartItems(prev => prev.map(ci => {
      if (ci.id !== item.id) return ci;
      const current = Array.isArray(ci.addOns) ? ci.addOns : [];
      const exists = current.some(a => (a?._id || a) === addOnId);
      const nextAddOns = exists
        ? current.filter(a => (a?._id || a) !== addOnId)
        : [...current, addOnObj];
      const next = {
        ...ci,
        addOns: nextAddOns,
        basePrice: getBasePrice(ci),
      };
      return {
        ...next,
        price: Math.round(getBasePrice(next) + getAddOnsTotal(next)),
      };
    }));
  };

  const handlePackageSelectionChange = (item, packageData) => {
    if (!item?.id || !item?.serviceId) return;

    const serviceDetails = serviceDetailsById?.[item.serviceId];
    const serviceName = getServiceName(item);
    const addOns = Array.isArray(item.addOns) ? item.addOns : [];
    const addOnsTotal = getAddOnsTotal(item);

    const nextPackageType = packageData.type || 'OneTime';
    const nextPackageTimes = Number(packageData.times || 1);
    const nextBasePrice = packageData.type === 'OneTime'
      ? Number(serviceDetails?.basePrice ?? getBasePrice(item))
      : Math.round(Number(packageData.price ?? (serviceDetails?.basePrice || 0) * nextPackageTimes));

    const nextTitle = nextPackageType === 'OneTime'
      ? `${serviceName} - 1 Time Wash`
      : `${serviceName} - ${nextPackageType} (${nextPackageTimes}x/month)`;

    const updatedItem = {
      ...item,
      serviceName,
      title: nextTitle,
      packageType: nextPackageType,
      packageTimes: nextPackageTimes,
      basePrice: nextBasePrice,
      addOns,
      price: Math.round(nextBasePrice + addOnsTotal),
      selectedDate: undefined,
      selectedTimeSlot: undefined,
      scheduledSlots: undefined,
      startDate: undefined,
      startTimeSlot: undefined,
    };

    setCartItems(prev => prev.map(ci => (ci.id === item.id ? updatedItem : ci)));

    navigation.navigate('SlotSelection', {
      pendingItem: updatedItem,
      editingItemId: item.id,
    });
  };

  const isScheduleComplete = (item) => {
    const type = item?.packageType || 'OneTime';
    if (type === 'OneTime') {
      return Boolean(item?.selectedDate && item?.selectedTimeSlot);
    }
    const times = Number(item?.packageTimes || 0);
    return Array.isArray(item?.scheduledSlots) && item.scheduledSlots.length === times;
  };

  const openSlotSelection = (item) => {
    if (!item) return;
    navigation.navigate('SlotSelection', {
      pendingItem: item,
      editingItemId: item.id,
      cartItems,
      nextScreen: 'Checkout',
    });
  };

  const removeItem = (id) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  const toggleServiceExpanded = (itemId) => {
    setExpandedServiceId(prev => prev === itemId ? null : itemId);
  };

  const getMonthlyPackages = (serviceId) => {
    const s = serviceDetailsById?.[serviceId];
    if (!s?.packages?.monthly) return [];
    return s.packages.monthly.map((pkg, index) => ({
      id: `m${index + 1}`,
      ...pkg,
    }));
  };

  const getCurrentItem = () => {
    return cartItems.length > 0 ? cartItems[0] : null;
  };

  const currentItem = getCurrentItem();
  const serviceDetails = currentItem ? serviceDetailsById?.[currentItem.serviceId] : null;
  const mappedAddOns = currentItem ? getMappedAddOns(currentItem.serviceId) : [];
  const selectedAddOnIds = currentItem ? (currentItem?.addOns || []).map(a => a?._id || a).filter(Boolean) : [];
  const monthlyPackages = currentItem ? getMonthlyPackages(currentItem.serviceId) : [];
  const oneTimePrice = currentItem ? Number(serviceDetails?.basePrice ?? getBasePrice(currentItem) ?? 0) : 0;
  const currentPackageType = currentItem?.packageType || 'OneTime';
  const currentPackageTimes = currentItem?.packageTimes || 1;

  const subtotal = cartItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
  const tax = subtotal * 0.18;
  const total = subtotal + tax;
  const duration = serviceDetails?.duration || '23 mins';

  if (!cartLoaded) {
    return (
      <View style={styles.container}>
        <StatusBar style={isLightMode ? 'dark' : 'light'} />
        <BackHeader navigation={navigation} title="Cart" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style={isLightMode ? 'dark' : 'light'} />
      <BackHeader navigation={navigation} title="Cart" />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {cartItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="cart-off" size={64} color={theme.textSecondary} />
            <Text style={styles.emptyText}>Your cart is empty</Text>
            <TouchableOpacity 
              style={styles.continueShoppingButton}
              onPress={() => navigation.navigate('MainTabs')}
            >
              <Text style={styles.continueShoppingText}>Continue Shopping</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {monthlyPackages.length > 0 && (
                  <View style={styles.packagesSection}>
                    <Text style={styles.packagesTitle}>Monthly Packages</Text>
                    <FlatList
                      data={monthlyPackages}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      keyExtractor={(item) => item.id}
                      renderItem={({ item }) => {
                        const isSelected = currentPackageType === 'Monthly' && currentPackageTimes === item.times;
                        return (
                          <MonthlyPackageCard
                            title={`${item.times}x Wash/Month`}
                            price={item.price}
                            perWashPrice={item.perWash}
                            times={item.times}
                            discount={item.discount}
                            packageId={item.id}
                            isSelected={isSelected}
                            onSelect={() => handlePackageSelectionChange(currentItem, {
                              type: 'Monthly',
                              times: item.times,
                              price: item.price,
                            })}
                          />
                        );
                      }}
                      contentContainerStyle={styles.packagesList}
                    />
                  </View>
                )}

            {/* Vehicle Header */}
            {vehicle && (
              <View style={styles.vehicleHeader}>
                <View style={styles.vehicleInfo}>
                  <Image 
                    source={FALLBACK_IMAGE}
                    style={styles.vehicleImage}
                    resizeMode="cover"
                  />
                  <Text style={styles.vehicleName}>{vehicle.type} - {vehicle.model}</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('VehicleDetails', { returnTo: 'Cart' })}>
                  <MaterialCommunityIcons name="delete-outline" size={24} color="#FF4444" />
                </TouchableOpacity>
              </View>
            )}

            {/* Service Items Section */}
            {currentItem && (
              <View style={styles.serviceItemsSection}>
                <View style={styles.serviceItemsHeader}>
                  <Text style={styles.serviceItemsTitle}>Service Items</Text>
                  <TouchableOpacity onPress={() => toggleServiceExpanded(currentItem.id)}>
                    <View style={styles.collapseButton}>
                      <Text style={styles.collapseText}>Collapse</Text>
                      <MaterialCommunityIcons 
                        name={expandedServiceId === currentItem.id ? 'chevron-down' : 'chevron-up'} 
                        size={18} 
                        color="#007AFF" 
                      />
                    </View>
                  </TouchableOpacity>
                </View>
                
                {expandedServiceId !== currentItem.id && (
                  <View style={styles.serviceItemCard}>
                    <Text style={styles.serviceItemName}>
                      ({currentPackageType === 'OneTime' ? 'Bucket Wash' : 'Monthly Package'}) {getServiceName(currentItem)}
                      {currentPackageType !== 'OneTime' && ` & ${currentPackageType === 'Monthly' ? 'Tyre Polish Only' : ''}`}
                    </Text>
                    <Text style={styles.serviceItemPrice}>₹{currentItem.price}</Text>
                  </View>
                )}

                {/* Add Ons Section */}
                {mappedAddOns.length > 0 && (
                  <View style={styles.addOnsSection}>
                    <Text style={styles.addOnsTitle}>Add Ons</Text>
                    <FlatList
                      data={mappedAddOns}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      keyExtractor={(item) => item._id || item.title}
                      renderItem={({ item }) => (
                        <AddOnCard
                          title={item.title}
                          price={item.price}
                          imageUri={item.imageUri}
                          imageSource={item.imageSource}
                          addOnId={item._id}
                          isSelected={selectedAddOnIds.includes(item._id)}
                          onToggle={() => handleToggleAddOn(currentItem, item._id)}
                        />
                      )}
                      contentContainerStyle={styles.addOnsList}
                    />
                  </View>
                )}

                {/* Monthly Packages Section */}
                
              </View>
            )}

            {/* Delivery Address Section */}
            <View style={styles.deliverySection}>
              <View style={styles.deliveryHeader}>
                <Text style={styles.deliveryLabel}>Delivering service at</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Addresses', { returnTo: 'Cart' })}>
                  <Text style={styles.editButton}>Edit</Text>
                </TouchableOpacity>
              </View>
              {address ? (
                <View style={styles.addressRow}>
                  <MaterialCommunityIcons name="home" size={20} color="#000000" />
                  <Text style={styles.addressText}>{address.address}</Text>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.addAddressButton}
                  onPress={() => navigation.navigate('Addresses', { returnTo: 'Cart' })}
                >
                  <Text style={styles.addAddressText}>Add Address</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Bottom Action Bar */}
      {cartItems.length > 0 && (
        <View style={styles.bottomBar}>
          <View style={styles.priceSection}>
            <Text style={styles.priceAmount}>₹{total.toFixed(0)}</Text>
            <Text style={styles.durationText}>{duration}</Text>
          </View>
          <TouchableOpacity 
            style={styles.selectSlotButton}
            onPress={() => {
              const incomplete = cartItems.find(i => !isScheduleComplete(i));
              if (incomplete) {
                openSlotSelection(incomplete);
              } else {
                navigation.navigate('Checkout', { cartItems, subtotal, tax, total });
              }
            }}
          >
            <Text style={styles.selectSlotText}>Select Slot</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const createStyles = theme => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 18,
    color: theme.textPrimary,
    marginTop: 16,
    marginBottom: 24,
  },
  continueShoppingButton: {
    backgroundColor: theme.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  continueShoppingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  deliverySection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  deliveryLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  editButton: {
    fontSize: 14,
    fontWeight: '700',
    color: '#007AFF',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    flex: 1,
  },
  addAddressButton: {
    paddingVertical: 8,
  },
  addAddressText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#007AFF',
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E5E5',
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vehicleImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  serviceItemsSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  serviceItemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceItemsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
  collapseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  collapseText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  serviceItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  serviceItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
    marginRight: 12,
  },
  serviceItemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  addOnsSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  addOnsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
  },
  addOnsList: {
    paddingRight: 16,
  },
  packagesSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  packagesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
  },
  packagesList: {
    paddingRight: 16,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceSection: {
    flex: 1,
  },
  priceAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4,
  },
  durationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  selectSlotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  selectSlotText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
