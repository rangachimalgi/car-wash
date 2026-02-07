import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BackHeader from '../components/BackHeader';
import PricingPackages from '../components/PricingPackages';
import AddOnServicesList from '../components/AddOnServicesList';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext';
import { getServiceById } from '../services/serviceApi';

const { width } = Dimensions.get('window');
const LIGHT_BLUE = '#85E4FC';

export default function CartScreen({ navigation, route }) {
  const [cartItems, setCartItems] = useState([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [serviceDetailsById, setServiceDetailsById] = useState({});
  const { theme, isLightMode } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

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

  const getSlotKey = (item) => {
    const timeSlot = item?.selectedTimeSlot?.time || item?.selectedTimeSlot || '';
    return `${item?.selectedDate || ''}|${timeSlot}`;
  };

  const isSameCartLine = (existingItem, incomingItem) => {
    const sameService = existingItem?.serviceId && incomingItem?.serviceId
      ? existingItem.serviceId === incomingItem.serviceId
      : existingItem?.title === incomingItem?.title;
    return sameService && getSlotKey(existingItem) === getSlotKey(incomingItem);
  };

  // Handle adding items from navigation params
  useEffect(() => {
    if (route?.params?.addItem) {
      const newItem = route.params.addItem;
      setCartItems(prevItems => {
        // Merge only if same service AND same slot
        const existingIndex = prevItems.findIndex(item => isSameCartLine(item, newItem));
        if (existingIndex >= 0) {
          const updated = [...prevItems];
          updated[existingIndex].quantity += 1;
          return updated;
        }
        // Add new item as a separate line for a different slot
        return [...prevItems, newItem];
      });
      // Clear the route params to prevent re-adding on re-render
      navigation.setParams({ addItem: undefined });
    }
  }, [route?.params?.addItem, navigation]);

  // Handle updating an existing cart line (e.g., slot re-selection after changing package/add-ons)
  useEffect(() => {
    if (route?.params?.updateItem) {
      const updatedItem = route.params.updateItem;
      setCartItems(prevItems => {
        const idx = prevItems.findIndex(i => i?.id === updatedItem?.id);
        if (idx < 0) return prevItems;
        const next = [...prevItems];
        next[idx] = { ...next[idx], ...updatedItem };
        return next;
      });
      navigation.setParams({ updateItem: undefined });
    }
  }, [route?.params?.updateItem, navigation]);

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
      imageUri: addon.image || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop',
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

  const recomputeLinePrice = (item) => {
    const base = getBasePrice(item);
    const addOnsTotal = getAddOnsTotal(item);
    return Math.round(base + addOnsTotal);
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

  const handlePackageSelectionChange = (item, selection) => {
    if (!item?.id || !item?.serviceId) return;

    const serviceDetails = serviceDetailsById?.[item.serviceId];
    const serviceName = getServiceName(item);
    const addOns = Array.isArray(item.addOns) ? item.addOns : [];
    const addOnsTotal = getAddOnsTotal(item);

    const nextPackageType = selection === 'oneTime' ? 'OneTime' : selection?.type;
    const nextPackageTimes = selection === 'oneTime' ? 1 : Number(selection?.times || 1);
    const nextBasePrice = selection === 'oneTime'
      ? Number(serviceDetails?.basePrice ?? getBasePrice(item))
      : Math.round(Number(selection?.price ?? (serviceDetails?.basePrice || 0) * nextPackageTimes));

    const isNoop =
      (item.packageType || 'OneTime') === nextPackageType &&
      Number(item.packageTimes || 1) === nextPackageTimes;
    if (isNoop) return;

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
      // Clear any previous schedule so user re-selects correct slots
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

  const renderItemOptions = (item) => {
    if (!item?.serviceId) return null;

    const s = serviceDetailsById?.[item.serviceId];
    if (!s) {
      return (
        <Text style={styles.optionsLoadingText}>
          Loading packages and add ons...
        </Text>
      );
    }

    const oneTimePrice = Number(s?.basePrice ?? getBasePrice(item) ?? 0);
    const initialSelected =
      (item?.packageType || 'OneTime') === 'OneTime'
        ? 'oneTime'
        : {
            section: String(item.packageType).toLowerCase(),
            times: Number(item.packageTimes || 1),
            type: item.packageType,
          };
    const mappedAddOns = getMappedAddOns(item.serviceId);
    const selectedAddOnIds = (item?.addOns || []).map(a => a?._id || a).filter(Boolean);

    return (
      <>
        <PricingPackages
          oneTimePrice={oneTimePrice}
          serviceTitle={getServiceName(item)}
          serviceImage={item.image}
          duration={item.duration}
          onSelectionChange={(sel) => handlePackageSelectionChange(item, sel)}
          packages={s?.packages || null}
          initialSelectedPackage={initialSelected}
        />

        {mappedAddOns.length > 0 && (
          <AddOnServicesList
            services={mappedAddOns}
            maxVisible={4}
            selectedAddOns={selectedAddOnIds}
            onToggleAddOn={(addOnId) => handleToggleAddOn(item, addOnId)}
          />
        )}
      </>
    );
  };

  const updateQuantity = (id, change) => {
    setCartItems(items =>
      items.map(item => {
        if (item.id === id) {
          const newQuantity = Math.max(1, item.quantity + change);
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  const removeItem = (id) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
  const tax = subtotal * 0.18; // 18% tax
  const total = subtotal + tax;

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
            <View style={styles.itemsContainer}>
              {cartItems.map(item => (
                <View key={item.id}>
                  <View style={styles.cartItem}>
                    <Image 
                      source={{ uri: item.image }} 
                      style={styles.itemImage}
                      resizeMode="cover"
                    />
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <Text style={styles.itemPrice}>₹{item.price}</Text>
                      {Array.isArray(item?.addOns) && item.addOns.length > 0 && (
                        <Text style={styles.addOnsText}>
                          Add Ons: {item.addOns.length} • +₹{getAddOnsTotal(item)}
                        </Text>
                      )}
                      <View style={styles.quantityContainer}>
                        <TouchableOpacity 
                          style={styles.quantityButton}
                          onPress={() => updateQuantity(item.id, -1)}
                        >
                          <MaterialCommunityIcons name="minus" size={18} color={theme.textPrimary} />
                        </TouchableOpacity>
                        <Text style={styles.quantityText}>{item.quantity}</Text>
                        <TouchableOpacity 
                          style={styles.quantityButton}
                          onPress={() => updateQuantity(item.id, 1)}
                        >
                          <MaterialCommunityIcons name="plus" size={18} color={theme.textPrimary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.itemRightSection}>
                      <Text style={styles.itemTotalPrice}>
                        ₹{Number(item.price || 0) * Number(item.quantity || 1)}
                      </Text>
                      <TouchableOpacity 
                        style={styles.removeButton}
                        onPress={() => removeItem(item.id)}
                      >
                        <MaterialCommunityIcons name="delete-outline" size={20} color={theme.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Always show options per line item (no toggle button) */}
                  {item?.serviceId ? (
                    <View style={styles.optionsContainer}>
                      <Text style={styles.optionsTitle}>Customize: {getServiceName(item)}</Text>
                      {renderItemOptions(item)}
                    </View>
                  ) : null}
                </View>
              ))}
            </View>

            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>₹{subtotal}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax (18%)</Text>
                <Text style={styles.summaryValue}>₹{tax.toFixed(2)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.checkoutButton}
              onPress={() => {
                const incomplete = cartItems.find(i => !isScheduleComplete(i));
                if (incomplete) {
                  openSlotSelection(incomplete);
                  return;
                }
                navigation.navigate('Checkout', { cartItems, subtotal, tax, total });
              }}
            >
              <Text style={styles.checkoutButtonText}>
                {cartItems.find(i => !isScheduleComplete(i)) ? 'Select Slot(s)' : 'Checkout'}
              </Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color="#000000" />
            </TouchableOpacity>
          </>
        )}
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
  itemsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  itemImage: {
    width: 80,
    height: 80,
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
  itemPrice: {
    fontSize: 14,
    color: '#0B0B0B',
    marginBottom: 8,
  },
  addOnsText: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 6,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: theme.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
  itemRightSection: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  optionsContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 14,
  },
  optionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 10,
  },
  optionsLoadingText: {
    fontSize: 13,
    color: theme.textSecondary,
    marginBottom: 10,
  },
  itemTotalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0B0B0B',
    marginBottom: 8,
  },
  removeButton: {
    padding: 4,
  },
  summaryContainer: {
    backgroundColor: theme.cardBackground,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
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
    color: '#0B0B0B',
    fontWeight: '600',
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
  checkoutButton: {
    flexDirection: 'row',
    backgroundColor: LIGHT_BLUE,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkoutButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginRight: 8,
  },
});
