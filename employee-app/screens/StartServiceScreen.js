import React, { useEffect, useState } from 'react';
import { Alert, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { API_BASE_URL } from '../config/api';
import {
  clearActiveOrderId,
  saveActiveOrderId,
  startBackgroundLocationUpdates,
  stopBackgroundLocationUpdates,
} from '../locationTask';

export default function StartServiceScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [paymentReceived, setPaymentReceived] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState(null);
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState(null);
  const orderId = route?.params?.orderId;
  const employeeId = route?.params?.employeeId;

  useEffect(() => {
    const loadAmount = async () => {
      if (!orderId) return;
      try {
        // Include employeeId in query if available
        const url = employeeId 
          ? `${API_BASE_URL}/orders/${orderId}?employeeId=${employeeId}`
          : `${API_BASE_URL}/orders/${orderId}`;
        const res = await fetch(url);
        const data = await res.json();
        if (res.ok && data?.data) {
          if (data.data.totalAmount != null) {
            setAmount(data.data.totalAmount);
          }
          setAddress(data.data.customer?.address || '');
          const lat = data.data.customer?.latitude;
          const lng = data.data.customer?.longitude;
          if (typeof lat === 'number' && typeof lng === 'number') {
            setCoords({ lat, lng });
          } else {
            setCoords(null);
          }

          const currentStatus = data.data.status;
          if (!['In Progress', 'Completed', 'Cancelled'].includes(currentStatus)) {
            try {
              // Include employeeId in query for employee access
              const url = employeeId 
                ? `${API_BASE_URL}/orders/${orderId}?employeeId=${employeeId}`
                : `${API_BASE_URL}/orders/${orderId}`;
              const updateRes = await fetch(url, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'In Progress' }),
              });
              const updateData = await updateRes.json();
              if (!updateRes.ok || !updateData.success) {
                console.error('Error marking service in progress:', updateData.message);
              }
            } catch (error) {
              console.error('Error marking service in progress:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error loading order amount:', error);
      }
    };
    loadAmount();
  }, [orderId]);

  useEffect(() => {
    let intervalId;
    const startLocationUpdates = async () => {
      if (!orderId) return;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Location permission not granted');
          return;
        }

        const sendLocation = async () => {
          try {
            const position = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            const { latitude, longitude } = position.coords || {};
            if (typeof latitude !== 'number' || typeof longitude !== 'number') return;
            // Include employeeId in query for employee access
            const url = employeeId 
              ? `${API_BASE_URL}/orders/${orderId}/employee-location?employeeId=${employeeId}`
              : `${API_BASE_URL}/orders/${orderId}/employee-location`;
            await fetch(url, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ latitude, longitude }),
            });
          } catch (error) {
            console.error('Error updating live location:', error);
          }
        };

        await sendLocation();
        intervalId = setInterval(sendLocation, 20000);
      } catch (error) {
        console.error('Error requesting location permission:', error);
      }
    };

    startLocationUpdates();
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [orderId]);

  useEffect(() => {
    const startBackgroundTracking = async () => {
      if (!orderId) return;
      try {
        const { status } = await Location.requestBackgroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Background location permission not granted');
          return;
        }
        await saveActiveOrderId(orderId, employeeId);
        await startBackgroundLocationUpdates();
      } catch (error) {
        console.error('Error starting background tracking:', error);
      }
    };

    startBackgroundTracking();
  }, [orderId]);

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
        body: JSON.stringify({ status: 'Completed' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        Alert.alert('Submit failed', data.message || 'Unable to submit right now.');
        return;
      }
      await stopBackgroundLocationUpdates();
      await clearActiveOrderId();
      Alert.alert('Submitted', 'Service marked as completed.');
      navigation.goBack();
    } catch (error) {
      console.error('Submit service error:', error);
      Alert.alert('Submit failed', 'Unable to submit right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: 24 + insets.top }]}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Start Service</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Location</Text>
        <Text style={styles.sectionHint}>{address || 'Address not available'}</Text>
        <TouchableOpacity style={styles.locationButton} onPress={handleOpenMaps}>
          <Text style={styles.locationButtonText}>Open in Maps</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Before Photos</Text>
        <Text style={styles.sectionHint}>Upload up to 4 images</Text>
        <TouchableOpacity style={styles.uploadButton}>
          <Text style={styles.uploadButtonText}>Upload Before Photos</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>After Photos</Text>
        <Text style={styles.sectionHint}>Upload up to 4 images</Text>
        <TouchableOpacity style={styles.uploadButton}>
          <Text style={styles.uploadButtonText}>Upload After Photos</Text>
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
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={submitting}
      >
        <Text style={styles.submitButtonText}>
          {submitting ? 'Submitting...' : 'Submit'}
        </Text>
      </TouchableOpacity>

      
    </View>
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
  uploadButton: {
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
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
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
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
});
