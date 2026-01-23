import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AttendanceScreen() {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(), []);
  const [status, setStatus] = useState('not_marked');
  const [history, setHistory] = useState([
    { id: '1', date: 'Jan 20, 2026', checkIn: '09:12 AM', checkOut: '06:05 PM' },
    { id: '2', date: 'Jan 21, 2026', checkIn: '09:08 AM', checkOut: '06:02 PM' },
    { id: '3', date: 'Jan 22, 2026', checkIn: '09:25 AM', checkOut: '05:58 PM' },
  ]);

  const today = new Date();
  const todayLabel = today.toLocaleDateString('en-IN', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
  const timeLabel = today.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleCheckIn = () => {
    setStatus('checked_in');
  };

  const handleCheckOut = () => {
    setStatus('checked_out');
    const newEntry = {
      id: String(Date.now()),
      date: today.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
      checkIn: '09:30 AM',
      checkOut: timeLabel,
    };
    setHistory(prev => [newEntry, ...prev]);
  };

  return (
    <View style={[styles.container, { paddingTop: 24 + insets.top }]}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Attendance</Text>

      <View style={styles.statusCard}>
        <Text style={styles.dateText}>{todayLabel}</Text>
        <Text style={styles.timeText}>{timeLabel}</Text>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              status === 'checked_in' && styles.statusDotActive,
              status === 'checked_out' && styles.statusDotDone,
            ]}
          />
          <Text style={styles.statusText}>
            {status === 'not_marked' && 'Not marked'}
            {status === 'checked_in' && 'Checked in'}
            {status === 'checked_out' && 'Checked out'}
          </Text>
        </View>
        {status === 'not_marked' ? (
          <TouchableOpacity style={styles.primaryButton} onPress={handleCheckIn}>
            <Text style={styles.primaryButtonText}>Mark Attendance</Text>
          </TouchableOpacity>
        ) : status === 'checked_in' ? (
          <TouchableOpacity style={styles.secondaryButton} onPress={handleCheckOut}>
            <Text style={styles.secondaryButtonText}>Check Out</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.doneBadge}>
            <Text style={styles.doneBadgeText}>Attendance complete</Text>
          </View>
        )}
      </View>

      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>History</Text>
        <Text style={styles.historyHint}>Last 7 days</Text>
      </View>

      <FlatList
        data={history}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.historyList}
        renderItem={({ item }) => (
          <View style={styles.historyItem}>
            <View>
              <Text style={styles.historyDate}>{item.date}</Text>
              <Text style={styles.historyTimes}>
                In {item.checkIn} · Out {item.checkOut}
              </Text>
            </View>
            <Text style={styles.historyStatus}>Present</Text>
          </View>
        )}
      />
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F5F6F8',
      paddingHorizontal: 20,
      paddingTop: 24,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: '#1A1A1A',
      marginBottom: 16,
    },
    statusCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      marginBottom: 20,
    },
    dateText: {
      fontSize: 14,
      color: '#6B7280',
      marginBottom: 4,
    },
    timeText: {
      fontSize: 22,
      fontWeight: '700',
      color: '#1A1A1A',
      marginBottom: 12,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    statusDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#CBD5E1',
      marginRight: 8,
    },
    statusDotActive: {
      backgroundColor: '#F59E0B',
    },
    statusDotDone: {
      backgroundColor: '#22C55E',
    },
    statusText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#1A1A1A',
    },
    primaryButton: {
      backgroundColor: '#2F8CF4',
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 14,
    },
    secondaryButton: {
      backgroundColor: '#EEF2FF',
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    secondaryButtonText: {
      color: '#2F5CF4',
      fontWeight: '700',
      fontSize: 14,
    },
    doneBadge: {
      backgroundColor: '#DCFCE7',
      borderRadius: 12,
      paddingVertical: 10,
      alignItems: 'center',
    },
    doneBadgeText: {
      color: '#15803D',
      fontWeight: '600',
      fontSize: 13,
    },
    historyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    historyTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: '#1A1A1A',
    },
    historyHint: {
      fontSize: 12,
      color: '#6B7280',
    },
    historyList: {
      paddingBottom: 24,
      gap: 12,
    },
    historyItem: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      padding: 14,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    historyDate: {
      fontSize: 14,
      fontWeight: '600',
      color: '#1A1A1A',
      marginBottom: 4,
    },
    historyTimes: {
      fontSize: 12,
      color: '#6B7280',
    },
    historyStatus: {
      fontSize: 12,
      fontWeight: '700',
      color: '#16A34A',
    },
  });
