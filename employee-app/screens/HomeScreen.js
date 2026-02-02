import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_BASE_URL } from '../config/api';
import { getTodayAttendance } from '../services/attendanceApi';

export default function HomeScreen({ onOpenAttendance, employeeId }) {
  const insets = useSafeAreaInsets();
  const [incomingJob, setIncomingJob] = useState(null);
  const [loadingJob, setLoadingJob] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loadingAttendance, setLoadingAttendance] = useState(true);

  const fetchTodayAttendance = useCallback(async () => {
    try {
      setLoadingAttendance(true);
      const response = await getTodayAttendance();
      if (response.success) {
        setTodayAttendance(response.data);
      }
    } catch (error) {
      console.error('Error fetching today attendance:', error);
      setTodayAttendance(null);
    } finally {
      setLoadingAttendance(false);
    }
  }, []);

  const fetchIncomingJob = async () => {
    if (!employeeId) return;
    setLoadingJob(true);
    try {
      const res = await fetch(`${API_BASE_URL}/jobs/incoming?employeeId=${employeeId}`);
      const data = await res.json();
      const first = data?.data?.[0];
      if (!first) {
        setIncomingJob(null);
      } else {
        const firstItem = first.items?.[0];
        setIncomingJob({
          id: first._id,
          service: firstItem?.service?.name || 'Service',
          customer: first.customer?.name || 'Customer',
          time: firstItem?.scheduledTimeSlot || 'Time slot',
        });
      }
    } catch (error) {
      console.error('Error fetching incoming job:', error);
      setIncomingJob(null);
    } finally {
      setLoadingJob(false);
    }
  };

  useEffect(() => {
    fetchTodayAttendance();
    fetchIncomingJob();
  }, [employeeId, fetchTodayAttendance]);

  // Format time from ISO string
  const formatTime = (isoString) => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const attendanceStatus = todayAttendance?.checkIn ? 'Marked' : 'Not marked';
  const attendanceTime = todayAttendance?.checkIn ? formatTime(todayAttendance.checkIn) : '—';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: 24 + insets.top }]}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar style="dark" />
      <Text style={styles.title}>Employee Home</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Attendance</Text>
        <View style={styles.card}>
          {loadingAttendance ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#2F8CF4" />
              <Text style={styles.cardMeta}>Loading attendance...</Text>
            </View>
          ) : (
            <>
              <View style={styles.row}>
                <Text style={styles.cardTitle}>Today</Text>
                <Text style={[
                  styles.badge,
                  attendanceStatus === 'Marked' && styles.badgeMarked
                ]}>
                  {attendanceStatus}
                </Text>
              </View>
              {todayAttendance?.checkIn ? (
                <Text style={styles.cardMeta}>Marked at: {attendanceTime}</Text>
              ) : (
                <Text style={styles.cardMeta}>Not marked yet</Text>
              )}
              {!todayAttendance?.checkIn && (
                <TouchableOpacity 
                  style={styles.primaryButton} 
                  onPress={() => {
                    onOpenAttendance();
                    // Refresh attendance after opening attendance screen
                    setTimeout(() => {
                      fetchTodayAttendance();
                    }, 1000);
                  }}
                >
                  <Text style={styles.primaryButtonText}>Mark Attendance</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>New Job</Text>
        {incomingJob ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{incomingJob.service}</Text>
            <Text style={styles.cardMeta}>{incomingJob.customer}</Text>
            <Text style={styles.cardMeta}>{incomingJob.time}</Text>
            <View style={styles.row}>
              <Text style={styles.cardHint}>Job ID {incomingJob.id}</Text>
              <TouchableOpacity style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>View Job</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardMeta}>
              {loadingJob ? 'Loading jobs...' : 'No new jobs right now.'}
            </Text>
            <TouchableOpacity style={styles.secondaryButton} onPress={fetchIncomingJob}>
              <Text style={styles.secondaryButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  cardMeta: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
  },
  cardHint: {
    fontSize: 12,
    color: '#6B7280',
  },
  badge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeMarked: {
    color: '#15803D',
    backgroundColor: '#DCFCE7',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: '#2F8CF4',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  secondaryButton: {
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  secondaryButtonText: {
    color: '#2F5CF4',
    fontWeight: '700',
    fontSize: 12,
  },
});
