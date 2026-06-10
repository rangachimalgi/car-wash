import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE_URL } from '../config/api';
import api from '../services/api';
import ServicePhotoGrid from '../components/ServicePhotoGrid';
import { uploadOrderPhotos } from '../services/orderPhotosApi';
import { stopEmployeeLocationSharing } from '../locationTask';
import { getScheduledTimeSlot } from '../utils/jobBookingHelpers';
import {
  countFilledSlots,
  emptyPhotoSlots,
  hasRequiredPhotos,
  normalizePhotoSlots,
  PHOTO_SLOTS,
} from '../utils/servicePhotoSlots';
const BLUE = '#2563EB';
const BLUE_LIGHT = '#EFF6FF';
const BLUE_BORDER = '#BFDBFE';
const GREEN = '#16A34A';
const GREEN_LIGHT = '#F0FDF4';
const GREEN_BORDER = '#BBF7D0';

function getInitials(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return '?';
}

function formatPhoneDisplay(phone) {
  if (!phone) return 'Phone not provided';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return phone;
}

function splitAddress(address) {
  if (!address || address === 'Address not provided') {
    return { primary: address, secondary: '' };
  }
  const parts = address.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length <= 1) return { primary: address, secondary: '' };
  return { primary: parts[0], secondary: parts.slice(1).join(', ') };
}

function formatTimeLabel(date) {
  if (!date) return '—';
  try {
    return new Date(date).toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '—';
  }
}

function formatDurationMins(start, end) {
  if (!start || !end) return '—';
  const mins = Math.max(0, Math.round((new Date(end) - new Date(start)) / 60000));
  return `${mins} mins`;
}

function IconBadge({ name, color = BLUE, bg = BLUE_LIGHT, size = 16 }) {
  return (
    <View style={iconBadgeStyles.wrap}>
      <View style={[iconBadgeStyles.inner, { backgroundColor: bg }]}>
        <MaterialCommunityIcons name={name} size={size} color={color} />
      </View>
    </View>
  );
}

