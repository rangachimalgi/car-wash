import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_BASE_URL } from '../config/api';

export default function JobDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(), []);
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState(null);

  const orderId = route?.params?.orderId;

  useEffect(() => {
    const loadJob = async () => {
      if (!orderId) return;
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/orders/${orderId}`);
        const data = await res.json();
        setJob(data?.data || null);
      } catch (error) {
        console.error('Error fetching job detail:', error);
        setJob(null);
      } finally {
        setLoading(false);
      }
    };
    loadJob();
  }, [orderId]);

  const item = job?.items?.[0];
  const serviceName = item?.service?.name || 'Service';
  const slot = item?.scheduledTimeSlot || 'Time slot';
  const date = item?.scheduledDate ? new Date(item.scheduledDate).toLocaleDateString('en-IN') : 'Date';
  const address = job?.customer?.address || 'Address not provided';
  const customerName = job?.customer?.name || 'Customer';
  const customerPhone = job?.customer?.phone || 'Phone not provided';
  const vehicle = [job?.customer?.vehicleType, job?.customer?.vehicleModel]
    .filter(Boolean)
    .join(' ') || 'Not provided';

  return (
    <View style={[styles.container, { paddingTop: 24 + insets.top }]}>
      <StatusBar style="dark" />
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Job Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color="#2F8CF4" />
          <Text style={styles.loadingText}>Loading job...</Text>
        </View>
      ) : job ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Service</Text>
          <Text style={styles.valueText}>{serviceName}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Schedule</Text>
          <Text style={styles.valueText}>{date}</Text>
          <Text style={styles.valueText}>{slot}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Customer</Text>
          <Text style={styles.valueText}>{customerName}</Text>
          <Text style={styles.valueText}>{customerPhone}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Address</Text>
          <Text style={styles.valueText}>{address}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Vehicle</Text>
          <Text style={styles.valueText}>{vehicle}</Text>
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Job not found.</Text>
        </View>
      )}
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F5F6F8',
      paddingHorizontal: 20,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    backButton: {
      backgroundColor: '#EEF2FF',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
    },
    backText: {
      color: '#2F5CF4',
      fontWeight: '700',
      fontSize: 12,
    },
    headerSpacer: {
      width: 52,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: '#1A1A1A',
    },
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      padding: 16,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: '#6B7280',
      marginBottom: 6,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    valueText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#1A1A1A',
      marginBottom: 6,
    },
    divider: {
      height: 1,
      backgroundColor: '#E2E8F0',
      marginVertical: 10,
    },
    loadingWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    loadingText: {
      color: '#6B7280',
      fontSize: 13,
    },
    emptyCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      padding: 16,
      alignItems: 'center',
    },
    emptyText: {
      color: '#6B7280',
      fontSize: 13,
    },
  });
