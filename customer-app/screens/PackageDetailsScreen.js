import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import MinimalBackHeader from '../components/MinimalBackHeader';
import { useTheme } from '../theme/ThemeContext';
import { wooshGreen } from '../theme/wooshGreen';
import { getPackagePricing } from '../services/packagePricingApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { getMyMembership } from '../services/membershipApi';
import { applyWooshMembershipDiscount } from '../utils/membershipPricing';

const TOTAL_STEPS = 4;
const TIME_SLOTS = ['7:00 AM - 8:00 AM', '8:00 AM - 9:00 AM', '10:00 AM - 11:00 AM'];

const DAILY_MODES = [
  {
    id: 'daily',
    legacy: 'Daily (Sun - Sat)',
    title: 'Every day',
    subtitle: 'Sun – Sat',
    visits: '~30 visits',
    icon: 'calendar-check',
  },
  {
    id: 'alternate',
    legacy: 'Alternate days (~15 days / month)',
    title: 'Every other day',
    subtitle: '~15 days / month',
    visits: '~15 visits',
    icon: 'calendar-range',
  },
];

const PILL_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const PILL_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const HOW_IT_WORKS = [
  'Your plan runs for the full package period from your start date.',
  'Pick one time slot — we use it for every visit in the plan.',
  'Choose 1–2 days each for interior and exterior deep cleans.',
  'Daily cleaning is every day or every other day for the whole period.',
];

