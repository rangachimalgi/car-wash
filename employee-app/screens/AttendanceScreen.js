import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { markCheckIn, getTodayAttendance, getAttendanceHistory } from '../services/attendanceApi.js';

export default function AttendanceScreen() {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(), []);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAttendance, setMarkingAttendance] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  // Fetch today's attendance and history
  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const [todayData, historyData] = await Promise.all([
        getTodayAttendance(),
        getAttendanceHistory(30, 1),
      ]);
      
      if (todayData.success) {
        setTodayAttendance(todayData.data);
      }
      
      if (historyData.success) {
        setHistory(historyData.data || []);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      Alert.alert('Error', error.message || 'Failed to fetch attendance');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handleMarkAttendance = async () => {
    if (markingAttendance) return;
    
    try {
      setMarkingAttendance(true);
      const response = await markCheckIn();
      
      if (response.success) {
        setTodayAttendance(response.data);
        // Refresh history to show today's entry
        const historyData = await getAttendanceHistory(30, 1);
        if (historyData.success) {
          setHistory(historyData.data || []);
        }
        Alert.alert('Success', 'Attendance marked successfully!');
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      Alert.alert('Error', error.message || 'Failed to mark attendance');
    } finally {
      setMarkingAttendance(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAttendance();
  }, [fetchAttendance]);

  // Determine status
  const getStatus = () => {
    if (!todayAttendance || !todayAttendance.checkIn) {
      return 'not_marked';
    }
    return 'marked';
  };

  const status = getStatus();

  // Format time from ISO string
  const formatTime = (isoString) => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format date for history
  const formatHistoryDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get status text
  const getStatusText = () => {
    if (status === 'not_marked') return 'Not marked';
    return 'Attendance marked';
  };

  // Get status dot color
  const getStatusDotStyle = () => {
    if (status === 'not_marked') return styles.statusDot;
    return styles.statusDotDone;
  };

  if (loading && !todayAttendance) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: 24 + insets.top }]}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#2F8CF4" />
        <Text style={styles.loadingText}>Loading attendance...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: 24 + insets.top }]}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Attendance</Text>

      <View style={styles.statusCard}>
        <Text style={styles.dateText}>{todayLabel}</Text>
        <Text style={styles.timeText}>{timeLabel}</Text>
        <View style={styles.statusRow}>
          <View style={getStatusDotStyle()} />
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
        
        {todayAttendance?.checkIn && (
          <View style={styles.timeInfo}>
            <Text style={styles.timeInfoLabel}>Marked at: {formatTime(todayAttendance.checkIn)}</Text>
          </View>
        )}

        {status === 'not_marked' && (
          <TouchableOpacity 
            style={[styles.primaryButton, markingAttendance && styles.primaryButtonDisabled]} 
            onPress={handleMarkAttendance}
            disabled={markingAttendance}
          >
            {markingAttendance ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Mark Attendance</Text>
            )}
          </TouchableOpacity>
        )}
        
        {status === 'marked' && (
          <View style={styles.doneBadge}>
            <Text style={styles.doneBadgeText}>Attendance marked for today</Text>
          </View>
        )}
      </View>

      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>History</Text>
        <Text style={styles.historyHint}>Last 30 days</Text>
      </View>

      <FlatList
        data={history}
        keyExtractor={item => item._id || String(item.date)}
        contentContainerStyle={styles.historyList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <View style={styles.historyItem}>
            <View>
              <Text style={styles.historyDate}>{formatHistoryDate(item.date)}</Text>
              <Text style={styles.historyTimes}>
                Marked at: {formatTime(item.checkIn)}
              </Text>
            </View>
            <Text style={styles.historyStatus}>Present</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No attendance history</Text>
          </View>
        }
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
    historyStatusLate: {
      color: '#F59E0B',
    },
    historyStatusAbsent: {
      color: '#EF4444',
    },
    centerContent: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: '#6B7280',
    },
    primaryButtonDisabled: {
      opacity: 0.6,
    },
    secondaryButton: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#2F8CF4',
    },
    secondaryButtonText: {
      color: '#2F8CF4',
      fontWeight: '700',
      fontSize: 14,
    },
    secondaryButtonDisabled: {
      opacity: 0.6,
    },
    timeInfo: {
      marginBottom: 16,
      gap: 4,
    },
    timeInfoLabel: {
      fontSize: 13,
      color: '#6B7280',
    },
    emptyContainer: {
      padding: 24,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 14,
      color: '#6B7280',
    },
  });
