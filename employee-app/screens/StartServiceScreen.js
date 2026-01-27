import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_BASE_URL } from '../config/api';

export default function StartServiceScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [paymentReceived, setPaymentReceived] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const orderId = route?.params?.orderId;

  const handleSubmit = async () => {
    if (!orderId) {
      Alert.alert('Missing job', 'Unable to find job id for this service.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Completed' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        Alert.alert('Submit failed', data.message || 'Unable to submit right now.');
        return;
      }
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
          {paymentReceived ? 'Payment Received' : 'Get Payment'}
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
});
