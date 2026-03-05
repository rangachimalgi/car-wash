import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Alert, FlatList, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BackHeader from '../components/BackHeader';
import AddOnCard from '../components/AddOnCard';
import MonthlyPackageCard from '../components/MonthlyPackageCard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext';
import { getAddressKeys } from '../services/addressStorage';
import { getServiceById } from '../services/serviceApi';
import { useFocusEffect } from '@react-navigation/native';
import { getVehicles } from '../services/vehicleApi';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const FALLBACK_IMAGE = require('../assets/carwash.png');

export default function CartScreen({ navigation, route }) {
  const [cartItems, setCartItems] = useState([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [serviceDetailsById, setServiceDetailsById] = useState({});
  const [expandedServiceId, setExpandedServiceId] = useState(null);
  const [address, setAddress] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [allVehicles, setAllVehicles] = useState([]);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const { theme, isLightMode } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const getCurrentItem = () => {
    return cartItems.length > 0 ? cartItems[0] : null;
  };

  const currentItem = getCurrentItem();

  // Get service category from cart items - memoized
  const serviceCategory = useMemo(() => {
    if (!cartItems.length || !currentItem) return null;
    const serviceDetails = serviceDetailsById?.[currentItem.serviceId];
    return serviceDetails?.category || null;
  }, [cartItems, currentItem?.serviceId, serviceDetailsById]);

  // Check if vehicle is valid for current service
  const isVehicleValidForService = useCallback((vehicleType, serviceCategory) => {
    if (!serviceCategory || !vehicleType) return true; // Allow if unknown
    
    const vehicleTypeLower = vehicleType?.toLowerCase() || '';
    
    if (serviceCategory === 'CarWash') {
      // Only allow 4-wheelers (cars)
      return vehicleTypeLower === '4wheeler' || 
             vehicleTypeLower === 'car' ||
             (vehicleTypeLower.includes('4') && vehicleTypeLower.includes('wheeler')) ||
             (!vehicleTypeLower.includes('2') && !vehicleTypeLower.includes('bike'));
    }
    if (serviceCategory === 'BikeWash') {
      // Only allow 2-wheelers (bikes)
      return vehicleTypeLower === '2wheeler' || 
             vehicleTypeLower === 'bike' ||
             vehicleTypeLower.includes('bike') ||
             (vehicleTypeLower.includes('2') && vehicleTypeLower.includes('wheeler'));
    }
    return true;
  }, []);

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
        // Load selected vehicle from AsyncStorage (faster than API)
        const [storedVehicleType, storedVehicleModel] = await Promise.all([
          AsyncStorage.getItem(`userVehicleType:${storedPhone}`),
          AsyncStorage.getItem(`userVehicleModel:${storedPhone}`),
        ]);
        
        if (storedVehicleType && storedVehicleModel) {
          // Only set vehicle if it's valid for the current service
          if (!serviceCategory || isVehicleValidForService(storedVehicleType, serviceCategory)) {
            setVehicle({
              type: storedVehicleType,
              model: storedVehicleModel,
            });
          } else {
            // Vehicle doesn't match service, set to null
            setVehicle(null);
          }
        } else {
          setVehicle(null);
        }
      } else {
        setVehicle(null);
      }
    } catch (error) {
      console.error('Error loading address/vehicle:', error);
    }
  }, [serviceCategory, isVehicleValidForService]);

  // Load vehicles separately and only when modal opens (with caching)
  const loadVehiclesForModal = useCallback(async () => {
    try {
      const storedPhone = await AsyncStorage.getItem('authPhone');
      if (!storedPhone) return;
      
      // Try AsyncStorage first (faster)
      const cachedVehicles = await AsyncStorage.getItem(`userVehicles:${storedPhone}`);
      if (cachedVehicles) {
        try {
          const parsed = JSON.parse(cachedVehicles);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setAllVehicles(parsed);
            // Still sync from API in background but don't wait
            getVehicles(storedPhone).then(vehicles => {
              if (vehicles && Array.isArray(vehicles) && vehicles.length >= 0) {
                setAllVehicles(vehicles);
                if (vehicles.length > 0) {
                  AsyncStorage.setItem(`userVehicles:${storedPhone}`, JSON.stringify(vehicles));
                }
              }
            }).catch(() => {});
            return; // Return early after setting cached data
          }
        } catch (e) {
          // Invalid cache, continue to API
        }
      }
      
      // No cache or invalid cache, load from API
      const vehicles = await getVehicles(storedPhone);
      setAllVehicles(vehicles || []);
      if (vehicles && vehicles.length > 0) {
        AsyncStorage.setItem(`userVehicles:${storedPhone}`, JSON.stringify(vehicles));
      }
    } catch (e) {
      console.warn('Error loading vehicles:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAddressAndVehicle();
    }, [loadAddressAndVehicle])
  );

  // Reload vehicle when service category changes (to filter correctly)
  // Use a ref to track if we've already loaded for this category
  const lastCategoryRef = React.useRef(null);
  useEffect(() => {
    if (serviceCategory !== lastCategoryRef.current) {
      lastCategoryRef.current = serviceCategory;
      loadAddressAndVehicle();
    }
  }, [serviceCategory, loadAddressAndVehicle]);

  // Load vehicles when modal opens (only if not already loaded)
  useEffect(() => {
    if (showVehicleModal && allVehicles.length === 0) {
      loadVehiclesForModal();
    }
  }, [showVehicleModal, loadVehiclesForModal, allVehicles.length]);

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
  const serviceDetails = currentItem ? serviceDetailsById?.[currentItem.serviceId] : null;

  // Filter vehicles based on service category
  const filteredVehicles = useMemo(() => {
    if (!serviceCategory) return allVehicles;
    
    if (serviceCategory === 'CarWash') {
      // Only show 4-wheelers (cars)
      return allVehicles.filter(v => {
        const vehicleType = (v.vehicleType || '').toLowerCase();
        const vehicleModel = (v.vehicleModel || '').toLowerCase();
        
        // Check if it's a 4-wheeler
        const is4Wheeler = vehicleType === '4wheeler' || 
                          vehicleType === 'car' ||
                          (vehicleType.includes('4') && vehicleType.includes('wheeler'));
        
        // Exclude bikes
        const isBike = vehicleType.includes('2wheeler') ||
                      vehicleType.includes('bike') ||
                      vehicleType.includes('2') && vehicleType.includes('wheeler') ||
                      vehicleModel.includes('bike');
        
        return is4Wheeler && !isBike;
      });
    }
    if (serviceCategory === 'BikeWash') {
      // Only show 2-wheelers (bikes)
      return allVehicles.filter(v => {
        const vehicleType = (v.vehicleType || '').toLowerCase();
        const vehicleModel = (v.vehicleModel || '').toLowerCase();
        
        // Check if it's a 2-wheeler
        return vehicleType === '2wheeler' || 
               vehicleType === 'bike' ||
               vehicleType.includes('bike') ||
               (vehicleType.includes('2') && vehicleType.includes('wheeler')) ||
               vehicleModel.includes('bike');
      });
    }
    return allVehicles;
  }, [allVehicles, serviceCategory]);

  const handleSelectVehicle = async (selectedVehicle) => {
    const phone = await AsyncStorage.getItem('authPhone');
    if (!phone) return;

    const vehicleType = selectedVehicle.vehicleType;
    const vehicleModel = selectedVehicle.vehicleModel;

    // Save to AsyncStorage
    await AsyncStorage.setItem(`userVehicleType:${phone}`, vehicleType);
    await AsyncStorage.setItem(`userVehicleModel:${phone}`, vehicleModel);

    setVehicle({
      type: vehicleType,
      model: vehicleModel,
    });

    setShowVehicleModal(false);
  };

  const formatVehicleName = (vehicleModel) => {
    if (!vehicleModel) return '';
    
    // Check if it's a 2 wheeler bike (don't reformat)
    if (vehicleModel.toLowerCase().includes('2 wheeler') || vehicleModel.toLowerCase().includes('bike')) {
      if (vehicleModel.includes('2 wheeler') && !vehicleModel.includes('/')) {
        return vehicleModel.replace('2 wheeler bike', '2 wheeler / bike');
      }
      return vehicleModel;
    }
    
    // For car models like "Hyundai Elantra", format to "Elantra, Hyundai"
    const parts = vehicleModel.split(' ');
    if (parts.length >= 2) {
      const brand = parts[0];
      const model = parts.slice(1).join(' ');
      return `${model}, ${brand}`;
    }
    return vehicleModel;
  };

  const getVehicleImage = (vehicleType) => {
    if (vehicleType === 'Bike' || vehicleType?.toLowerCase().includes('bike')) {
      return require('../assets/fallbackBike.png');
    }
    return require('../assets/fallback.png');
  };
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
            {(() => {
              const shouldShowVehicle = vehicle && (!serviceCategory || isVehicleValidForService(vehicle.type, serviceCategory));
              
              if (!shouldShowVehicle) {
                return (
                  <View style={styles.vehicleHeader}>
                    <View style={styles.vehicleInfo}>
                      <MaterialCommunityIcons name="car-alert" size={24} color={theme.textSecondary} />
                      <Text style={styles.vehicleName}>
                        {serviceCategory === 'CarWash' ? 'Select a car' : serviceCategory === 'BikeWash' ? 'Select a bike' : 'Select a vehicle'}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.changeVehicleButton}
                      onPress={() => setShowVehicleModal(true)}
                    >
                      <Text style={styles.changeVehicleButtonText}>Change Vehicle</Text>
                    </TouchableOpacity>
                  </View>
                );
              }
              
              return (
                <View style={styles.vehicleHeader}>
                  <View style={styles.vehicleInfo}>
                    <Image 
                      source={FALLBACK_IMAGE}
                      style={styles.vehicleImage}
                      resizeMode="cover"
                    />
                    <Text style={styles.vehicleName}>{vehicle.type} - {vehicle.model}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.changeVehicleButton}
                    onPress={() => setShowVehicleModal(true)}
                  >
                    <Text style={styles.changeVehicleButtonText}>Change Vehicle</Text>
                  </TouchableOpacity>
                </View>
              );
            })()}

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

      {/* Vehicle Selection Modal */}
      <Modal
        visible={showVehicleModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowVehicleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {serviceCategory === 'CarWash' ? 'Select Car' : serviceCategory === 'BikeWash' ? 'Select Bike' : 'Select Vehicle'}
              </Text>
              <TouchableOpacity onPress={() => setShowVehicleModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
            
            {filteredVehicles.length === 0 ? (
              <View style={styles.emptyVehicleContainer}>
                <MaterialCommunityIcons name="car-off" size={48} color={theme.textSecondary} />
                <Text style={styles.emptyVehicleText}>
                  {serviceCategory === 'CarWash' 
                    ? 'No cars saved. Add a car from the vehicle selection screen.'
                    : serviceCategory === 'BikeWash'
                    ? 'No bikes saved. Add a bike from the vehicle selection screen.'
                    : 'No vehicles saved. Add a vehicle from the vehicle selection screen.'}
                </Text>
                <TouchableOpacity 
                  style={styles.addVehicleButton}
                  onPress={() => {
                    setShowVehicleModal(false);
                    navigation.navigate('VehicleDetails');
                  }}
                >
                  <Text style={styles.addVehicleButtonText}>Add Vehicle</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <ScrollView style={styles.vehicleList}>
                  {filteredVehicles.map((v) => {
                    const vehicleName = formatVehicleName(v.vehicleModel);
                    const isSelected = vehicle && vehicle.type === v.vehicleType && vehicle.model === v.vehicleModel;
                    
                    return (
                      <TouchableOpacity
                        key={v._id || v.id}
                        style={[styles.vehicleOption, isSelected && styles.vehicleOptionSelected]}
                        onPress={() => handleSelectVehicle(v)}
                      >
                        <Image 
                          source={getVehicleImage(v.vehicleType)} 
                          style={styles.vehicleOptionImage}
                          resizeMode="contain"
                        />
                        <View style={styles.vehicleOptionInfo}>
                          <Text style={styles.vehicleOptionName}>
                            {vehicleName || v.vehicleModel || 'Unknown Vehicle'}
                          </Text>
                        </View>
                        {isSelected && (
                          <MaterialCommunityIcons name="check-circle" size={24} color="#007AFF" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                <View style={styles.modalFooter}>
                  <TouchableOpacity 
                    style={styles.addNewVehicleButton}
                    onPress={() => {
                      setShowVehicleModal(false);
                      navigation.navigate('VehicleDetails');
                    }}
                  >
                    <MaterialCommunityIcons name="plus-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.addNewVehicleButtonText}>Add New Vehicle</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  changeVehicleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: theme.accent || '#007AFF',
  },
  changeVehicleButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.background || '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.cardBorder || '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.textPrimary,
  },
  vehicleList: {
    maxHeight: 400,
  },
  vehicleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.cardBorder || '#E0E0E0',
  },
  vehicleOptionSelected: {
    backgroundColor: theme.cardBackground || '#F5F5F5',
  },
  vehicleOptionImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  vehicleOptionInfo: {
    flex: 1,
  },
  vehicleOptionName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.textPrimary,
  },
  emptyVehicleContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyVehicleText: {
    marginTop: 16,
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  addVehicleButton: {
    backgroundColor: theme.accent || '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addVehicleButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: theme.cardBorder || '#E0E0E0',
  },
  addNewVehicleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.accent || '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  addNewVehicleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