const iconBadgeStyles = StyleSheet.create({
  wrap: { alignSelf: 'flex-start' },
  inner: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const cardShadow = Platform.select({
  ios: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  android: { elevation: 2 },
});

export default function StartServiceScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(), []);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState(null);
  const [coords, setCoords] = useState(null);
  const [orderStatus, setOrderStatus] = useState(null);
  const [codeInput, setCodeInput] = useState('');
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [beforePhotos, setBeforePhotos] = useState(emptyPhotoSlots);
  const [afterPhotos, setAfterPhotos] = useState(emptyPhotoSlots);
  const [uploadingAfterSlot, setUploadingAfterSlot] = useState(null);
  const [startedAt, setStartedAt] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [checkedChecklist, setCheckedChecklist] = useState({});

  const orderId = route?.params?.orderId;
  const employeeId = route?.params?.employeeId;
  const orderInProgress = orderStatus === 'In Progress';

  const applyOrderData = (data) => {
    setOrder(data);
    setOrderStatus(data.status);
    setBeforePhotos(normalizePhotoSlots(data.servicePhotos?.beforePhotos));
    setAfterPhotos(normalizePhotoSlots(data.servicePhotos?.afterPhotos));
    const lat = data.customer?.latitude;
    const lng = data.customer?.longitude;
    if (typeof lat === 'number' && typeof lng === 'number') {
      setCoords({ lat, lng });
    } else {
      setCoords(null);
    }
    if (data.status === 'In Progress' && !startedAt) {
      const assignment = data.assignments?.find((a) => a.employeeId === employeeId);
      const fallback = assignment?.acceptedAt || data.updatedAt;
      setStartedAt(fallback ? new Date(fallback) : new Date());
    }
  };

  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) return;
      try {
        const url = employeeId
          ? `${API_BASE_URL}/orders/${orderId}?employeeId=${employeeId}`
          : `${API_BASE_URL}/orders/${orderId}`;
        const res = await fetch(url);
        const data = await res.json();
        if (res.ok && data?.data) {
          applyOrderData(data.data);
        }
      } catch (error) {
        console.error('Error loading order:', error);
      }
    };
    loadOrder();
  }, [orderId, employeeId]);

  useEffect(() => {
    if (!orderInProgress) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, [orderInProgress]);

  useEffect(() => {
    if (loading || orderInProgress || !orderId) return;
    if (orderStatus && !['In Progress', 'Completed', 'Cancelled'].includes(orderStatus)) {
      if (!hasRequiredPhotos(beforePhotos)) {
        navigation.replace('BeforePhotos', { orderId, employeeId });
      }
    }
  }, [loading, orderInProgress, orderId, employeeId, orderStatus, beforePhotos, navigation]);

  const handleVerifyCode = async () => {
    const code = codeInput.replace(/\D/g, '').slice(0, 6);
    if (code.length !== 6) {
      setCodeError('Enter 6-digit code');
      return;
    }
    if (!orderId || !employeeId) return;
    setLoadingVerify(true);
    setCodeError('');
    try {
      const url = `${API_BASE_URL}/orders/${orderId}/verify-start-otp?employeeId=${encodeURIComponent(employeeId)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: code }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStartedAt(new Date());
        if (data.data) {
          applyOrderData(data.data);
        } else {
          setOrderStatus('In Progress');
        }
        setCodeInput('');
      } else {
        setCodeError(data.message || 'Invalid code');
      }
    } catch {
      setCodeError('Could not verify. Try again.');
    } finally {
      setLoadingVerify(false);
    }
  };

  const pickAndUploadAfterPhoto = async (slotKey) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to photos to upload.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;

    setUploadingAfterSlot(slotKey);
    try {
      const data = await uploadOrderPhotos({
        orderId,
        employeeId,
        type: 'after',
        slot: slotKey,
        assets: result.assets,
      });
      const updated = data.data?.servicePhotos;
      if (updated) {
        setAfterPhotos(normalizePhotoSlots(updated.afterPhotos));
      }
    } catch (e) {
      console.error('Photo upload error:', e);
      Alert.alert('Upload failed', e.message || 'Could not upload photo.');
    } finally {
      setUploadingAfterSlot(null);
    }
  };

  const handleCall = async () => {
    const phone = order?.customer?.phone;
    if (!phone) {
      Alert.alert('No phone number', 'Customer phone number is not available.');
      return;
    }
    try {
      await Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
    } catch {
      Alert.alert('Call unavailable', 'Unable to open the phone dialer.');
    }
  };

  const handleSubmit = async () => {
    if (!orderId) {
      Alert.alert('Missing job', 'Unable to find job id for this service.');
      return;
    }
    setSubmitting(true);
    try {
      const url = employeeId
        ? `/orders/${orderId}?employeeId=${employeeId}`
        : `/orders/${orderId}`;
      const res = await api.patch(url, {
        status: 'Completed',
        paymentReceived: true,
      });
      if (!res.data?.success) {
        Alert.alert('Submit failed', res.data?.message || 'Unable to submit right now.');
        return;
      }
      await stopEmployeeLocationSharing();
      navigation.replace('MaterialUsage', {
        orderId,
        employeeId,
        fromJobComplete: true,
      });
    } catch (error) {
      console.error('Submit service error:', error);
      Alert.alert('Submit failed', 'Unable to submit right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const needsOtp = orderStatus && !['In Progress', 'Completed', 'Cancelled'].includes(orderStatus);
  const loading = orderId && orderStatus === null;

  const item = order?.items?.[0];
  const coverageItems = useMemo(() => {
    const raw = item?.service?.specifications?.coverage || [];
    return raw.map((label) => String(label || '').trim()).filter(Boolean);
  }, [item?.service?.specifications?.coverage]);

  useEffect(() => {
    if (!orderInProgress || coverageItems.length === 0) return;
    setCheckedChecklist((prev) => {
      const next = {};
      coverageItems.forEach((_, index) => {
        next[index] = prev[index] ?? false;
      });
      return next;
    });
  }, [orderInProgress, coverageItems]);

  const checklistDoneCount = coverageItems.filter((_, index) => checkedChecklist[index]).length;
  const checklistComplete =
    coverageItems.length === 0 || checklistDoneCount === coverageItems.length;

  const canSubmit =
    orderInProgress &&
    hasRequiredPhotos(beforePhotos) &&
    hasRequiredPhotos(afterPhotos) &&
    checklistComplete;

  const serviceName = item?.service?.name || item?.serviceName || 'Service';
  const addOnText = (item?.addOns || []).map((a) => a.name).filter(Boolean).join(', ');
  const address = order?.customer?.address || 'Address not provided';
  const { primary: addressPrimary, secondary: addressSecondary } = splitAddress(address);
  const customerName = order?.customer?.name || 'Customer';
  const customerPhone = order?.customer?.phone || '';
  const vehicleModel = order?.customer?.vehicleModel || '';
  const vehicleType = order?.customer?.vehicleType || '';
  const vehiclePrimary = vehicleModel || vehicleType || 'Not provided';
  const vehicleSecondary = vehicleModel && vehicleType ? vehicleType : '';
  const scheduledSlot = getScheduledTimeSlot(order);
  const startedLabel = formatTimeLabel(startedAt);
  const completedLabel = formatTimeLabel(now);
  const durationLabel = formatDurationMins(startedAt, now);

  const afterFilledCount = countFilledSlots(afterPhotos);
  const photosReady = hasRequiredPhotos(afterPhotos);
  const allTasksReady = photosReady && checklistComplete;

  const toggleChecklistItem = (index) => {
    setCheckedChecklist((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const showHelp = () => {
    Alert.alert(
      'Job in Progress',
      'Upload after photos, then tap Complete Job. The customer will be notified and can leave a review.'
    );
  };

  return (
    <View style={[styles.container, { paddingTop: 12 + insets.top }]}>
      <StatusBar style="dark" />

      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={BLUE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {orderInProgress ? 'Job in Progress' : 'Start Service'}
        </Text>
        <TouchableOpacity style={styles.headerBtn} onPress={showHelp}>
          <MaterialCommunityIcons name="help-circle-outline" size={22} color="#64748B" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={BLUE} />
          <Text style={styles.loadingText}>Loading order...</Text>
        </View>
      ) : null}

      {needsOtp ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.otpTitle}>Enter start code</Text>
            <Text style={styles.otpHint}>
              Ask the customer for the 6-digit code shown in their Bookings screen.
            </Text>
            <TextInput
              style={styles.codeInput}
              value={codeInput}
              onChangeText={(t) => {
                setCodeInput(t.replace(/\D/g, '').slice(0, 6));
                setCodeError('');
              }}
              placeholder="000000"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              maxLength={6}
            />
            {codeError ? <Text style={styles.codeError}>{codeError}</Text> : null}
            <TouchableOpacity
              style={[
                styles.verifyButton,
                (codeInput.replace(/\D/g, '').length !== 6 || loadingVerify) && styles.verifyButtonDisabled,
              ]}
              onPress={handleVerifyCode}
              disabled={codeInput.replace(/\D/g, '').length !== 6 || loadingVerify}
            >
              <Text style={styles.verifyButtonText}>
                {loadingVerify ? 'Verifying...' : 'Verify & Start'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : null}

      {orderInProgress ? (
        <>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 130 + insets.bottom }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Status banner */}
            <View style={[styles.statusBanner, allTasksReady && styles.statusBannerReady]}>
              <View style={[styles.statusIconWrap, allTasksReady && styles.statusIconWrapReady]}>
                <MaterialCommunityIcons
                  name={allTasksReady ? 'check-circle' : 'progress-clock'}
                  size={22}
                  color={allTasksReady ? GREEN : BLUE}
                />
              </View>
              <View style={styles.statusTextWrap}>
                <Text style={[styles.statusTitle, allTasksReady && styles.statusTitleReady]}>
                  {allTasksReady
                    ? 'Ready to Complete'
                    : checklistComplete
                      ? 'Service Started'
                      : 'Checklist In Progress'}
                </Text>
                <Text style={styles.statusSubtext}>
                  {allTasksReady
                    ? "Great work! Checklist and after photos are done."
                    : !checklistComplete
                      ? 'Complete each included service item as you work.'
                      : 'Upload after photos to finish the job.'}
                </Text>
              </View>
            </View>

            {/* Job Summary */}
            <Text style={styles.blockTitle}>Job Summary</Text>
            <View style={styles.card}>
              <View style={styles.customerRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getInitials(customerName)}</Text>
                </View>
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{customerName}</Text>
                  <View style={styles.phoneRow}>
                    <MaterialCommunityIcons name="phone-outline" size={13} color="#9CA3AF" />
                    <Text style={styles.phoneText}>{formatPhoneDisplay(customerPhone)}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.callButton} onPress={handleCall} activeOpacity={0.8}>
                  <MaterialCommunityIcons name="phone" size={18} color={BLUE} />
                </TouchableOpacity>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.splitRow}>
                <View style={styles.splitCol}>
                  <IconBadge name="car-side" />
                  <Text style={styles.splitPrimary} numberOfLines={1}>
                    {vehiclePrimary}
                  </Text>
                  {vehicleSecondary ? (
                    <Text style={styles.splitSecondary} numberOfLines={1}>
                      {vehicleSecondary}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.splitDivider} />
                <View style={styles.splitCol}>
                  <IconBadge name="map-marker" />
                  <Text style={styles.splitPrimary} numberOfLines={2}>
                    {addressPrimary}
                  </Text>
                  {addressSecondary ? (
                    <Text style={styles.splitSecondary} numberOfLines={2}>
                      {addressSecondary}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>

            {/* After Photos */}
            <View style={styles.photoSectionHeader}>
              <Text style={styles.blockTitle}>After Photos</Text>
              <Text style={styles.photoCounter}>
                {afterFilledCount} / {PHOTO_SLOTS.length}
              </Text>
            </View>
            <Text style={styles.photoSectionHint}>
              {countFilledSlots(beforePhotos)} before photo
              {countFilledSlots(beforePhotos) === 1 ? '' : 's'} uploaded · Front required
            </Text>
            <ServicePhotoGrid
              photos={afterPhotos}
              uploadingSlot={uploadingAfterSlot}
              onSlotPress={pickAndUploadAfterPhoto}
              disabled={Boolean(uploadingAfterSlot)}
            />

            {coverageItems.length > 0 ? (
              <>
                <View style={styles.checklistHeader}>
                  <View style={styles.checklistTitleRow}>
                    <MaterialCommunityIcons
                      name="clipboard-check-outline"
                      size={18}
                      color={checklistComplete ? GREEN : BLUE}
                    />
                    <Text style={styles.blockTitle}>Checklist</Text>
                  </View>
                  <Text
                    style={[
                      styles.checklistProgress,
                      checklistComplete && styles.checklistProgressDone,
                    ]}
                  >
                    {checklistDoneCount} / {coverageItems.length} completed
                  </Text>
                </View>
                <View style={styles.card}>
                  {coverageItems.map((label, index) => {
                    const checked = !!checkedChecklist[index];
                    return (
                      <TouchableOpacity
                        key={`${label}-${index}`}
                        style={[
                          styles.checklistRow,
                          index < coverageItems.length - 1 && styles.checklistRowBorder,
                        ]}
                        onPress={() => toggleChecklistItem(index)}
                        activeOpacity={0.75}
                      >
                        <View
                          style={[
                            styles.checklistBox,
                            checked && styles.checklistBoxChecked,
                          ]}
                        >
                          {checked ? (
                            <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
                          ) : null}
                        </View>
                        <Text
                          style={[
                            styles.checklistLabel,
                            checked && styles.checklistLabelChecked,
                          ]}
                        >
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            ) : null}

            {/* Service Details */}
            <Text style={styles.blockTitle}>Service Details</Text>
            <View style={styles.card}>
              <View style={styles.detailRow}>
                <IconBadge name="package-variant-closed" />
                <View style={styles.detailInfo}>
                  <Text style={styles.detailPrimary}>{serviceName}</Text>
                  {addOnText ? <Text style={styles.detailSecondary}>{addOnText}</Text> : null}
                </View>
              </View>
            </View>

            {/* Time */}
            <Text style={styles.blockTitle}>Time</Text>
            <View style={styles.card}>
              <View style={styles.timeSplitRow}>
                <View style={styles.timeCol}>
                  <Text style={styles.timeLabel}>Started At</Text>
                  <Text style={styles.timeValue}>{startedLabel}</Text>
                </View>
                <View style={styles.splitDivider} />
                <View style={styles.timeCol}>
                  <Text style={styles.timeLabel}>Scheduled</Text>
                  <Text style={styles.timeValue}>{scheduledSlot}</Text>
                </View>
              </View>
              <View style={styles.durationBanner}>
                <MaterialCommunityIcons name="clock-outline" size={16} color={GREEN} />
                <Text style={styles.durationText}>Total Time Taken: {durationLabel}</Text>
              </View>
            </View>
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: 14 + insets.bottom }]}>
            <TouchableOpacity
              style={[styles.completeButton, (!canSubmit || submitting) && styles.completeButtonDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit || submitting}
              activeOpacity={0.9}
            >
              <MaterialCommunityIcons name="check-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.completeButtonText}>
                {submitting ? 'Completing...' : 'Complete Job'}
              </Text>
            </TouchableOpacity>
            <View style={styles.footerHintRow}>
              <MaterialCommunityIcons name="lock-outline" size={12} color="#94A3B8" />
              <Text style={styles.footerHint}>
                Customer will be notified, invoice will be generated and review will be requested
              </Text>
            </View>
            {!canSubmit ? (
              <Text style={styles.footerRequirement}>
                {!checklistComplete
                  ? 'Complete all checklist items before finishing the job.'
                  : 'Upload the front after photo to complete the job.'}
              </Text>
            ) : null}
          </View>
        </>
      ) : null}
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F1F5F9',
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    headerBtn: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: BLUE_LIGHT,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: '#0F172A',
      letterSpacing: -0.2,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
      gap: 14,
    },
    loadingWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    loadingText: {
      color: '#64748B',
      fontSize: 13,
    },
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: 18,
      borderWidth: 1,
      borderColor: '#E8EDF3',
      padding: 18,
      ...cardShadow,
    },
    blockTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: '#0F172A',
      marginBottom: -6,
      letterSpacing: -0.2,
    },
    statusBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: BLUE_LIGHT,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: BLUE_BORDER,
      padding: 16,
    },
    statusBannerReady: {
      backgroundColor: GREEN_LIGHT,
      borderColor: GREEN_BORDER,
    },
    statusIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    statusIconWrapReady: {
      backgroundColor: '#FFFFFF',
    },
    statusTextWrap: {
      flex: 1,
      gap: 3,
    },
    statusTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: BLUE,
    },
    statusTitleReady: {
      color: GREEN,
    },
    statusSubtext: {
      fontSize: 12,
      color: '#64748B',
      lineHeight: 17,
    },
    customerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: BLUE,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      color: '#FFFFFF',
      fontSize: 17,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    customerInfo: {
      flex: 1,
      gap: 5,
    },
    customerName: {
      fontSize: 17,
      fontWeight: '700',
      color: '#0F172A',
    },
    phoneRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    phoneText: {
      fontSize: 13,
      color: '#64748B',
      fontWeight: '500',
    },
    callButton: {
      width: 44,
      height: 44,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: BLUE_BORDER,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: BLUE_LIGHT,
    },
    summaryDivider: {
      height: 1,
      backgroundColor: '#E8EDF3',
      marginVertical: 16,
    },
    splitRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    splitCol: {
      flex: 1,
      gap: 6,
      paddingHorizontal: 2,
    },
    splitDivider: {
      width: 1,
      backgroundColor: '#E8EDF3',
      marginHorizontal: 14,
      alignSelf: 'stretch',
    },
    splitPrimary: {
      fontSize: 14,
      fontWeight: '700',
      color: '#0F172A',
      lineHeight: 20,
    },
    splitSecondary: {
      fontSize: 12,
      color: '#64748B',
      fontWeight: '500',
      lineHeight: 17,
    },
    photoSectionHint: {
      fontSize: 12,
      color: '#64748B',
      marginTop: -6,
      marginBottom: 4,
    },
    checklistHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: -6,
    },
    checklistTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    checklistProgress: {
      fontSize: 12,
      fontWeight: '600',
      color: '#64748B',
    },
    checklistProgressDone: {
      color: GREEN,
    },
    checklistRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
    },
    checklistRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: '#E8EDF3',
    },
    checklistBox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: '#CBD5E1',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFFFFF',
    },
    checklistBoxChecked: {
      backgroundColor: GREEN,
      borderColor: GREEN,
    },
    checklistLabel: {
      flex: 1,
      fontSize: 14,
      color: '#334155',
      lineHeight: 20,
      fontWeight: '500',
    },
    checklistLabelChecked: {
      color: '#64748B',
      textDecorationLine: 'line-through',
    },
    photoSectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: -6,
    },
    photoCounter: {
      fontSize: 12,
      fontWeight: '600',
      color: '#64748B',
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    detailInfo: {
      flex: 1,
      gap: 4,
      paddingTop: 4,
    },
    detailPrimary: {
      fontSize: 14,
      fontWeight: '700',
      color: '#0F172A',
      lineHeight: 20,
    },
    detailSecondary: {
      fontSize: 13,
      color: '#64748B',
      fontWeight: '500',
      lineHeight: 18,
    },
    timeSplitRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 14,
    },
    timeCol: {
      flex: 1,
      gap: 6,
      paddingHorizontal: 2,
    },
    timeLabel: {
      fontSize: 12,
      color: '#94A3B8',
      fontWeight: '500',
    },
    timeValue: {
      fontSize: 14,
      fontWeight: '700',
      color: '#0F172A',
      lineHeight: 20,
    },
    durationBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: GREEN_LIGHT,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: GREEN_BORDER,
    },
    durationText: {
      fontSize: 13,
      fontWeight: '600',
      color: GREEN,
    },
    footer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#F1F5F9',
      paddingHorizontal: 16,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: '#E2E8F0',
    },
    completeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: BLUE,
      borderRadius: 16,
      paddingVertical: 17,
      ...Platform.select({
        ios: {
          shadowColor: BLUE,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        android: { elevation: 4 },
      }),
    },
    completeButtonDisabled: {
      opacity: 0.5,
    },
    completeButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    footerHintRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
      marginTop: 10,
      paddingHorizontal: 4,
    },
    footerHint: {
      flex: 1,
      fontSize: 11,
      color: '#94A3B8',
      lineHeight: 15,
    },
    footerRequirement: {
      textAlign: 'center',
      fontSize: 11,
      color: '#EA580C',
      marginTop: 8,
    },
    otpTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: '#0F172A',
      marginBottom: 6,
    },
    otpHint: {
      fontSize: 13,
      color: '#64748B',
      lineHeight: 18,
      marginBottom: 16,
    },
    codeInput: {
      borderWidth: 1.5,
      borderColor: '#E2E8F0',
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 16,
      fontSize: 22,
      letterSpacing: 6,
      textAlign: 'center',
      marginBottom: 8,
      backgroundColor: '#F8FAFC',
      color: '#0F172A',
      fontWeight: '600',
    },
    codeError: {
      fontSize: 13,
      color: '#DC2626',
      marginBottom: 8,
    },
    verifyButton: {
      backgroundColor: BLUE,
      borderRadius: 14,
      paddingVertical: 15,
      alignItems: 'center',
      marginTop: 4,
    },
    verifyButtonDisabled: {
      opacity: 0.55,
    },
    verifyButtonText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 15,
    },
  });
