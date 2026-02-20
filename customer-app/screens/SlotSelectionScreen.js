import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BackHeader from '../components/BackHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useTheme } from '../theme/ThemeContext';
import { getAvailableSlots, getTimeSlots } from '../services/slotApi';

const { width } = Dimensions.get('window');

export default function SlotSelectionScreen({ navigation, route }) {
  const pendingItem = route?.params?.pendingItem || null;
  const editingItemId = route?.params?.editingItemId || null;
  const nextScreen = route?.params?.nextScreen || 'Cart'; // 'Cart' | 'Checkout'
  const cartItems = route?.params?.cartItems || (pendingItem ? [pendingItem] : []);
  const subtotal = route?.params?.subtotal || (pendingItem?.price || 0);
  const tax = route?.params?.tax || 0;
  const total = route?.params?.total || (pendingItem?.price || 0);

  // Check if this is a package order
  const isPackage = pendingItem?.packageType && pendingItem.packageType !== 'OneTime';
  const packageTimes = pendingItem?.packageTimes || 1;

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [generatedSlots, setGeneratedSlots] = useState([]);
  const [editingSlotIndex, setEditingSlotIndex] = useState(null);
  const [locationAddress, setLocationAddress] = useState('');
  const [locationError, setLocationError] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  
  // Slot availability state
  const [timeSlots, setTimeSlots] = useState([]);
  const [availableSlotsByDate, setAvailableSlotsByDate] = useState({});
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [slotsError, setSlotsError] = useState(null);
  
  const { theme, isLightMode } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  useEffect(() => {
    const loadSavedAddress = async () => {
      try {
        const saved = await AsyncStorage.getItem('currentAddress');
        if (saved) {
          setLocationAddress(saved);
          return;
        }
        const savedAddresses = await AsyncStorage.getItem('savedAddresses');
        if (savedAddresses) {
          const parsed = JSON.parse(savedAddresses);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const defaultAddress = parsed.find(addr => addr.isDefault) || parsed[0];
            const fullAddress = [
              defaultAddress.address,
              defaultAddress.area,
              defaultAddress.city,
              defaultAddress.pincode,
            ]
              .filter(Boolean)
              .join(', ');
            setLocationAddress(fullAddress);
          }
        }
      } catch (error) {
        console.warn('Failed to load saved address:', error);
      }
    };
    loadSavedAddress();
  }, []);

  // Generate dates for the next 30 days (for package selection)
  const generateDates = (days = 30) => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const dates = generateDates(isPackage ? 30 : 7);

  // Fetch time slots and available slots from API
  useEffect(() => {
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSlotsError(null);
      
      try {
        // Fetch time slots configuration
        const timeSlotsResponse = await getTimeSlots();
        if (timeSlotsResponse.success) {
          setTimeSlots(timeSlotsResponse.data);
        } else {
          // Fallback to default slots if API fails
          setTimeSlots([
            { id: '1', time: '9:00 AM - 10:00 AM' },
            { id: '2', time: '10:00 AM - 11:00 AM' },
            { id: '3', time: '11:00 AM - 12:00 PM' },
            { id: '4', time: '12:00 PM - 1:00 PM' },
            { id: '5', time: '1:00 PM - 2:00 PM' },
            { id: '6', time: '2:00 PM - 3:00 PM' },
            { id: '7', time: '3:00 PM - 4:00 PM' },
            { id: '8', time: '4:00 PM - 5:00 PM' },
            { id: '9', time: '5:00 PM - 6:00 PM' },
            { id: '10', time: '6:00 PM - 7:00 PM' },
          ]);
        }

        // Fetch available slots for the date range
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + (isPackage ? 30 : 7));
        endDate.setHours(23, 59, 59, 999);

        const slotsResponse = await getAvailableSlots(startDate, endDate);
        if (slotsResponse.success) {
          setAvailableSlotsByDate(slotsResponse.data.slotsByDate || {});
        }
      } catch (error) {
        console.error('Error fetching slots:', error);
        setSlotsError('Failed to load available slots. Showing all slots.');
        // Fallback: show all slots if API fails
        setTimeSlots([
          { id: '1', time: '9:00 AM - 10:00 AM' },
          { id: '2', time: '10:00 AM - 11:00 AM' },
          { id: '3', time: '11:00 AM - 12:00 PM' },
          { id: '4', time: '12:00 PM - 1:00 PM' },
          { id: '5', time: '1:00 PM - 2:00 PM' },
          { id: '6', time: '2:00 PM - 3:00 PM' },
          { id: '7', time: '3:00 PM - 4:00 PM' },
          { id: '8', time: '4:00 PM - 5:00 PM' },
          { id: '9', time: '5:00 PM - 6:00 PM' },
          { id: '10', time: '6:00 PM - 7:00 PM' },
        ]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [isPackage]);

  // Get available slots for a specific date
  const getAvailableSlotsForDate = (date) => {
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
    return availableSlotsByDate[dateKey] || timeSlots; // Fallback to all slots if not found
  };

  const formatDate = (date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
      day: days[date.getDay()],
      date: date.getDate(),
      month: months[date.getMonth()],
      full: `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`,
    };
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Auto-generate slots for package orders
  const generatePackageSlots = (startDate, startTimeSlot) => {
    if (!startDate || !startTimeSlot) return [];

    const slots = [];
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    // Pattern: 3 washes per week
    // Week pattern: Day 0, Day 2, Day 5 (1 day gap, then 2 day gap)
    const weeklyPattern = [0, 2, 5];
    
    let weekOffset = 0;
    
    for (let i = 0; i < packageTimes; i++) {
      const patternIndex = i % 3;
      const dayOffset = weeklyPattern[patternIndex];
      
      // Move to next week after completing 3 slots
      if (patternIndex === 0 && i > 0) {
        weekOffset += 7;
      }
      
      const slotDate = new Date(start);
      slotDate.setDate(start.getDate() + weekOffset + dayOffset);
      
      slots.push({
        scheduledDate: slotDate,
        scheduledTimeSlot: startTimeSlot,
      });
    }
    
    return slots;
  };

  // Handle first date/time selection for packages
  useEffect(() => {
    if (isPackage && selectedDate && selectedTimeSlot && generatedSlots.length === 0) {
      const slots = generatePackageSlots(selectedDate, selectedTimeSlot);
      setGeneratedSlots(slots);
    }
  }, [selectedDate, selectedTimeSlot, isPackage]);

  // Update a specific slot
  const updateSlot = (index, newDate, newTimeSlot) => {
    // Validate: no two washes on same day
    const dateString = newDate.toDateString();
    const hasConflict = generatedSlots.some((slot, idx) => 
      idx !== index && slot.scheduledDate.toDateString() === dateString
    );

    if (hasConflict) {
      Alert.alert('Invalid Date', 'Cannot schedule multiple washes on the same day. Please choose a different date.');
      return;
    }

    const updated = [...generatedSlots];
    updated[index] = {
      scheduledDate: newDate,
      scheduledTimeSlot: newTimeSlot,
    };
    setGeneratedSlots(updated);
    setEditingSlotIndex(null);
  };

  const handleCheckout = () => {
    if (isPackage) {
      // Package: validate all slots are set
      if (generatedSlots.length !== packageTimes) {
        Alert.alert('Incomplete Selection', `Please select all ${packageTimes} slots for your package.`);
        return;
      }
      
      // Validate no duplicate dates
      const dateStrings = generatedSlots.map(slot => slot.scheduledDate.toDateString());
      const uniqueDates = new Set(dateStrings);
      if (dateStrings.length !== uniqueDates.size) {
        Alert.alert('Invalid Selection', 'Cannot schedule multiple washes on the same day.');
        return;
      }

      const itemWithSlots = {
        ...pendingItem,
        startDate: selectedDate.toISOString(),
        startTimeSlot: selectedTimeSlot,
        scheduledSlots: generatedSlots.map(slot => ({
          scheduledDate: slot.scheduledDate.toISOString(),
          scheduledTimeSlot: slot.scheduledTimeSlot?.time || slot.scheduledTimeSlot,
        })),
      };

      const finalItem = editingItemId ? { ...itemWithSlots, id: editingItemId } : itemWithSlots;
      if (nextScreen === 'Checkout') {
        (async () => {
          try {
            const stored = await AsyncStorage.getItem('cartItems');
            const base = Array.isArray(cartItems) && cartItems.length > 0
              ? cartItems
              : (stored ? JSON.parse(stored) : []);
            const idx = base.findIndex(i => i?.id === finalItem.id);
            const next = idx >= 0
              ? base.map(i => (i?.id === finalItem.id ? { ...i, ...finalItem } : i))
              : [...base, finalItem];
            await AsyncStorage.setItem('cartItems', JSON.stringify(next));

            const isScheduleComplete = (item) => {
              const packageType = item?.packageType || 'OneTime';
              if (packageType === 'OneTime') {
                return Boolean(item?.selectedDate && item?.selectedTimeSlot);
              }
              const times = Number(item?.packageTimes || 0);
              if (Array.isArray(item?.scheduledSlots) && item.scheduledSlots.length === times) return true;
              return Boolean(item?.startDate && item?.startTimeSlot);
            };
            const incomplete = next.find(i => !isScheduleComplete(i));
            if (incomplete) {
              Alert.alert('Select slot(s) required', 'Please select slots for all items before checkout.');
              navigation.navigate('Cart', { updateItem: finalItem });
              return;
            }

            const sub = next.reduce((sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 1), 0);
            const t = sub * 0.18;
            const tot = sub + t;
            navigation.navigate('Checkout', {
              cartItems: next,
              subtotal: sub,
              tax: t,
              total: tot,
            });
          } catch (e) {
            navigation.navigate('Checkout', {
              cartItems: [finalItem],
              subtotal: Number(finalItem.price || 0),
              tax: Number(finalItem.price || 0) * 0.18,
              total: Number(finalItem.price || 0) * 1.18,
            });
          }
        })();
      } else {
        navigation.navigate('Cart', {
          ...(editingItemId ? { updateItem: finalItem } : { addItem: finalItem }),
        });
      }
    } else {
      // OneTime: single slot
      if (!selectedDate || !selectedTimeSlot) {
        Alert.alert('Incomplete Selection', 'Please select date and time for your service.');
        return;
      }
      if (!pendingItem) return;

      const itemWithSlot = {
        ...pendingItem,
        selectedDate: selectedDate.toISOString(),
        selectedTimeSlot,
      };

      const finalItem = editingItemId ? { ...itemWithSlot, id: editingItemId } : itemWithSlot;
      if (nextScreen === 'Checkout') {
        (async () => {
          try {
            const stored = await AsyncStorage.getItem('cartItems');
            const base = Array.isArray(cartItems) && cartItems.length > 0
              ? cartItems
              : (stored ? JSON.parse(stored) : []);
            const idx = base.findIndex(i => i?.id === finalItem.id);
            const next = idx >= 0
              ? base.map(i => (i?.id === finalItem.id ? { ...i, ...finalItem } : i))
              : [...base, finalItem];
            await AsyncStorage.setItem('cartItems', JSON.stringify(next));

            const isScheduleComplete = (item) => {
              const packageType = item?.packageType || 'OneTime';
              if (packageType === 'OneTime') {
                return Boolean(item?.selectedDate && item?.selectedTimeSlot);
              }
              const times = Number(item?.packageTimes || 0);
              if (Array.isArray(item?.scheduledSlots) && item.scheduledSlots.length === times) return true;
              return Boolean(item?.startDate && item?.startTimeSlot);
            };
            const incomplete = next.find(i => !isScheduleComplete(i));
            if (incomplete) {
              Alert.alert('Select slot(s) required', 'Please select slots for all items before checkout.');
              navigation.navigate('Cart', { updateItem: finalItem });
              return;
            }

            const sub = next.reduce((sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 1), 0);
            const t = sub * 0.18;
            const tot = sub + t;
            navigation.navigate('Checkout', {
              cartItems: next,
              subtotal: sub,
              tax: t,
              total: tot,
            });
          } catch (e) {
            navigation.navigate('Checkout', {
              cartItems: [finalItem],
              subtotal: Number(finalItem.price || 0),
              tax: Number(finalItem.price || 0) * 0.18,
              total: Number(finalItem.price || 0) * 1.18,
            });
          }
        })();
      } else {
        navigation.navigate('Cart', {
          ...(editingItemId ? { updateItem: finalItem } : { addItem: finalItem }),
        });
      }
    }
  };

  const handleUseCurrentLocation = async () => {
    setLocationLoading(true);
    setLocationError('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied');
        return;
      }

      const position = await Location.getCurrentPositionAsync({});
      const [place] = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      let address = '';
      if (place) {
        const parts = [
          place.name,
          place.street,
          place.subLocality,
          place.city,
          place.region,
          place.postalCode,
        ].filter(Boolean);
        address = parts.join(', ');
      } else {
        address = `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`;
      }

      setLocationAddress(address);
      await AsyncStorage.setItem('currentAddress', address);
      await AsyncStorage.setItem('currentLat', String(position.coords.latitude));
      await AsyncStorage.setItem('currentLng', String(position.coords.longitude));
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationError('Unable to get current location');
    } finally {
      setLocationLoading(false);
    }
  };

  const canProceed = isPackage 
    ? (generatedSlots.length === packageTimes && generatedSlots.every(s => s.scheduledDate && s.scheduledTimeSlot))
    : (selectedDate && selectedTimeSlot);

  return (
    <View style={styles.container}>
      <StatusBar style={isLightMode ? 'dark' : 'light'} />
      <BackHeader navigation={navigation} title={isPackage ? `Select Slots (${packageTimes} washes)` : "Select Slot"} />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Service at Section */}
        <View style={styles.serviceAtSection}>
          <View style={styles.locationHeader}>
            <MaterialCommunityIcons name="map-marker" size={20} color={theme.accent} />
            <Text style={styles.serviceAtTitle}>Service at</Text>
          </View>
          <Text style={styles.addressText}>
            {locationAddress || 'Location not set'}
          </Text>
          {locationError ? (
            <Text style={styles.locationError}>{locationError}</Text>
          ) : null}
          <TouchableOpacity style={styles.changeAddressButton} onPress={handleUseCurrentLocation}>
            <Text style={styles.changeAddressText}>
              {locationLoading ? 'Getting location...' : 'Use Current Location'}
            </Text>
          </TouchableOpacity>
        </View>

        {isPackage ? (
          <>
            {/* Package: First Date Selection */}
            {generatedSlots.length === 0 && (
              <>
                <View style={styles.dateSection}>
                  <Text style={styles.sectionTitle}>Select your first service date</Text>
                  <Text style={styles.sectionSubtitle}>
                    We'll automatically schedule {packageTimes} washes over the next 30 days (3 per week)
                  </Text>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.datesScrollView}
                    contentContainerStyle={styles.datesScrollContent}
                  >
                    {dates.map((date, index) => {
                      const formatted = formatDate(date);
                      const isSelected = selectedDate?.toDateString() === date.toDateString();
                      return (
                        <TouchableOpacity
                          key={index}
                          style={[styles.dateCard, isSelected && styles.dateCardSelected]}
                          onPress={() => setSelectedDate(date)}
                        >
                          <Text style={[styles.dateDay, isSelected && styles.dateDaySelected]}>
                            {formatted.day}
                          </Text>
                          <Text style={[styles.dateNumber, isSelected && styles.dateNumberSelected]}>
                            {formatted.date}
                          </Text>
                          <Text style={[styles.dateMonth, isSelected && styles.dateMonthSelected]}>
                            {formatted.month}
                          </Text>
                          {isToday(date) && (
                            <View style={styles.todayBadge}>
                              <Text style={styles.todayBadgeText}>Today</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Time Slot Selection for First Date */}
                {selectedDate && (
                  <View style={styles.timeSlotsSection}>
                    <Text style={styles.sectionTitle}>Select time for first service</Text>
                    {loadingSlots ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={theme.accent} />
                        <Text style={styles.loadingText}>Loading available slots...</Text>
                      </View>
                    ) : (
                      <>
                        {slotsError && (
                          <Text style={styles.errorText}>{slotsError}</Text>
                        )}
                        {(() => {
                          const availableSlots = getAvailableSlotsForDate(selectedDate);
                          if (availableSlots.length === 0) {
                            return (
                              <View style={styles.noSlotsContainer}>
                                <Text style={styles.noSlotsText}>
                                  No available slots for this date. Please select another date.
                                </Text>
                              </View>
                            );
                          }
                          return (
                            <View style={styles.timeSlotsGrid}>
                              {availableSlots.map((slot) => {
                                const isSelected = selectedTimeSlot?.id === slot.id;
                                return (
                                  <TouchableOpacity
                                    key={slot.id}
                                    style={[styles.timeSlotCard, isSelected && styles.timeSlotCardSelected]}
                                    onPress={() => setSelectedTimeSlot(slot)}
                                  >
                                    <Text style={[styles.timeSlotText, isSelected && styles.timeSlotTextSelected]}>
                                      {slot.time}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          );
                        })()}
                      </>
                    )}
                  </View>
                )}
              </>
            )}

            {/* Generated Slots Display */}
            {generatedSlots.length > 0 && (
              <View style={styles.generatedSlotsSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Your Scheduled Services</Text>
                  <Text style={styles.slotCount}>{generatedSlots.length} of {packageTimes} slots</Text>
                </View>
                <Text style={styles.sectionSubtitle}>
                  Tap any slot to change the date or time. You cannot schedule multiple washes on the same day.
                </Text>
                
                {generatedSlots.map((slot, index) => {
                  const formatted = formatDate(slot.scheduledDate);
                  const isEditing = editingSlotIndex === index;
                  
                  return (
                    <View key={index} style={styles.slotCard}>
                      <View style={styles.slotHeader}>
                        <View style={styles.slotNumber}>
                          <Text style={styles.slotNumberText}>{index + 1}</Text>
                        </View>
                        <View style={styles.slotInfo}>
                          <Text style={styles.slotDateText}>{formatted.full}</Text>
                          <Text style={styles.slotTimeText}>
                            {slot.scheduledTimeSlot?.time || slot.scheduledTimeSlot}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.editSlotButton}
                          onPress={() => setEditingSlotIndex(isEditing ? null : index)}
                        >
                          <MaterialCommunityIcons 
                            name={isEditing ? "close" : "pencil"} 
                            size={18} 
                            color={theme.accent} 
                          />
                        </TouchableOpacity>
                      </View>

                      {isEditing && (
                        <View style={styles.editSlotContainer}>
                          <Text style={styles.editLabel}>Change Date</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.editDatesScroll}>
                            {dates.map((date, dateIndex) => {
                              const dateFormatted = formatDate(date);
                              const isSelected = slot.scheduledDate.toDateString() === date.toDateString();
                              const isDisabled = generatedSlots.some((s, idx) => 
                                idx !== index && s.scheduledDate.toDateString() === date.toDateString()
                              );
                              
                              return (
                                <TouchableOpacity
                                  key={dateIndex}
                                  style={[
                                    styles.editDateCard,
                                    isSelected && styles.editDateCardSelected,
                                    isDisabled && styles.editDateCardDisabled,
                                  ]}
                                  onPress={() => {
                                    if (!isDisabled) {
                                      updateSlot(index, date, slot.scheduledTimeSlot);
                                    }
                                  }}
                                  disabled={isDisabled}
                                >
                                  <Text style={[styles.editDateText, isSelected && styles.editDateTextSelected]}>
                                    {dateFormatted.day} {dateFormatted.date}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </ScrollView>

                          <Text style={styles.editLabel}>Change Time</Text>
                          <View style={styles.editTimeSlotsGrid}>
                            {(() => {
                              const availableSlots = getAvailableSlotsForDate(slot.scheduledDate);
                              if (availableSlots.length === 0) {
                                return (
                                  <Text style={styles.noSlotsText}>
                                    No available slots for this date
                                  </Text>
                                );
                              }
                              return availableSlots.map((timeSlot) => {
                                const isSelected = (slot.scheduledTimeSlot?.id || slot.scheduledTimeSlot) === timeSlot.id;
                                return (
                                  <TouchableOpacity
                                    key={timeSlot.id}
                                    style={[styles.editTimeSlotCard, isSelected && styles.editTimeSlotCardSelected]}
                                    onPress={() => updateSlot(index, slot.scheduledDate, timeSlot)}
                                  >
                                    <Text style={[styles.editTimeSlotText, isSelected && styles.editTimeSlotTextSelected]}>
                                      {timeSlot.time}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              });
                            })()}
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </>
        ) : (
          <>
            {/* OneTime: Regular Date Selection */}
            <View style={styles.dateSection}>
              <Text style={styles.sectionTitle}>Select date for your service</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.datesScrollView}
                contentContainerStyle={styles.datesScrollContent}
              >
                {dates.map((date, index) => {
                  const formatted = formatDate(date);
                  const isSelected = selectedDate?.toDateString() === date.toDateString();
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[styles.dateCard, isSelected && styles.dateCardSelected]}
                      onPress={() => setSelectedDate(date)}
                    >
                      <Text style={[styles.dateDay, isSelected && styles.dateDaySelected]}>
                        {formatted.day}
                      </Text>
                      <Text style={[styles.dateNumber, isSelected && styles.dateNumberSelected]}>
                        {formatted.date}
                      </Text>
                      <Text style={[styles.dateMonth, isSelected && styles.dateMonthSelected]}>
                        {formatted.month}
                      </Text>
                      {isToday(date) && (
                        <View style={styles.todayBadge}>
                          <Text style={styles.todayBadgeText}>Today</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* OneTime: Time Slots Section */}
            <View style={styles.timeSlotsSection}>
              <Text style={styles.sectionTitle}>Select time</Text>
              <View style={styles.timeSlotsGrid}>
                {timeSlots.map((slot) => {
                  const isSelected = selectedTimeSlot?.id === slot.id;
                  return (
                    <TouchableOpacity
                      key={slot.id}
                      style={[styles.timeSlotCard, isSelected && styles.timeSlotCardSelected]}
                      onPress={() => setSelectedTimeSlot(slot)}
                    >
                      <Text style={[styles.timeSlotText, isSelected && styles.timeSlotTextSelected]}>
                        {slot.time}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </>
        )}

        {/* Total Amount Section */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>₹{total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Add to Cart Button */}
      <View style={styles.checkoutButtonContainer}>
        <TouchableOpacity 
          style={[
            styles.checkoutButton,
            !canProceed && styles.checkoutButtonDisabled
          ]}
          onPress={handleCheckout}
          disabled={!canProceed}
        >
          <Text style={[
            styles.checkoutButtonText,
            !canProceed && styles.checkoutButtonTextDisabled
          ]}>
            {nextScreen === 'Checkout' ? 'Checkout' : 'Add to Cart'}
          </Text>
          <MaterialCommunityIcons 
            name="arrow-right" 
            size={20} 
            color={!canProceed ? theme.textSecondary : '#000000'} 
          />
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
    paddingBottom: 100,
  },
  serviceAtSection: {
    backgroundColor: theme.cardBackground,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceAtTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
    marginLeft: 8,
  },
  addressText: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  locationError: {
    fontSize: 12,
    color: theme.danger || '#FF5252',
    marginBottom: 8,
  },
  changeAddressButton: {
    alignSelf: 'flex-start',
  },
  changeAddressText: {
    fontSize: 14,
    color: theme.accent,
    fontWeight: '600',
  },
  dateSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.textPrimary,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  slotCount: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.accent,
  },
  datesScrollView: {
    marginHorizontal: -16,
  },
  datesScrollContent: {
    paddingHorizontal: 16,
  },
  dateCard: {
    width: 70,
    height: 90,
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.cardBorder,
    paddingTop: 8,
  },
  dateCardSelected: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  dateDay: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  dateDaySelected: {
    color: '#FFFFFF',
  },
  dateNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.textPrimary,
    marginBottom: 2,
  },
  dateNumberSelected: {
    color: '#FFFFFF',
  },
  dateMonth: {
    fontSize: 11,
    color: theme.textSecondary,
  },
  dateMonthSelected: {
    color: '#FFFFFF',
  },
  todayBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: theme.accent,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  todayBadgeText: {
    fontSize: 8,
    color: '#000000',
    fontWeight: '600',
  },
  timeSlotsSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  timeSlotCard: {
    width: (width - 64) / 2,
    marginHorizontal: 8,
    marginBottom: 12,
    paddingVertical: 14,
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeSlotCardSelected: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  timeSlotTextSelected: {
    color: '#FFFFFF',
  },
  generatedSlotsSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  slotCard: {
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    padding: 16,
    marginBottom: 12,
  },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slotNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  slotNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
  },
  slotInfo: {
    flex: 1,
  },
  slotDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 4,
  },
  slotTimeText: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  editSlotButton: {
    padding: 8,
  },
  editSlotContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.cardBorder,
  },
  editLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 12,
    marginTop: 8,
  },
  editDatesScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  editDateCard: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    marginRight: 8,
    backgroundColor: theme.cardBackground,
  },
  editDateCardSelected: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  editDateCardDisabled: {
    opacity: 0.4,
  },
  editDateText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  editDateTextSelected: {
    color: '#FFFFFF',
  },
  editTimeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  editTimeSlotCard: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    marginHorizontal: 4,
    marginBottom: 8,
    backgroundColor: theme.cardBackground,
  },
  editTimeSlotCardSelected: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  editTimeSlotText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  editTimeSlotTextSelected: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: theme.textSecondary,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  noSlotsContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    marginTop: 12,
  },
  noSlotsText: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  selectDateHint: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    padding: 20,
    fontStyle: 'italic',
  },
  totalSection: {
    backgroundColor: theme.cardBackground,
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.accent,
  },
  checkoutButtonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: theme.background,
    borderTopWidth: 1,
    borderTopColor: theme.cardBorder,
    paddingTop: 12,
  },
  checkoutButton: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkoutButtonDisabled: {
    backgroundColor: theme.cardBackground,
  },
  checkoutButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginRight: 8,
  },
  checkoutButtonTextDisabled: {
    color: theme.textSecondary,
  },
});