function SelectChips({ options, selected, onSelect, chipStyles }) {
  return (
    <View style={chipStyles.chipsWrap}>
      {options.map((option) => {
        const active = selected === option;
        return (
          <TouchableOpacity
            key={option}
            style={[chipStyles.chip, active && chipStyles.chipActive]}
            onPress={() => onSelect(option)}
            activeOpacity={0.85}
          >
            <Text style={[chipStyles.chipText, active && chipStyles.chipTextActive]}>{option}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function DatePillPreviewRow({ monthDates, includedKeys, styles, dateKey, formatDatePill }) {
  const included = useMemo(() => new Set(includedKeys), [includedKeys]);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.datePillsScrollContent}
      nestedScrollEnabled
    >
      {monthDates.map((date) => {
        const key = dateKey(date);
        const isIncluded = included.has(key);
        const { monthLabel, dayNumber, weekdayShort } = formatDatePill(date);
        return (
          <View
            key={key}
            style={[styles.datePill, isIncluded ? styles.datePillActive : styles.datePillPreviewMuted]}
            accessibilityLabel={`${weekdayShort} ${dayNumber} ${monthLabel}${isIncluded ? ', included' : ''}`}
          >
            <Text style={[styles.datePillMonth, isIncluded && styles.datePillMonthActive]}>{monthLabel}</Text>
            <Text style={[styles.datePillDate, isIncluded && styles.datePillDateActive]}>{dayNumber}</Text>
            <Text style={[styles.datePillDay, isIncluded && styles.datePillDayActive]}>{weekdayShort}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

function DeepCleanDateRow({
  activeTab,
  onTabChange,
  interiorDates,
  exteriorDates,
  monthDates,
  onToggleInterior,
  onToggleExterior,
  onReset,
  styles,
  dateKey,
  formatDatePill,
}) {
  const selectedDates = activeTab === 'interior' ? interiorDates : exteriorDates;
  const onToggle = activeTab === 'interior' ? onToggleInterior : onToggleExterior;
  const interiorSet = useMemo(() => new Set(interiorDates), [interiorDates]);
  const exteriorSet = useMemo(() => new Set(exteriorDates), [exteriorDates]);

  return (
    <View style={styles.deepCleanBlock}>
      <View style={styles.deepCleanTabs}>
        <TouchableOpacity
          style={[styles.deepCleanTab, activeTab === 'interior' && styles.deepCleanTabActive]}
          onPress={() => onTabChange('interior')}
          activeOpacity={0.85}
        >
          <Text style={[styles.deepCleanTabText, activeTab === 'interior' && styles.deepCleanTabTextActive]}>
            Interior ({interiorDates.length}/2)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.deepCleanTab, activeTab === 'exterior' && styles.deepCleanTabActiveExterior]}
          onPress={() => onTabChange('exterior')}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.deepCleanTabText,
              activeTab === 'exterior' && styles.deepCleanTabTextActiveExterior,
            ]}
          >
            Exterior ({exteriorDates.length}/2)
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dateRowHeader}>
        <Text style={styles.stepHint}>
          Tap days for {activeTab === 'interior' ? 'interior' : 'exterior'} deep clean (1–2 max)
        </Text>
        <TouchableOpacity onPress={onReset} activeOpacity={0.8}>
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendDotInterior]} />
          <Text style={styles.legendText}>Interior</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendDotExterior]} />
          <Text style={styles.legendText}>Exterior</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.datePillsScrollContent}
        nestedScrollEnabled
      >
        {monthDates.map((date) => {
          const key = dateKey(date);
          const isInterior = interiorSet.has(key);
          const isExterior = exteriorSet.has(key);
          const isActiveTab = selectedDates.includes(key);
          const { monthLabel, dayNumber, weekdayShort } = formatDatePill(date);

          let pillStyle = styles.datePill;
          let monthStyle = styles.datePillMonth;
          let dateStyle = styles.datePillDate;
          let dayStyle = styles.datePillDay;

          if (isActiveTab) {
            if (activeTab === 'interior') {
              pillStyle = [styles.datePill, styles.datePillInterior];
              monthStyle = [styles.datePillMonth, styles.datePillMonthActive];
              dateStyle = [styles.datePillDate, styles.datePillDateActive];
              dayStyle = [styles.datePillDay, styles.datePillDayActive];
            } else {
              pillStyle = [styles.datePill, styles.datePillExterior];
              monthStyle = [styles.datePillMonth, styles.datePillMonthExterior];
              dateStyle = [styles.datePillDate, styles.datePillDateExterior];
              dayStyle = [styles.datePillDay, styles.datePillDayExterior];
            }
          } else if (isInterior || isExterior) {
            pillStyle = [styles.datePill, styles.datePillOtherSelected];
          }

          return (
            <TouchableOpacity
              key={key}
              style={pillStyle}
              onPress={() => onToggle(key)}
              activeOpacity={0.85}
            >
              {(isInterior || isExterior) && !isActiveTab ? (
                <View style={styles.dualMarkerRow}>
                  {isInterior ? <View style={styles.legendDotInterior} /> : null}
                  {isExterior ? <View style={[styles.legendDot, styles.legendDotExterior]} /> : null}
                </View>
              ) : null}
              <Text style={monthStyle}>{monthLabel}</Text>
              <Text style={dateStyle}>{dayNumber}</Text>
              <Text style={dayStyle}>{weekdayShort}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const createChipStyles = (theme, isLightMode) =>
  StyleSheet.create({
    chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderColor: theme.cardBorder,
      backgroundColor: theme.cardBackground,
    },
    chipActive: {
      backgroundColor: isLightMode ? '#E6F3FF' : theme.accentSoft,
      borderColor: theme.accent,
    },
    chipText: { fontSize: 12, fontWeight: '600', color: theme.textSecondary },
    chipTextActive: { color: theme.accent, fontWeight: '700' },
  });

export default function PackageDetailsScreen({ navigation, route }) {
  const { theme, isLightMode } = useTheme();
  const styles = useMemo(() => createStyles(theme, isLightMode), [theme, isLightMode]);
  const chipStyles = useMemo(() => createChipStyles(theme, isLightMode), [theme, isLightMode]);

  const [step, setStep] = useState(1);
  const [deepCleanTab, setDeepCleanTab] = useState('interior');
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [packageStartDate, setPackageStartDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [packageTimeSlot, setPackageTimeSlot] = useState('');
  const [dailyModeId, setDailyModeId] = useState('daily');
  const [interiorDates, setInteriorDates] = useState([]);
  const [exteriorDates, setExteriorDates] = useState([]);
  const [pricingConfig, setPricingConfig] = useState(null);
  const [pricingMessage, setPricingMessage] = useState('');
  const [loadingPricing, setLoadingPricing] = useState(true);
  const [membershipWashDiscountPercent, setMembershipWashDiscountPercent] = useState(0);

  const dailyMode = DAILY_MODES.find((m) => m.id === dailyModeId) || DAILY_MODES[0];

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
      } catch {
        if (!cancelled) {
          setPricingMessage('Could not load package pricing. Please try again.');
        }
      } finally {
        if (!cancelled) setLoadingPricing(false);
      }
    };
    loadPricing();
    return () => {
      cancelled = true;
    };
  }, []);

  const packageDurationDays = Number(pricingConfig?.durationDays || 30);
  const availableTimeSlots =
    Array.isArray(pricingConfig?.timeSlots) && pricingConfig.timeSlots.length > 0
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

  const dailyCleaningIncludedKeys = useMemo(() => {
    const everyDay = dailyModeId === 'daily';
    return monthDates
      .filter((_, idx) => everyDay || idx % 2 === 0)
      .map((d) => d.toISOString().split('T')[0]);
  }, [monthDates, dailyModeId]);

  const formatHeaderDate = (date) =>
    date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const formatShortDate = (isoKey) => {
    const d = new Date(isoKey);
    return `${d.getDate()} ${PILL_MONTHS[d.getMonth()]}`;
  };

  const formatDatePill = (date) => {
    const d = new Date(date);
    return {
      monthLabel: PILL_MONTHS[d.getMonth()],
      dayNumber: String(d.getDate()),
      weekdayShort: PILL_WEEKDAYS[d.getDay()],
    };
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
    if (Platform.OS === 'android') setShowStartDatePicker(false);
    if (!selectedDate) return;
    setPackageStartDate(selectedDate);
    setInteriorDates([]);
    setExteriorDates([]);
  };

  const selectedInteriorCount = interiorDates.length >= 2 ? 2 : 1;
  const selectedExteriorCount = exteriorDates.length >= 2 ? 2 : 1;
  const selectedDailyModeKey = dailyModeId === 'daily' ? 'daily' : 'alternate';
  const pricingKey = `i${selectedInteriorCount}_e${selectedExteriorCount}_${selectedDailyModeKey}`;
  const resolvedPrice = Number(pricingConfig?.pricingMatrix?.[pricingKey] || 0);
  const resolvedPriceMember = applyWooshMembershipDiscount(
    Math.round(resolvedPrice),
    membershipWashDiscountPercent
  );

  const canProceedStep1 = Boolean(packageTimeSlot);
  const canProceedStep2 = true;
  const canProceedStep3 = interiorDates.length >= 1 && exteriorDates.length >= 1;
  const canCheckout =
    canProceedStep1 &&
    canProceedStep3 &&
    resolvedPrice > 0 &&
    !loadingPricing &&
    !pricingMessage;

  const canGoNext =
    (step === 1 && canProceedStep1) ||
    (step === 2 && canProceedStep2) ||
    (step === 3 && canProceedStep3);

  const goNext = () => {
    if (step < TOTAL_STEPS && canGoNext) setStep(step + 1);
  };

  const goBack = () => {
    if (step > 1) setStep(step - 1);
    else navigation.goBack();
  };

  const serviceId = route?.params?.serviceId || null;
  const serviceName = route?.params?.serviceName || 'Monthly Package';
  const selectedAddOns = Array.isArray(route?.params?.selectedAddOns) ? route.params.selectedAddOns : [];

  const navigateToCheckout = () => {
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
        dailyMode: dailyMode.legacy,
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
  };

  const renderPrice = () => {
    if (loadingPricing) return <Text style={styles.summaryMuted}>Loading price…</Text>;
    if (pricingMessage) return <Text style={styles.summaryError}>{pricingMessage}</Text>;
    if (resolvedPrice <= 0) return <Text style={styles.summaryMuted}>Complete your plan to see price</Text>;
    if (membershipWashDiscountPercent > 0) {
      return (
        <View>
          <Text style={styles.summaryPriceStrike}>₹{Math.round(resolvedPrice)}</Text>
          <Text style={styles.summaryPrice}>₹{resolvedPriceMember}</Text>
          <Text style={styles.memberHint}>Woosh Green {membershipWashDiscountPercent}% off</Text>
        </View>
      );
    }
    return <Text style={styles.summaryPrice}>₹{Math.round(resolvedPrice)}</Text>;
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>When does your plan start?</Text>
            <Text style={styles.stepSubtitle}>One start date and time slot for your whole {packageDurationDays}-day plan.</Text>
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
                  <Text style={styles.dateSelectorLabel}>Start date</Text>
                  <Text style={styles.dateSelectorValue}>{formatHeaderDate(packageStartDate)}</Text>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={theme.accent} />
            </TouchableOpacity>
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
            <Text style={styles.label}>Preferred time slot</Text>
            <SelectChips
              options={availableTimeSlots}
              selected={packageTimeSlot}
              onSelect={setPackageTimeSlot}
              chipStyles={chipStyles}
            />
            {!packageTimeSlot ? (
              <Text style={styles.inlineHint}>Pick a time slot to continue</Text>
            ) : null}
          </View>
        );

      case 2:
        return (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>How often should we come?</Text>
            <Text style={styles.stepSubtitle}>Daily wipe-down visits during your {packageDurationDays}-day plan.</Text>
            <View style={styles.modeCards}>
              {DAILY_MODES.map((mode) => {
                const active = dailyModeId === mode.id;
                return (
                  <TouchableOpacity
                    key={mode.id}
                    style={[styles.modeCard, active && styles.modeCardActive]}
                    onPress={() => setDailyModeId(mode.id)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.modeIconWrap, active && styles.modeIconWrapActive]}>
                      <MaterialCommunityIcons
                        name={mode.icon}
                        size={22}
                        color={active ? theme.onAccent : theme.accent}
                      />
                    </View>
                    <View style={styles.modeCardText}>
                      <Text style={[styles.modeCardTitle, active && styles.modeCardTitleActive]}>{mode.title}</Text>
                      <Text style={[styles.modeCardSub, active && styles.modeCardSubActive]}>{mode.subtitle}</Text>
                      <Text style={[styles.modeCardVisits, active && styles.modeCardVisitsActive]}>{mode.visits}</Text>
                    </View>
                    {active ? (
                      <MaterialCommunityIcons name="check-circle" size={22} color={theme.accent} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.previewLabel}>Your daily visit days</Text>
            <DatePillPreviewRow
              monthDates={monthDates}
              includedKeys={dailyCleaningIncludedKeys}
              styles={styles}
              dateKey={dateKey}
              formatDatePill={formatDatePill}
            />
          </View>
        );

      case 3:
        return (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>Pick deep clean days</Text>
            <Text style={styles.stepSubtitle}>Choose 1–2 days each for interior and exterior within your plan window.</Text>
            <DeepCleanDateRow
              activeTab={deepCleanTab}
              onTabChange={setDeepCleanTab}
              interiorDates={interiorDates}
              exteriorDates={exteriorDates}
              monthDates={monthDates}
              onToggleInterior={(key) => toggleDateSelection(interiorDates, setInteriorDates, key)}
              onToggleExterior={(key) => toggleDateSelection(exteriorDates, setExteriorDates, key)}
              onReset={() => {
                if (deepCleanTab === 'interior') setInteriorDates([]);
                else setExteriorDates([]);
              }}
              styles={styles}
              dateKey={dateKey}
              formatDatePill={formatDatePill}
            />
            {interiorDates.length < 1 || exteriorDates.length < 1 ? (
              <Text style={styles.inlineHint}>
                {interiorDates.length < 1 && exteriorDates.length < 1
                  ? 'Select at least one interior and one exterior day'
                  : interiorDates.length < 1
                    ? 'Select at least one interior day'
                    : 'Select at least one exterior day'}
              </Text>
            ) : null}
          </View>
        );

      case 4:
      default:
        return (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>Review your plan</Text>
            <Text style={styles.stepSubtitle}>Everything looks good? Continue to checkout.</Text>
            <View style={styles.reviewBlock}>
              <ReviewRow icon="calendar-month-outline" label="Starts" value={formatHeaderDate(packageStartDate)} />
              <ReviewRow icon="clock-outline" label="Time slot" value={packageTimeSlot || '—'} />
              <ReviewRow icon="calendar-refresh" label="Daily visits" value={dailyMode.title} />
              <ReviewRow
                icon="car-seat"
                label="Interior"
                value={
                  interiorDates.length
                    ? interiorDates.map(formatShortDate).join(', ')
                    : 'Not selected'
                }
              />
              <ReviewRow
                icon="car-wash"
                label="Exterior"
                value={
                  exteriorDates.length
                    ? exteriorDates.map(formatShortDate).join(', ')
                    : 'Not selected'
                }
              />
              <View style={styles.reviewDivider} />
              <Text style={styles.reviewPriceLabel}>Package total</Text>
              {renderPrice()}
            </View>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style={isLightMode ? 'dark' : 'light'} />
      <MinimalBackHeader navigation={navigation} title="Build your plan" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heroCard}>
          <Image source={require('../assets/dailyService.png')} style={styles.heroImage} resizeMode="contain" />
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>Daily Cleaning</Text>
            <Text style={styles.heroSubtitle}>{packageDurationDays}-day plan · interior, exterior & daily care</Text>
          </View>
          <TouchableOpacity
            style={styles.howItWorksBtn}
            onPress={() => setShowHowItWorks(true)}
            activeOpacity={0.8}
            accessibilityLabel="How it works"
          >
            <MaterialCommunityIcons name="help-circle-outline" size={22} color={theme.accent} />
          </TouchableOpacity>
        </View>

        <View style={styles.includedRow}>
          {[
            { icon: 'spray', label: 'Daily wipe' },
            { icon: 'car-seat', label: 'Interior' },
            { icon: 'car-wash', label: 'Exterior' },
          ].map((item) => (
            <View key={item.label} style={styles.includedTile}>
              <MaterialCommunityIcons name={item.icon} size={18} color={theme.accent} />
              <Text style={styles.includedLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.progressBlock}>
          <View style={styles.progressLabels}>
            <Text style={styles.progressText}>
              Step {step} of {TOTAL_STEPS}
            </Text>
            <Text style={styles.progressStepName}>
              {step === 1 ? 'Schedule' : step === 2 ? 'Frequency' : step === 3 ? 'Deep cleans' : 'Review'}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(step / TOTAL_STEPS) * 100}%` }]} />
          </View>
        </View>

        {step > 1 && packageTimeSlot ? (
          <View style={styles.confirmedChip}>
            <MaterialCommunityIcons name="check" size={14} color={wooshGreen.medium} />
            <Text style={styles.confirmedChipText}>
              Starts {formatHeaderDate(packageStartDate)} · {packageTimeSlot}
            </Text>
          </View>
        ) : null}

        {renderStepContent()}
      </ScrollView>

      <View style={styles.footer}>
        {step < TOTAL_STEPS ? (
          <View style={styles.footerSummary}>
            <Text style={styles.footerSummaryLabel}>Estimated price</Text>
            {renderPrice()}
          </View>
        ) : null}
        <View style={styles.footerButtons}>
          <TouchableOpacity style={styles.backButton} onPress={goBack} activeOpacity={0.85}>
            <Text style={styles.backButtonText}>{step === 1 ? 'Cancel' : 'Back'}</Text>
          </TouchableOpacity>
          {step < TOTAL_STEPS ? (
            <TouchableOpacity
              style={[styles.nextButton, !canGoNext && styles.nextButtonDisabled]}
              onPress={goNext}
              disabled={!canGoNext}
              activeOpacity={0.85}
            >
              <Text style={styles.nextButtonText}>Next</Text>
              <MaterialCommunityIcons name="arrow-right" size={18} color={theme.onAccent} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.nextButton, !canCheckout && styles.nextButtonDisabled]}
              onPress={navigateToCheckout}
              disabled={!canCheckout}
              activeOpacity={0.85}
            >
              <Text style={styles.nextButtonText}>Continue</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Modal visible={showHowItWorks} transparent animationType="fade" onRequestClose={() => setShowHowItWorks(false)}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowHowItWorks(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>How it works</Text>
              {HOW_IT_WORKS.map((line, i) => (
                <View key={i} style={styles.modalBulletRow}>
                  <Text style={styles.modalBullet}>•</Text>
                  <Text style={styles.modalText}>{line}</Text>
                </View>
              ))}
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowHowItWorks(false)} activeOpacity={0.85}>
                <Text style={styles.modalCloseText}>Got it</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function ReviewRow({ icon, label, value }) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
      <MaterialCommunityIcons name={icon} size={18} color={theme.accent} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textSecondary }}>{label}</Text>
        <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textPrimary, marginTop: 2 }}>{value}</Text>
      </View>
    </View>
  );
}

const createStyles = (theme, isLightMode) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scrollView: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 24, gap: 14 },
    heroCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.cardBackground,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      borderRadius: 16,
      padding: 12,
      gap: 10,
    },
    heroImage: { width: 56, height: 56 },
    heroText: { flex: 1 },
    heroTitle: { fontSize: 17, fontWeight: '800', color: theme.textPrimary },
    heroSubtitle: { fontSize: 12, color: theme.textSecondary, marginTop: 2, fontWeight: '600' },
    howItWorksBtn: { padding: 4 },
    includedRow: { flexDirection: 'row', gap: 8 },
    includedTile: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: theme.cardBackground,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 6,
    },
    includedLabel: { fontSize: 11, fontWeight: '700', color: theme.textPrimary },
    progressBlock: { gap: 8 },
    progressLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    progressText: { fontSize: 12, fontWeight: '700', color: theme.textSecondary },
    progressStepName: { fontSize: 12, fontWeight: '800', color: theme.accent },
    progressTrack: {
      height: 6,
      borderRadius: 999,
      backgroundColor: isLightMode ? '#E2E8F0' : theme.cardBorder,
      overflow: 'hidden',
    },
    progressFill: { height: '100%', backgroundColor: theme.accent, borderRadius: 999 },
    confirmedChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      backgroundColor: isLightMode ? '#ECFDF5' : 'rgba(46, 125, 50, 0.15)',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
    },
    confirmedChipText: { fontSize: 11, fontWeight: '700', color: wooshGreen.medium },
    stepCard: {
      backgroundColor: theme.cardBackground,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      borderRadius: 16,
      padding: 14,
      gap: 12,
    },
    stepTitle: { fontSize: 18, fontWeight: '800', color: theme.textPrimary },
    stepSubtitle: { fontSize: 13, color: theme.textSecondary, fontWeight: '600', lineHeight: 18, marginTop: -4 },
    stepHint: { fontSize: 12, color: theme.textSecondary, fontWeight: '600', flex: 1 },
    inlineHint: { fontSize: 12, color: theme.accent, fontWeight: '700' },
    label: { fontSize: 13, fontWeight: '700', color: theme.textSecondary },
    previewLabel: { fontSize: 13, fontWeight: '700', color: theme.textPrimary, marginTop: 4 },
    modeCards: { gap: 10 },
    modeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      borderRadius: 14,
      padding: 12,
      backgroundColor: isLightMode ? '#F8FAFC' : theme.background,
    },
    modeCardActive: {
      borderColor: theme.accent,
      borderWidth: 2,
      backgroundColor: isLightMode ? '#F2F8FF' : theme.accentSoft,
    },
    modeIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: theme.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modeIconWrapActive: { backgroundColor: theme.accent },
    modeCardText: { flex: 1 },
    modeCardTitle: { fontSize: 15, fontWeight: '800', color: theme.textPrimary },
    modeCardTitleActive: { color: theme.textPrimary },
    modeCardSub: { fontSize: 12, color: theme.textSecondary, fontWeight: '600', marginTop: 2 },
    modeCardSubActive: { color: theme.textSecondary },
    modeCardVisits: { fontSize: 11, fontWeight: '700', color: theme.accent, marginTop: 4 },
    modeCardVisitsActive: { color: theme.accent },
    deepCleanBlock: { gap: 10 },
    deepCleanTabs: { flexDirection: 'row', gap: 8 },
    deepCleanTab: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      alignItems: 'center',
      backgroundColor: theme.cardBackground,
    },
    deepCleanTabActive: {
      borderColor: isLightMode ? '#2F8EDC' : theme.accent,
      backgroundColor: isLightMode ? '#E6F3FF' : theme.accentSoft,
    },
    deepCleanTabActiveExterior: {
      borderColor: wooshGreen.medium,
      backgroundColor: isLightMode ? '#ECFDF5' : 'rgba(46, 125, 50, 0.12)',
    },
    deepCleanTabText: { fontSize: 12, fontWeight: '700', color: theme.textSecondary },
    deepCleanTabTextActive: { color: isLightMode ? '#2F8EDC' : theme.accent },
    deepCleanTabTextActiveExterior: { color: wooshGreen.medium },
    legendRow: { flexDirection: 'row', gap: 16 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendDotInterior: { backgroundColor: isLightMode ? '#2F8EDC' : theme.accent },
    legendDotExterior: { backgroundColor: wooshGreen.medium },
    legendText: { fontSize: 11, fontWeight: '600', color: theme.textSecondary },
    dualMarkerRow: { flexDirection: 'row', gap: 3, marginBottom: 4 },
    dateRowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    resetText: { fontSize: 13, fontWeight: '700', color: theme.accent, textDecorationLine: 'underline' },
    datePillsScrollContent: { gap: 10, paddingRight: 8 },
    datePill: {
      minWidth: 78,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      backgroundColor: isLightMode ? '#F8FAFC' : theme.cardBackground,
      paddingVertical: 8,
      paddingHorizontal: 10,
      alignItems: 'center',
    },
    datePillActive: {
      backgroundColor: isLightMode ? '#2F8EDC' : theme.accent,
      borderColor: isLightMode ? '#2F8EDC' : theme.accent,
    },
    datePillInterior: {
      backgroundColor: isLightMode ? '#2F8EDC' : theme.accent,
      borderColor: isLightMode ? '#2F8EDC' : theme.accent,
    },
    datePillExterior: {
      backgroundColor: wooshGreen.medium,
      borderColor: wooshGreen.medium,
    },
    datePillOtherSelected: {
      borderWidth: 2,
      borderColor: theme.cardBorder,
    },
    datePillPreviewMuted: {
      opacity: 0.55,
      backgroundColor: isLightMode ? '#F1F5F9' : theme.background,
    },
    datePillMonth: { fontSize: 11, fontWeight: '800', color: theme.textSecondary, marginBottom: 2 },
    datePillMonthActive: { color: isLightMode ? '#DBEAFE' : theme.onAccent },
    datePillMonthExterior: { color: '#DCFCE7' },
    datePillDate: { fontSize: 24, fontWeight: '700', color: theme.textSecondary, lineHeight: 26 },
    datePillDateActive: { color: isLightMode ? '#FFFFFF' : theme.onAccent },
    datePillDateExterior: { color: '#FFFFFF' },
    datePillDay: { fontSize: 13, fontWeight: '600', color: theme.textSecondary, marginTop: 2 },
    datePillDayActive: { color: isLightMode ? '#DBEAFE' : theme.onAccent },
    datePillDayExterior: { color: '#DCFCE7' },
    dateSelectorCard: {
      borderWidth: 1,
      borderColor: isLightMode ? '#C6E4FF' : theme.cardBorder,
      backgroundColor: isLightMode ? '#F2F8FF' : theme.accentSoft,
      borderRadius: 18,
      paddingVertical: 12,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    dateSelectorLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    dateIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dateSelectorLabel: { fontSize: 13, color: theme.textSecondary, fontWeight: '600', marginBottom: 2 },
    dateSelectorValue: { fontSize: 26, fontWeight: '900', color: theme.textPrimary, letterSpacing: -0.4 },
    iosDoneButton: {
      alignSelf: 'flex-end',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      backgroundColor: theme.cardBackground,
    },
    iosDoneButtonText: { fontSize: 12, fontWeight: '700', color: theme.textPrimary },
    reviewBlock: { gap: 4 },
    reviewDivider: { height: 1, backgroundColor: theme.cardBorder, marginVertical: 8 },
    reviewPriceLabel: { fontSize: 12, fontWeight: '700', color: theme.textSecondary },
    summaryPrice: { fontSize: 22, fontWeight: '900', color: theme.textPrimary, marginTop: 2 },
    summaryPriceStrike: {
      fontSize: 14,
      color: theme.textSecondary,
      textDecorationLine: 'line-through',
      fontWeight: '600',
    },
    summaryMuted: { fontSize: 14, color: theme.textSecondary, fontWeight: '600', marginTop: 2 },
    summaryError: { fontSize: 12, color: theme.danger || '#DC2626', fontWeight: '700', marginTop: 2 },
    memberHint: { marginTop: 4, fontSize: 12, fontWeight: '700', color: wooshGreen.medium },
    footer: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: theme.cardBorder,
      backgroundColor: theme.background,
      gap: 10,
    },
    footerSummary: { marginBottom: 2 },
    footerSummaryLabel: { fontSize: 11, fontWeight: '700', color: theme.textSecondary },
    footerButtons: { flexDirection: 'row', gap: 10 },
    backButton: {
      flex: 1,
      height: 50,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.cardBackground,
    },
    backButtonText: { fontSize: 15, fontWeight: '700', color: theme.textPrimary },
    nextButton: {
      flex: 2,
      height: 50,
      borderRadius: 999,
      backgroundColor: theme.accent,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    nextButtonDisabled: { opacity: 0.4 },
    nextButtonText: { color: theme.onAccent, fontWeight: '800', fontSize: 15 },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      padding: 24,
    },
    modalCard: {
      backgroundColor: theme.cardBackground,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    modalTitle: { fontSize: 18, fontWeight: '800', color: theme.textPrimary, marginBottom: 12 },
    modalBulletRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    modalBullet: { fontSize: 14, color: theme.accent, fontWeight: '800' },
    modalText: { flex: 1, fontSize: 14, lineHeight: 20, color: theme.textSecondary, fontWeight: '600' },
    modalCloseBtn: {
      marginTop: 12,
      height: 44,
      borderRadius: 999,
      backgroundColor: theme.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalCloseText: { color: theme.onAccent, fontWeight: '800', fontSize: 15 },
  });
