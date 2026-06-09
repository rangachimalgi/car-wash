import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../services/api';
import { startEmployeeLocationSharing } from '../locationTask';
import {
  getDateLabel,
  getScheduledDate,
  getScheduledTimeSlot,
} from '../utils/jobBookingHelpers';

const BLUE = '#2563EB';
const BLUE_LIGHT = '#EFF6FF';
const BLUE_BORDER = '#BFDBFE';

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

function IconBadge({ name, color = BLUE, bg = BLUE_LIGHT, size = 16 }) {
  return (
    <View style={[iconBadgeStyles.wrap, { backgroundColor: bg }]}>
      <MaterialCommunityIcons name={name} size={size} color={color} />
    </View>
  );
}

const iconBadgeStyles = StyleSheet.create({
  wrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default function JobDetailScreen({ route, navigation, employeeId: employeeIdProp }) {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(), []);
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState(null);
  const [sharingLocation, setSharingLocation] = useState(false);

  const orderId = route?.params?.orderId;
  const employeeId = route?.params?.employeeId ?? employeeIdProp;

  useEffect(() => {
    const loadJob = async () => {
      if (!orderId) return;
      setLoading(true);
      try {
        const url = employeeId
          ? `/orders/${orderId}?employeeId=${employeeId}`
          : `/orders/${orderId}`;
        const response = await api.get(url);
        setJob(response.data?.data || null);
      } catch (error) {
        console.error('Error fetching job detail:', error);
        setJob(null);
      } finally {
        setLoading(false);
      }
    };
    loadJob();
  }, [orderId, employeeId]);

  const item = job?.items?.[0];
  const serviceName = item?.service?.name || item?.serviceName || 'Service';
  const addOnText = (item?.addOns || []).map((a) => a.name).filter(Boolean).join(', ');
  const scheduledDate = getScheduledDate(job);
  const timeSlot = getScheduledTimeSlot(job);
  const dateLabel = getDateLabel(scheduledDate);
  const scheduledDisplay =
    dateLabel && timeSlot && timeSlot !== '—' ? `${dateLabel}, ${timeSlot}` : timeSlot;

  const address = job?.customer?.address || 'Address not provided';
  const { primary: addressPrimary, secondary: addressSecondary } = splitAddress(address);
  const customerName = job?.customer?.name || 'Customer';
  const customerPhone = job?.customer?.phone || '';
  const vehicleModel = job?.customer?.vehicleModel || '';
  const vehicleType = job?.customer?.vehicleType || '';
  const vehiclePrimary = vehicleModel || vehicleType || 'Not provided';
  const vehicleSecondary = vehicleModel && vehicleType ? vehicleType : '';

  const lat = job?.customer?.latitude;
  const lng = job?.customer?.longitude;
  const hasCoords = typeof lat === 'number' && typeof lng === 'number';

  const handleCall = async () => {
    if (!customerPhone) {
      Alert.alert('No phone number', 'Customer phone number is not available.');
      return;
    }
    const tel = customerPhone.replace(/\s/g, '');
    try {
      await Linking.openURL(`tel:${tel}`);
    } catch {
      Alert.alert('Call unavailable', 'Unable to open the phone dialer.');
    }
  };

  const handleOpenMaps = async () => {
    if (!hasCoords && !address) {
      Alert.alert('No location', 'Customer location not available.');
      return;
    }

    if (orderId && employeeId) {
      setSharingLocation(true);
      try {
        const sharing = await startEmployeeLocationSharing(orderId, employeeId);
        if (!sharing.ok) {
          Alert.alert(
            'Location sharing failed',
            sharing.error || 'Could not share your location with the customer.'
          );
        }
      } finally {
        setSharingLocation(false);
      }
    } else if (orderId && !employeeId) {
      Alert.alert('Unable to share location', 'Employee session not found. Please log in again.');
    }

    const destination = hasCoords ? `${lat},${lng}` : encodeURIComponent(address);
    const httpUrl =
      Platform.OS === 'ios'
        ? `http://maps.apple.com/?daddr=${destination}`
        : `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    try {
      await Linking.openURL(httpUrl);
    } catch {
      const geoUrl = hasCoords
        ? `geo:${lat},${lng}?q=${lat},${lng}`
        : `geo:0,0?q=${destination}`;
      try {
        await Linking.openURL(geoUrl);
      } catch {
        Alert.alert('Maps unavailable', 'Unable to open maps on this device.');
      }
    }
  };

  const handleContinue = () => {
    const inProgress = job?.status === 'In Progress';
    if (inProgress) {
      navigation?.navigate('StartService', { orderId, employeeId });
      return;
    }
    navigation?.navigate('BeforePhotos', { orderId, employeeId });
  };

  return (
    <View style={[styles.container, { paddingTop: 12 + insets.top }]}>
      <StatusBar style="dark" />

      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={BLUE} />
        </TouchableOpacity>
        <Text style={styles.title}>Job Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={BLUE} />
          <Text style={styles.loadingText}>Loading job...</Text>
        </View>
      ) : job ? (
        <>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 130 + insets.bottom }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Customer */}
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
            </View>

            {/* Vehicle & Location */}
            <View style={styles.card}>
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

            {/* Service Details */}
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <IconBadge name="clipboard-text-outline" />
                <Text style={styles.sectionTitle}>Service Details</Text>
              </View>
              <View style={styles.detailRow}>
                <IconBadge name="package-variant-closed" />
                <View style={styles.detailInfo}>
                  <Text style={styles.detailPrimary}>{serviceName}</Text>
                  {addOnText ? <Text style={styles.detailSecondary}>{addOnText}</Text> : null}
                </View>
              </View>
            </View>

            {/* Time */}
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <IconBadge name="clock-outline" />
                <Text style={styles.sectionTitle}>Time</Text>
              </View>
              <View style={styles.timeSplitRow}>
                <View style={styles.timeCol}>
                  <Text style={styles.timeLabel}>Scheduled Time</Text>
                  <Text style={styles.timeValue}>{scheduledDisplay}</Text>
                </View>
                <View style={styles.splitDivider} />
                <View style={styles.timeCol}>
                  <Text style={styles.timeLabel}>Estimated Duration</Text>
                  <Text style={styles.timeValue}>—</Text>
                </View>
              </View>
            </View>

            {/* Navigate */}
            <TouchableOpacity
              style={[styles.mapsButton, sharingLocation && styles.mapsButtonDisabled]}
              onPress={handleOpenMaps}
              activeOpacity={0.85}
              disabled={sharingLocation}
            >
              {sharingLocation ? (
                <ActivityIndicator size="small" color={BLUE} />
              ) : (
                <MaterialCommunityIcons name="google-maps" size={22} color={BLUE} />
              )}
              <Text style={styles.mapsButtonText}>
                {sharingLocation ? 'Sharing location…' : 'Navigate with Google Maps'}
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { paddingBottom: 14 + insets.bottom }]}>
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleContinue}
              activeOpacity={0.9}
            >
              <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
              <Text style={styles.startButtonText}>
                {job?.status === 'In Progress' ? 'Continue service' : 'Continue'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.footerHint}>
              {job?.status === 'In Progress'
                ? 'Return to the active service screen'
                : 'Next: upload before photos, then start the service'}
            </Text>
          </View>
        </>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Job not found.</Text>
        </View>
      )}
    </View>
  );
}

const cardShadow = Platform.select({
  ios: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  android: { elevation: 2 },
});

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
      paddingHorizontal: 20,
      marginBottom: 16,
    },
    backButton: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: BLUE_LIGHT,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerSpacer: {
      width: 38,
    },
    title: {
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
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: 18,
      borderWidth: 1,
      borderColor: '#E8EDF3',
      padding: 18,
      ...cardShadow,
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
      letterSpacing: -0.2,
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
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: '#0F172A',
      letterSpacing: -0.2,
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
    mapsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      backgroundColor: BLUE_LIGHT,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: BLUE_BORDER,
      paddingVertical: 16,
      ...cardShadow,
    },
    mapsButtonDisabled: {
      opacity: 0.7,
    },
    mapsButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: BLUE,
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
    startButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
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
    playCircle: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    playIcon: {
      marginLeft: 2,
    },
    startButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: -0.2,
    },
    footerHint: {
      textAlign: 'center',
      fontSize: 12,
      color: '#94A3B8',
      marginTop: 10,
      lineHeight: 16,
    },
    loadingWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 20,
    },
    loadingText: {
      color: '#64748B',
      fontSize: 13,
    },
    emptyCard: {
      marginHorizontal: 16,
      backgroundColor: '#FFFFFF',
      borderRadius: 18,
      borderWidth: 1,
      borderColor: '#E8EDF3',
      padding: 20,
      alignItems: 'center',
      ...cardShadow,
    },
    emptyText: {
      color: '#64748B',
      fontSize: 13,
    },
  });
