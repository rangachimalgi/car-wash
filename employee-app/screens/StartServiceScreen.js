import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { API_BASE_URL } from '../config/api';
import {
  clearActiveOrderId,
  saveActiveOrderId,
  startBackgroundLocationUpdates,
  stopBackgroundLocationUpdates,
} from '../locationTask';

const UPLOADS_BASE = API_BASE_URL.replace(/\/api\/?$/, '');

export default function StartServiceScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [paymentReceived, setPaymentReceived] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState(null);
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState(null);
  const [orderStatus, setOrderStatus] = useState(null);
  const [codeInput, setCodeInput] = useState('');
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [beforePhotos, setBeforePhotos] = useState([]);
  const [afterPhotos, setAfterPhotos] = useState([]);
  const [uploadingBefore, setUploadingBefore] = useState(false);
  const [uploadingAfter, setUploadingAfter] = useState(false);
  const orderId = route?.params?.orderId;
  const employeeId = route?.params?.employeeId;

  const orderInProgress = orderStatus === 'In Progress';

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
          setOrderStatus(data.data.status);
          if (data.data.totalAmount != null) setAmount(data.data.totalAmount);
          setAddress(data.data.customer?.address || '');
          setBeforePhotos(data.data.servicePhotos?.beforePhotos || []);
          setAfterPhotos(data.data.servicePhotos?.afterPhotos || []);
          const lat = data.data.customer?.latitude;
          const lng = data.data.customer?.longitude;
          if (typeof lat === 'number' && typeof lng === 'number') {
            setCoords({ lat, lng });
          } else {
            setCoords(null);
          }
        }
      } catch (error) {
        console.error('Error loading order:', error);
      }
    };
    loadOrder();
  }, [orderId, employeeId]);

  useEffect(() => {
    if (!orderId || !orderInProgress) return;
    let intervalId;
    const startLocationUpdates = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const sendLocation = async () => {
          try {
            const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const { latitude, longitude } = position.coords || {};
            if (typeof latitude !== 'number' || typeof longitude !== 'number') return;
            const url = employeeId
              ? `${API_BASE_URL}/orders/${orderId}/employee-location?employeeId=${employeeId}`
              : `${API_BASE_URL}/orders/${orderId}/employee-location`;
            await fetch(url, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ latitude, longitude }),
            });
          } catch (e) {
            console.error('Error updating live location:', e);
          }
        };
        await sendLocation();
        intervalId = setInterval(sendLocation, 20000);
      } catch (e) {
        console.error('Error requesting location permission:', e);
      }
    };
    startLocationUpdates();
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [orderId, employeeId, orderInProgress]);

  useEffect(() => {
    if (!orderId || !orderInProgress) return;
    const startBackgroundTracking = async () => {
      try {
        const { status } = await Location.requestBackgroundPermissionsAsync();
        if (status !== 'granted') return;
        await saveActiveOrderId(orderId, employeeId);
        await startBackgroundLocationUpdates();
      } catch (e) {
        console.error('Error starting background tracking:', e);
      }
    };
    startBackgroundTracking();
  }, [orderId, employeeId, orderInProgress]);

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
        setOrderStatus('In Progress');
        setCodeInput('');
      } else {
        setCodeError(data.message || 'Invalid code');
      }
    } catch (e) {
      setCodeError('Could not verify. Try again.');
    } finally {
      setLoadingVerify(false);
    }
  };

  const pickAndUploadPhotos = async (type) => {
    const isBefore = type === 'before';
    const setUploading = isBefore ? setUploadingBefore : setUploadingAfter;
    const setPhotos = isBefore ? setBeforePhotos : setAfterPhotos;
    const current = isBefore ? beforePhotos : afterPhotos;
    if (current.length >= 4) {
      Alert.alert('Limit reached', 'You can upload up to 4 photos.');
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to photos to upload.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 4 - current.length,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('type', type);
      result.assets.forEach((asset, i) => {
        formData.append('photos', {
          uri: asset.uri,
          name: `photo-${i}.jpg`,
          type: 'image/jpeg',
        });
      });
      const url = employeeId
        ? `${API_BASE_URL}/orders/${orderId}/photos?employeeId=${encodeURIComponent(employeeId)}`
        : `${API_BASE_URL}/orders/${orderId}/photos`;
      const res = await fetch(url, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Upload failed');
      }
      const updated = data.data?.servicePhotos;
      if (updated) {
        setBeforePhotos(updated.beforePhotos || []);
        setAfterPhotos(updated.afterPhotos || []);
      }
    } catch (e) {
      console.error('Photo upload error:', e);
      Alert.alert('Upload failed', e.message || 'Could not upload photos.');
    } finally {
      setUploading(false);
    }
  };

  const handleOpenMaps = async () => {
    if (!coords && !address) {
      Alert.alert('No location', 'Customer location not available.');
      return;
    }
    const destination = coords ? `${coords.lat},${coords.lng}` : encodeURIComponent(address);
    const httpUrl = Platform.OS === 'ios'
      ? `http://maps.apple.com/?daddr=${destination}`
      : `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    try {
      await Linking.openURL(httpUrl);
    } catch (error) {
      const geoUrl = coords
        ? `geo:${coords.lat},${coords.lng}?q=${coords.lat},${coords.lng}`
        : `geo:0,0?q=${destination}`;
      try {
        await Linking.openURL(geoUrl);
      } catch (geoError) {
        Alert.alert('Maps unavailable', 'Unable to open maps on this device.');
      }
    }
  };

  const handleSubmit = async () => {
    if (!orderId) {
      Alert.alert('Missing job', 'Unable to find job id for this service.');
      return;
    }
    setSubmitting(true);
    try {
      // Include employeeId in query for employee access
      const url = employeeId 
        ? `${API_BASE_URL}/orders/${orderId}?employeeId=${employeeId}`
        : `${API_BASE_URL}/orders/${orderId}`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Completed', paymentReceived: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        Alert.alert('Submit failed', data.message || 'Unable to submit right now.');
        return;
      }
      await stopBackgroundLocationUpdates();
      await clearActiveOrderId();
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
  const canSubmit =
    orderInProgress &&
    beforePhotos.length >= 1 &&
    afterPhotos.length >= 1 &&
    paymentReceived;

  return (
    <ScrollView
      style={[styles.container, { paddingTop: 24 + insets.top }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar style="dark" />
      <Text style={styles.title}>Start Service</Text>

      {loading && (
        <Text style={styles.sectionHint}>Loading order...</Text>
      )}

      {needsOtp && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Enter start code</Text>
          <Text style={styles.sectionHint}>
            Ask the customer for the 6-digit code shown in their Bookings screen. Enter it below to start the service.
          </Text>
          <TextInput
            style={styles.codeInput}
            value={codeInput}
            onChangeText={(t) => { setCodeInput(t.replace(/\D/g, '').slice(0, 6)); setCodeError(''); }}
            placeholder="000000"
            placeholderTextColor="#9CA3AF"
            keyboardType="number-pad"
            maxLength={6}
          />
          {codeError ? <Text style={styles.codeError}>{codeError}</Text> : null}
          <TouchableOpacity
            style={[styles.startServiceButton, (codeInput.replace(/\D/g, '').length !== 6 || loadingVerify) && styles.startServiceButtonDisabled]}
            onPress={handleVerifyCode}
            disabled={codeInput.replace(/\D/g, '').length !== 6 || loadingVerify}
          >
            <Text style={styles.startServiceButtonText}>
              {loadingVerify ? 'Verifying...' : 'Verify & Start'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {orderInProgress && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer Location</Text>
            <Text style={styles.sectionHint}>{address || 'Address not available'}</Text>
            <TouchableOpacity style={styles.locationButton} onPress={handleOpenMaps}>
              <Text style={styles.locationButtonText}>Open in Maps</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Before Photos</Text>
            <Text style={styles.sectionHint}>Upload up to 4 images ({beforePhotos.length}/4)</Text>
            {beforePhotos.length > 0 && (
              <View style={styles.photoRow}>
                {beforePhotos.map((url, i) => (
                  <Image
                    key={`before-${i}`}
                    source={{ uri: UPLOADS_BASE + url }}
                    style={styles.photoThumb}
                    resizeMode="cover"
                  />
                ))}
              </View>
            )}
            <TouchableOpacity
              style={[styles.uploadButton, uploadingBefore && styles.uploadButtonDisabled]}
              onPress={() => pickAndUploadPhotos('before')}
              disabled={uploadingBefore || beforePhotos.length >= 4}
            >
              {uploadingBefore ? (
                <ActivityIndicator color="#2F5CF4" />
              ) : (
                <Text style={styles.uploadButtonText}>
                  {beforePhotos.length >= 4 ? 'Before photos added' : 'Upload Before Photos'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>After Photos</Text>
            <Text style={styles.sectionHint}>Upload up to 4 images ({afterPhotos.length}/4)</Text>
            {afterPhotos.length > 0 && (
              <View style={styles.photoRow}>
                {afterPhotos.map((url, i) => (
                  <Image
                    key={`after-${i}`}
                    source={{ uri: UPLOADS_BASE + url }}
                    style={styles.photoThumb}
                    resizeMode="cover"
                  />
                ))}
              </View>
            )}
            <TouchableOpacity
              style={[styles.uploadButton, uploadingAfter && styles.uploadButtonDisabled]}
              onPress={() => pickAndUploadPhotos('after')}
              disabled={uploadingAfter || afterPhotos.length >= 4}
            >
              {uploadingAfter ? (
                <ActivityIndicator color="#2F5CF4" />
              ) : (
                <Text style={styles.uploadButtonText}>
                  {afterPhotos.length >= 4 ? 'After photos added' : 'Upload After Photos'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.paymentButton}
            onPress={() => setPaymentReceived(true)}
          >
            <Text style={styles.paymentButtonText}>
              {paymentReceived
                ? 'Payment Received'
                : `Get Payment${amount != null ? ` ₹${amount}` : ''}`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, (!canSubmit || submitting) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit || submitting}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? 'Submitting...' : 'Submit'}
            </Text>
          </TouchableOpacity>
          {!canSubmit && orderInProgress ? (
            <Text style={styles.submitHint}>
              Add at least one before and after photo, tap Get Payment, then submit.
            </Text>
          ) : null}
        </>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  sectionHint: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  photoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  photoThumb: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  uploadButton: {
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  uploadButtonDisabled: {
    opacity: 0.7,
  },
  uploadButtonText: {
    color: '#2F5CF4',
    fontWeight: '700',
    fontSize: 12,
  },
  paymentButton: {
    backgroundColor: '#22C55E',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  paymentButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#2F8CF4',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  submitButtonDisabled: {
    opacity: 0.55,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  submitHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 10,
    textAlign: 'center',
  },
  locationButton: {
    backgroundColor: '#1F2937',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  locationButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  startServiceButton: {
    backgroundColor: '#2F8CF4',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  startServiceButtonDisabled: {
    opacity: 0.6,
  },
  startServiceButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  codeInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 20,
    letterSpacing: 4,
    marginBottom: 8,
  },
  codeError: {
    fontSize: 13,
    color: '#DC2626',
    marginBottom: 8,
  },
  });
