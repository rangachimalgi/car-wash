import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import BackHeader from '../components/BackHeader';
import { useTheme } from '../theme/ThemeContext';
import { getPackagePricing } from '../services/packagePricingApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { getMyMembership } from '../services/membershipApi';
import { applyWooshMembershipDiscount } from '../utils/membershipPricing';

const DAILY_CLEANING_OPTIONS = ['Daily (Sun - Sat)', 'Alternate days (~15 days / month)'];
const TIME_SLOTS = ['7:00 AM - 8:00 AM', '8:00 AM - 9:00 AM', '10:00 AM - 11:00 AM'];

function SelectChips({ options, selected, onSelect, multi = false }) {
  return (
    <View style={stylesGlobal.chipsWrap}>
      {options.map((option) => {
        const active = multi ? selected.includes(option) : selected === option;
        return (
          <TouchableOpacity
            key={option}
            style={[
              stylesGlobal.chip,
              active && stylesGlobal.chipActive,
            ]}
            onPress={() => onSelect(option)}
            activeOpacity={0.85}
          >
            <Text style={[stylesGlobal.chipText, active && stylesGlobal.chipTextActive]}>{option}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function DatePillRow({
  title,
  selectedDates,
  monthDates,
  onToggle,
  onReset,
  styles,
  dateKey,
  formatDatePill,
}) {
  return (
    <View style={styles.dateRowBlock}>
      <View style={styles.dateRowHeader}>
        <View style={styles.dateRowHeaderLeft}>
          <MaterialCommunityIcons name="calendar-month-outline" size={18} color="#6B7280" />
          <Text style={styles.dateRowTitle}>{title} ({selectedDates.length}/2)</Text>
        </View>
        <TouchableOpacity onPress={onReset} activeOpacity={0.8}>
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.datePillsScrollContent}
        nestedScrollEnabled
      >
        {monthDates.map((date) => {
          const key = dateKey(date);
          const isActive = selectedDates.includes(key);
          const { dateText, dayText } = formatDatePill(date);
          return (
            <TouchableOpacity
              key={key}
              style={[styles.datePill, isActive && styles.datePillActive]}
              onPress={() => onToggle(key)}
              activeOpacity={0.85}
            >
              <Text style={[styles.datePillDate, isActive && styles.datePillDateActive]}>{dateText}</Text>
              <Text style={[styles.datePillDay, isActive && styles.datePillDayActive]}>{dayText}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const stylesGlobal = StyleSheet.create({
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderColor: '#D4D4D8',
    backgroundColor: '#FFFFFF',
  },
  chipActive: {
    backgroundColor: '#E6F3FF',
    borderColor: '#007AFF',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#444444',
  },
  chipTextActive: {
    color: '#007AFF',
    fontWeight: '700',
  },
});

export default function PackageDetailsScreen({ navigation, route }) {
  const { theme, isLightMode } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [packageStartDate, setPackageStartDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [packageTimeSlot, setPackageTimeSlot] = useState('');
  const [dailyMode, setDailyMode] = useState('Daily (Sun - Sat)');
  const [interiorDates, setInteriorDates] = useState([]);
  const [exteriorDates, setExteriorDates] = useState([]);
  const [pricingConfig, setPricingConfig] = useState(null);
  const [pricingMessage, setPricingMessage] = useState('');
  const [loadingPricing, setLoadingPricing] = useState(true);
  const [membershipWashDiscountPercent, setMembershipWashDiscountPercent] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const token = await AsyncStorage.getItem('authToken');
          if (!token) {
            if (!cancelled) setMembershipWashDiscountPercent(0);
            return;
          }
          const res = await getMyMembership();
          if (cancelled) return;
          const pct =
            res?.success && res.data?.active
              ? Number(res.data.membership?.discountPercent || 0)
              : 0;
          setMembershipWashDiscountPercent(Math.min(100, Math.max(0, pct)));
        } catch {
          if (!cancelled) setMembershipWashDiscountPercent(0);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  useEffect(() => {
    let cancelled = false;
    const loadPricing = async () => {
      try {
        setLoadingPricing(true);
        setPricingMessage('');
        const response = await getPackagePricing({ app: 'customer', vehicleType: 'car' });
        if (cancelled) return;
        if (response?.success && response?.data) {
          setPricingConfig(response.data);
        } else {
          setPricingMessage('Failed to load package pricing.');
        }
      } catch (error) {
        if (!cancelled) {
          setPricingMessage('Could not load package pricing. Please try again.');
        }
      } finally {
        if (!cancelled) {
          setLoadingPricing(false);
        }
      }
    };
    loadPricing();
    return () => {
      cancelled = true;
    };
  }, []);

  const packageDurationDays = Number(pricingConfig?.durationDays || 30);
  const availableTimeSlots = Array.isArray(pricingConfig?.timeSlots) && pricingConfig.timeSlots.length > 0
    ? pricingConfig.timeSlots
    : TIME_SLOTS;

  const monthDates = useMemo(() => {
    const start = new Date(packageStartDate);
    return Array.from({ length: packageDurationDays }, (_, index) => {
      const d = new Date(start);
      d.setDate(start.getDate() + index);
      return d;
    });
  }, [packageStartDate, packageDurationDays]);

  const formatHeaderDate = (date) =>
    date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const formatDatePill = (date) => {
    const dateText = date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });
    const dayText = date.toLocaleDateString('en-GB', { weekday: 'short' });
    return { dateText, dayText };
  };

  const dateKey = (date) => date.toISOString().split('T')[0];

  const toggleDateSelection = (currentDates, setDates, isoDate) => {
    if (currentDates.includes(isoDate)) {
      setDates(currentDates.filter((item) => item !== isoDate));
      return;
    }
    if (currentDates.length >= 2) return;
    setDates([...currentDates, isoDate]);
  };

  const onStartDateChange = (_event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowStartDatePicker(false);
    }
    if (!selectedDate) return;
    setPackageStartDate(selectedDate);
    setInteriorDates([]);
    setExteriorDates([]);
  };

  const selectedInteriorCount = interiorDates.length >= 2 ? 2 : 1;
  const selectedExteriorCount = exteriorDates.length >= 2 ? 2 : 1;
  const selectedDailyModeKey = dailyMode.startsWith('Daily') ? 'daily' : 'alternate';
  const pricingKey = `i${selectedInteriorCount}_e${selectedExteriorCount}_${selectedDailyModeKey}`;
  const resolvedPrice = Number(pricingConfig?.pricingMatrix?.[pricingKey] || 0);
  const resolvedPriceMember = applyWooshMembershipDiscount(
    Math.round(resolvedPrice),
    membershipWashDiscountPercent
  );

  const canContinue =
    interiorDates.length >= 1 &&
    exteriorDates.length >= 1 &&
    Boolean(packageTimeSlot) &&
    resolvedPrice > 0 &&
    !loadingPricing &&
    !pricingMessage;

  const serviceId = route?.params?.serviceId || null;
  const serviceName = route?.params?.serviceName || 'Monthly Package';
  const selectedAddOns = Array.isArray(route?.params?.selectedAddOns) ? route.params.selectedAddOns : [];

  return (
    <View style={styles.container}>
      <StatusBar style={isLightMode ? 'dark' : 'light'} />
      <BackHeader navigation={navigation} title="Monthly Package" subtitle="Set your cleaning plan" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Plan Details</Text>
          <Text style={styles.infoText}>Choose package start date first. Package runs for {packageDurationDays} days from this date.</Text>
          <Text style={styles.infoText}>Select one common slot for the package.</Text>
          <Text style={styles.infoText}>Pick 1 or 2 dates for interior and exterior cleaning from those {packageDurationDays} days.</Text>
          <Text style={styles.infoText}>Daily cleaning: Sun - Sat, or alternate days (~15 days / month).</Text>
          {loadingPricing ? <Text style={styles.infoNotice}>Loading latest pricing...</Text> : null}
          {!loadingPricing && pricingMessage ? <Text style={styles.infoError}>{pricingMessage}</Text> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Package Start</Text>
          <TouchableOpacity
            style={styles.dateSelectorCard}
            activeOpacity={0.85}
            onPress={() => setShowStartDatePicker(true)}
          >
            <View style={styles.dateSelectorLeft}>
              <View style={styles.dateIconWrap}>
                <MaterialCommunityIcons name="calendar-month-outline" size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.dateSelectorLabel}>Subscription Start Date</Text>
                <Text style={styles.dateSelectorValue}>{formatHeaderDate(packageStartDate)}</Text>
              </View>
            </View>
            <View style={styles.dateChevronWrap}>
              <MaterialCommunityIcons name="chevron-right" size={20} color={theme.accent} />
            </View>
          </TouchableOpacity>

          <Text style={styles.label}>Time slot</Text>
          <SelectChips options={availableTimeSlots} selected={packageTimeSlot} onSelect={setPackageTimeSlot} />
          {showStartDatePicker && (
            <DateTimePicker
              value={packageStartDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={new Date()}
              onChange={onStartDateChange}
            />
          )}
          {Platform.OS === 'ios' && showStartDatePicker ? (
            <TouchableOpacity
              style={styles.iosDoneButton}
              onPress={() => setShowStartDatePicker(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.iosDoneButtonText}>Done</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interior Cleaning</Text>
          <Text style={styles.helperText}>Select 1 or 2 dates from the package {packageDurationDays}-day period.</Text>
          <DatePillRow
            title="Interior Cleaning Dates"
            selectedDates={interiorDates}
            monthDates={monthDates}
            onToggle={(key) => toggleDateSelection(interiorDates, setInteriorDates, key)}
            onReset={() => setInteriorDates([])}
            styles={styles}
            dateKey={dateKey}
            formatDatePill={formatDatePill}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exterior Cleaning</Text>
          <Text style={styles.helperText}>Select 1 or 2 dates from the package {packageDurationDays}-day period.</Text>
          <DatePillRow
            title="Exterior Cleaning Dates"
            selectedDates={exteriorDates}
            monthDates={monthDates}
            onToggle={(key) => toggleDateSelection(exteriorDates, setExteriorDates, key)}
            onReset={() => setExteriorDates([])}
            styles={styles}
            dateKey={dateKey}
            formatDatePill={formatDatePill}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Cleaning Mode</Text>
          <SelectChips options={DAILY_CLEANING_OPTIONS} selected={dailyMode} onSelect={setDailyMode} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.priceWrap}>
          <Text style={styles.priceLabel}>Package Price</Text>
          {resolvedPrice > 0 ? (
            membershipWashDiscountPercent > 0 ? (
              <View>
                <Text style={styles.priceValueStrike}>₹{Math.round(resolvedPrice)}</Text>
                <Text style={styles.priceValue}>₹{resolvedPriceMember}</Text>
                <Text style={styles.memberHint}>
                  Woosh Black discount {membershipWashDiscountPercent}%
                </Text>
              </View>
            ) : (
              <Text style={styles.priceValue}>₹{Math.round(resolvedPrice)}</Text>
            )
          ) : (
            <Text style={styles.priceValue}>—</Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
          activeOpacity={0.85}
          disabled={!canContinue}
          onPress={() => {
            const packageItem = {
              id: `custom_pkg_${Date.now()}`,
              serviceId,
              serviceName,
              title: `${serviceName} - Custom Monthly Package`,
              image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&auto=format',
              basePrice: resolvedPriceMember,
              price: resolvedPriceMember,
              quantity: 1,
              addOns: selectedAddOns,
              packageType: 'Monthly',
              packageTimes: Math.max(interiorDates.length, exteriorDates.length, 1),
              startDate: packageStartDate.toISOString(),
              startTimeSlot: packageTimeSlot,
              selectedDate: packageStartDate.toISOString(),
              selectedTimeSlot: { time: packageTimeSlot },
              customPackage: {
                packageStartDate: packageStartDate.toISOString(),
                packageDurationDays,
                packageTimeSlot,
                interiorDates,
                exteriorDates,
                dailyMode,
                pricingKey,
                packagePrice: resolvedPriceMember,
                pricingVersion: pricingConfig?.updatedAt || null,
              },
            };

            const subtotal = Number(resolvedPriceMember || 0);
            const tax = subtotal * 0.18;
            const total = subtotal + tax;

            navigation.navigate('Checkout', {
              cartItems: [packageItem],
              selectedDate: packageStartDate.toISOString(),
              selectedTimeSlot: { time: packageTimeSlot },
              subtotal,
              tax,
              total,
            });
          }}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
    gap: 16,
  },
  infoCard: {
    backgroundColor: theme.cardBackground,
    borderColor: theme.cardBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 6,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.textPrimary,
    marginBottom: 2,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 19,
    color: theme.textSecondary,
  },
  infoNotice: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '700',
    marginTop: 4,
  },
  infoError: {
    fontSize: 12,
    color: theme.danger || '#DC2626',
    fontWeight: '700',
    marginTop: 4,
  },
  section: {
    backgroundColor: theme.cardBackground,
    borderColor: theme.cardBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.textPrimary,
  },
  helperText: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  dateRowBlock: {
    marginTop: 4,
  },
  dateRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dateRowHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateRowTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  resetText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2F8EDC',
    textDecorationLine: 'underline',
  },
  datePillsScrollContent: {
    gap: 10,
    paddingRight: 8,
  },
  datePill: {
    minWidth: 72,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePillActive: {
    backgroundColor: '#2F8EDC',
    borderColor: '#2F8EDC',
  },
  datePillDate: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6B7280',
    lineHeight: 26,
  },
  datePillDateActive: {
    color: '#FFFFFF',
  },
  datePillDay: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  },
  datePillDayActive: {
    color: '#DBEAFE',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.textSecondary,
    marginTop: 4,
  },
  dateSelectorCard: {
    borderWidth: 1,
    borderColor: '#C6E4FF',
    backgroundColor: '#F2F8FF',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  dateIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#4EA9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateSelectorLabel: {
    fontSize: 13,
    color: theme.textSecondary,
    fontWeight: '600',
    marginBottom: 2,
  },
  dateSelectorValue: {
    fontSize: 31,
    fontWeight: '900',
    color: theme.textPrimary,
    letterSpacing: -0.4,
  },
  dateChevronWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  iosDoneButton: {
    alignSelf: 'flex-end',
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    backgroundColor: theme.cardBackground,
  },
  iosDoneButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.cardBorder,
    backgroundColor: theme.background,
  },
  priceWrap: {
    marginBottom: 10,
  },
  priceLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '700',
  },
  priceValue: {
    marginTop: 2,
    fontSize: 24,
    color: theme.textPrimary,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  priceValueStrike: {
    marginTop: 2,
    fontSize: 16,
    color: theme.textSecondary,
    fontWeight: '600',
    textDecorationLine: 'line-through',
  },
  memberHint: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
    color: theme.accent,
  },
  continueButton: {
    height: 50,
    borderRadius: 999,
    backgroundColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.4,
  },
  continueButtonText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 15,
  },
});
