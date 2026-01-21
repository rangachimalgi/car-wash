import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BackHeader from '../components/BackHeader';
import { useTheme } from '../theme/ThemeContext';

const { width } = Dimensions.get('window');

export default function SlotSelectionScreen({ navigation, route }) {
  const pendingItem = route?.params?.pendingItem || null;
  const cartItems = route?.params?.cartItems || (pendingItem ? [pendingItem] : []);
  const subtotal = route?.params?.subtotal || (pendingItem?.price || 0);
  const tax = route?.params?.tax || 0;
  const total = route?.params?.total || (pendingItem?.price || 0);

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const { theme, isLightMode } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Generate dates for the next 7 days
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const dates = generateDates();

  // Generate time slots
  const timeSlots = [
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
  ];

  const formatDate = (date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
      day: days[date.getDay()],
      date: date.getDate(),
      month: months[date.getMonth()],
    };
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handleCheckout = () => {
    if (!selectedDate || !selectedTimeSlot) {
      // Show alert or toast
      return;
    }
    if (!pendingItem) return;

    const itemWithSlot = {
      ...pendingItem,
      selectedDate: selectedDate.toISOString(),
      selectedTimeSlot,
    };

    navigation.navigate('Cart', {
      addItem: itemWithSlot,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style={isLightMode ? 'dark' : 'light'} />
      <BackHeader navigation={navigation} title="Select Slot" />
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
            123 Main Street, Apartment 4B{'\n'}
            Downtown, City 12345
          </Text>
          <TouchableOpacity style={styles.changeAddressButton}>
            <Text style={styles.changeAddressText}>Change Address</Text>
          </TouchableOpacity>
        </View>

        {/* Select Date Section */}
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

        {/* Time Slots Section */}
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
            (!selectedDate || !selectedTimeSlot) && styles.checkoutButtonDisabled
          ]}
          onPress={handleCheckout}
          disabled={!selectedDate || !selectedTimeSlot}
        >
          <Text style={[
            styles.checkoutButtonText,
            (!selectedDate || !selectedTimeSlot) && styles.checkoutButtonTextDisabled
          ]}>
            Add to Cart
          </Text>
              <MaterialCommunityIcons 
                name="arrow-right" 
                size={20} 
                color={(!selectedDate || !selectedTimeSlot) ? theme.textSecondary : '#000000'} 
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
    marginBottom: 16,
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
    backgroundColor: theme.accent,
    borderColor: theme.accent,
  },
  dateDay: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  dateDaySelected: {
    color: '#000000',
  },
  dateNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.textPrimary,
    marginBottom: 2,
  },
  dateNumberSelected: {
    color: '#000000',
  },
  dateMonth: {
    fontSize: 11,
    color: theme.textSecondary,
  },
  dateMonthSelected: {
    color: '#000000',
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
    backgroundColor: theme.accent,
    borderColor: theme.accent,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  timeSlotTextSelected: {
    color: '#000000',
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
    backgroundColor: theme.accent,
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
    color: '#000000',
    marginRight: 8,
  },
  checkoutButtonTextDisabled: {
    color: theme.textSecondary,
  },
});
