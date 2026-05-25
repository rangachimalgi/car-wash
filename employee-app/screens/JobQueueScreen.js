import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import { useJobNotifications } from '../context/JobNotificationsContext';
import JobBookingRow, { jobListStyles } from '../components/JobBookingRow';
import {
  mapOrderToBooking,
  sortBookingsByDate,
} from '../utils/jobBookingHelpers';

export default function JobQueueScreen({ employeeId, navigation }) {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(), []);
  const { refreshJobCount } = useJobNotifications();
  const [incomingJobs, setIncomingJobs] = useState([]);
  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobs = useCallback(
    async (mode = 'initial') => {
      if (!employeeId) return;
      if (mode === 'pull') setRefreshing(true);
      else if (mode === 'initial') setInitialLoading(true);

      try {
        const [incomingRes, queueRes, historyRes] = await Promise.all([
          api.get(`/jobs/incoming?employeeId=${employeeId}`),
          api.get(`/jobs/queue?employeeId=${employeeId}`),
          api.get(`/jobs/history?employeeId=${employeeId}`),
        ]);
        setIncomingJobs(incomingRes.data.data || []);
        setQueue(queueRes.data.data || []);
        setHistory(historyRes.data.data || []);
        refreshJobCount();
      } catch (error) {
        console.error('Error fetching jobs:', error);
      } finally {
        setInitialLoading(false);
        setRefreshing(false);
      }
    },
    [employeeId, refreshJobCount]
  );

  const onRefresh = useCallback(() => {
    fetchJobs('pull');
  }, [fetchJobs]);

  useEffect(() => {
    fetchJobs('initial');
  }, [fetchJobs]);

  useFocusEffect(
    useCallback(() => {
      fetchJobs('silent');
    }, [fetchJobs])
  );

  const handleAccept = async (orderId) => {
    try {
      await api.post(`/jobs/${orderId}/accept`, { employeeId });
      fetchJobs('silent');
    } catch (error) {
      console.error('Error accepting job:', error);
    }
  };

  const handleDecline = async (orderId) => {
    try {
      await api.post(`/jobs/${orderId}/decline`, { employeeId });
      fetchJobs('silent');
    } catch (error) {
      console.error('Error declining job:', error);
    }
  };

  const incomingBookings = useMemo(
    () => sortBookingsByDate(incomingJobs.map((o) => mapOrderToBooking(o, employeeId))),
    [incomingJobs, employeeId]
  );

  const queueBookings = useMemo(
    () => sortBookingsByDate(queue.map((o) => mapOrderToBooking(o, employeeId))),
    [queue, employeeId]
  );

  const historyBookings = useMemo(
    () =>
      sortBookingsByDate(history.map((o) => mapOrderToBooking(o, employeeId))).reverse(),
    [history, employeeId]
  );

  const openDetail = (orderId) => {
    navigation?.navigate('JobDetail', { orderId, employeeId });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: 24 + insets.top, paddingBottom: 24 + insets.bottom },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#1A1A1A"
          colors={['#1A1A1A']}
        />
      }
    >
      <StatusBar style="dark" />
      <Text style={styles.title}>Job Queue</Text>

      <JobSection
        title="New Jobs"
        count={incomingBookings.length}
        loading={initialLoading}
        emptyText="No new jobs right now."
        isEmpty={incomingBookings.length === 0}
      >
        {incomingBookings.map((booking, index) => (
          <View key={booking.id}>
            <JobBookingRow
              booking={booking}
              isLast
              showPrice
              onPress={() => openDetail(booking.id)}
            />
            <View style={jobListStyles.cardFooter}>
              <View style={jobListStyles.actionRow}>
                <TouchableOpacity
                  style={jobListStyles.btnMuted}
                  onPress={() => handleDecline(booking.id)}
                >
                  <Text style={jobListStyles.btnMutedText}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={jobListStyles.btnOutline}
                  onPress={() => openDetail(booking.id)}
                >
                  <Text style={jobListStyles.btnOutlineText}>View Job</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={jobListStyles.btnOutline}
                  onPress={() =>
                    navigation?.navigate('UpsellPitch', { orderId: booking.id, employeeId })
                  }
                >
                  <Text style={jobListStyles.btnOutlineText}>Add-ons</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={jobListStyles.btnPrimary}
                  onPress={() => handleAccept(booking.id)}
                >
                  <Text style={jobListStyles.btnPrimaryText}>Accept</Text>
                </TouchableOpacity>
              </View>
            </View>
            {index < incomingBookings.length - 1 && <View style={styles.itemDivider} />}
          </View>
        ))}
      </JobSection>

      <JobSection
        title="In Queue"
        count={queueBookings.length}
        loading={initialLoading}
        emptyText="No jobs in queue."
        isEmpty={queueBookings.length === 0}
      >
        {queueBookings.map((booking, index) => (
          <View key={booking.id}>
            <JobBookingRow
              booking={booking}
              isLast
              showPrice
              onPress={() => openDetail(booking.id)}
            />
            <View style={jobListStyles.cardFooter}>
              <View style={jobListStyles.actionRow}>
                <TouchableOpacity
                  style={jobListStyles.btnOutline}
                  onPress={() => openDetail(booking.id)}
                >
                  <Text style={jobListStyles.btnOutlineText}>View Job</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={jobListStyles.btnPrimary}
                  onPress={() =>
                    navigation?.navigate('StartService', { orderId: booking.id, employeeId })
                  }
                >
                  <Text style={jobListStyles.btnPrimaryText}>Start Service</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={jobListStyles.btnOutline}
                  onPress={() =>
                    navigation?.navigate('UpsellPitch', { orderId: booking.id, employeeId })
                  }
                >
                  <Text style={jobListStyles.btnOutlineText}>Add-ons</Text>
                </TouchableOpacity>
              </View>
            </View>
            {index < queueBookings.length - 1 && <View style={styles.itemDivider} />}
          </View>
        ))}
      </JobSection>

      <JobSection
        title="History"
        count={historyBookings.length}
        loading={initialLoading}
        emptyText="No history yet."
        isEmpty={historyBookings.length === 0}
      >
        {historyBookings.map((booking, index) => (
          <JobBookingRow
            key={booking.id}
            booking={booking}
            isLast={index === historyBookings.length - 1}
            showPrice
            onPress={() => openDetail(booking.id)}
          />
        ))}
      </JobSection>
    </ScrollView>
  );
}

function JobSection({ title, count, loading, emptyText, isEmpty, children }) {
  return (
    <View style={sectionStyles.section}>
      <View style={sectionStyles.header}>
        <Text style={sectionStyles.title}>{title}</Text>
        <View style={sectionStyles.countPill}>
          <Text style={sectionStyles.countText}>{count}</Text>
        </View>
      </View>

      {loading && isEmpty ? (
        <View style={jobListStyles.listEmpty}>
          <ActivityIndicator size="small" color="#1A1A1A" />
        </View>
      ) : isEmpty ? (
        <View style={jobListStyles.listEmpty}>
          <Text style={jobListStyles.listEmptyText}>{emptyText}</Text>
        </View>
      ) : (
        <View style={jobListStyles.listGroup}>{children}</View>
      )}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  countPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
});

const createStyles = () =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F6F7FB',
    },
    scrollContent: {
      paddingHorizontal: 20,
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: '#1A1A1A',
      letterSpacing: -0.5,
      marginBottom: 20,
    },
    itemDivider: {
      height: 1,
      backgroundColor: '#F3F4F6',
      marginHorizontal: 14,
    },
  });
