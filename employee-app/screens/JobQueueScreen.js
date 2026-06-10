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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../services/api';
import { useJobNotifications } from '../context/JobNotificationsContext';
import JobBookingRow, { jobListStyles } from '../components/JobBookingRow';
import {
  mapOrderToBooking,
  sortBookingsByDate,
} from '../utils/jobBookingHelpers';

const BLUE = '#2563EB';
const BLUE_LIGHT = '#EFF6FF';
const RED = '#DC2626';
const RED_LIGHT = '#FEF2F2';

const SECTION_THEMES = {
  assigned: {
    accent: '#2563EB',
    titleColor: '#1E40AF',
    pillBg: '#EFF6FF',
    pillText: '#3B82F6',
    border: '#E2E8F0',
    footerBorder: '#F1F5F9',
    badgeBg: '#F8FAFC',
    badgeBorder: '#E2E8F0',
    badgeText: '#475569',
    primaryBtn: '#2563EB',
    outlineBorder: '#E2E8F0',
    outlineBg: '#FFFFFF',
    outlineText: '#475569',
    mutedBg: '#F8FAFC',
    mutedText: '#94A3B8',
  },
  inProgress: {
    accent: '#D97706',
    titleColor: '#B45309',
    pillBg: '#FFFBEB',
    pillText: '#D97706',
    border: '#E2E8F0',
    footerBorder: '#F1F5F9',
    badgeBg: '#F8FAFC',
    badgeBorder: '#E2E8F0',
    badgeText: '#475569',
    primaryBtn: '#D97706',
    outlineBorder: '#E2E8F0',
    outlineBg: '#FFFFFF',
    outlineText: '#475569',
    mutedBg: '#F8FAFC',
    mutedText: '#94A3B8',
  },
  completed: {
    accent: '#16A34A',
    titleColor: '#15803D',
    pillBg: '#F0FDF4',
    pillText: '#16A34A',
    border: '#E2E8F0',
    footerBorder: '#F1F5F9',
    badgeBg: '#F8FAFC',
    badgeBorder: '#E2E8F0',
    badgeText: '#475569',
    primaryBtn: '#16A34A',
    outlineBorder: '#E2E8F0',
    outlineBg: '#FFFFFF',
    outlineText: '#475569',
    mutedBg: '#F8FAFC',
    mutedText: '#94A3B8',
  },
};

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
          tintColor={BLUE}
          colors={[BLUE]}
        />
      }
    >
      <StatusBar style="dark" />
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="arrow-left" size={18} color={BLUE} />
        </TouchableOpacity>
        <Text style={styles.title}>Job Queue</Text>
        <TouchableOpacity
          style={styles.reportButton}
          onPress={() => navigation.navigate('ReportProblem', { employeeId })}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="alert-circle-outline" size={16} color={RED} />
          <Text style={styles.reportButtonText}>Report</Text>
        </TouchableOpacity>
      </View>

      <JobSection
        title="Assigned"
        theme={SECTION_THEMES.assigned}
        count={incomingBookings.length}
        loading={initialLoading}
        emptyText="No new jobs right now."
        isEmpty={incomingBookings.length === 0}
      >
        {incomingBookings.map((booking, index) => (
          <View key={booking.id}>
            <JobBookingRow
              booking={booking}
              theme={SECTION_THEMES.assigned}
              isLast
              showPrice
              onPress={() => openDetail(booking.id)}
            />
            <ActionFooter theme={SECTION_THEMES.assigned}>
              <ActionButton
                theme={SECTION_THEMES.assigned}
                variant="muted"
                label="Decline"
                onPress={() => handleDecline(booking.id)}
              />
              <ActionButton
                theme={SECTION_THEMES.assigned}
                variant="outline"
                label="View Job"
                onPress={() => openDetail(booking.id)}
              />
              <ActionButton
                theme={SECTION_THEMES.assigned}
                variant="outline"
                label="Add-ons"
                onPress={() =>
                  navigation?.navigate('UpsellPitch', { orderId: booking.id, employeeId })
                }
              />
              <ActionButton
                theme={SECTION_THEMES.assigned}
                variant="primary"
                label="Accept"
                onPress={() => handleAccept(booking.id)}
              />
            </ActionFooter>
            {index < incomingBookings.length - 1 && (
              <View style={[styles.itemDivider, { backgroundColor: SECTION_THEMES.assigned.footerBorder }]} />
            )}
          </View>
        ))}
      </JobSection>

      <JobSection
        title="In Progress"
        theme={SECTION_THEMES.inProgress}
        count={queueBookings.length}
        loading={initialLoading}
        emptyText="No jobs in queue."
        isEmpty={queueBookings.length === 0}
      >
        {queueBookings.map((booking, index) => (
          <View key={booking.id}>
            <JobBookingRow
              booking={booking}
              theme={SECTION_THEMES.inProgress}
              isLast
              showPrice
              onPress={() => openDetail(booking.id)}
            />
            <ActionFooter theme={SECTION_THEMES.inProgress}>
              <ActionButton
                theme={SECTION_THEMES.inProgress}
                variant="outline"
                label="View Job"
                onPress={() => openDetail(booking.id)}
              />
              <ActionButton
                theme={SECTION_THEMES.inProgress}
                variant="primary"
                label="Continue"
                onPress={() =>
                  navigation?.navigate('BeforePhotos', { orderId: booking.id, employeeId })
                }
              />
              <ActionButton
                theme={SECTION_THEMES.inProgress}
                variant="outline"
                label="Add-ons"
                onPress={() =>
                  navigation?.navigate('UpsellPitch', { orderId: booking.id, employeeId })
                }
              />
            </ActionFooter>
            {index < queueBookings.length - 1 && (
              <View style={[styles.itemDivider, { backgroundColor: SECTION_THEMES.inProgress.footerBorder }]} />
            )}
          </View>
        ))}
      </JobSection>

      <JobSection
        title="Completed"
        theme={SECTION_THEMES.completed}
        count={historyBookings.length}
        loading={initialLoading}
        emptyText="No history yet."
        isEmpty={historyBookings.length === 0}
      >
        {historyBookings.map((booking, index) => (
          <JobBookingRow
            key={booking.id}
            booking={booking}
            theme={SECTION_THEMES.completed}
            isLast={index === historyBookings.length - 1}
            showPrice
            onPress={() => openDetail(booking.id)}
          />
        ))}
      </JobSection>
    </ScrollView>
  );
}

function ActionFooter({ theme, children }) {
  return (
    <View style={[jobListStyles.cardFooter, { borderTopColor: theme.footerBorder }]}>
      <View style={jobListStyles.actionRow}>{children}</View>
    </View>
  );
}

function ActionButton({ theme, variant, label, onPress }) {
  const isPrimary = variant === 'primary';
  const isMuted = variant === 'muted';

  return (
    <TouchableOpacity
      style={[
        jobListStyles.actionBtn,
        isPrimary && { backgroundColor: theme.primaryBtn },
        isMuted && { backgroundColor: theme.mutedBg },
        variant === 'outline' && {
          backgroundColor: theme.outlineBg,
          borderWidth: 1,
          borderColor: theme.outlineBorder,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text
        style={[
          jobListStyles.actionBtnText,
          isPrimary && { color: '#FFFFFF' },
          isMuted && { color: theme.mutedText },
          variant === 'outline' && { color: theme.outlineText },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function JobSection({ title, theme, count, loading, emptyText, isEmpty, children }) {
  return (
    <View style={sectionStyles.section}>
      <View style={sectionStyles.header}>
        <View style={sectionStyles.titleRow}>
          <View style={[sectionStyles.accentDot, { backgroundColor: theme.accent }]} />
          <Text style={[sectionStyles.title, { color: theme.titleColor }]}>{title}</Text>
        </View>
        <View style={[sectionStyles.countPill, { backgroundColor: theme.pillBg }]}>
          <Text style={[sectionStyles.countText, { color: theme.pillText }]}>{count}</Text>
        </View>
      </View>

      {loading && isEmpty ? (
        <View style={[jobListStyles.listEmpty, { borderColor: theme.border }]}>
          <ActivityIndicator size="small" color={theme.accent} />
        </View>
      ) : isEmpty ? (
        <View style={[jobListStyles.listEmpty, { borderColor: theme.border }]}>
          <Text style={jobListStyles.listEmptyText}>{emptyText}</Text>
        </View>
      ) : (
        <View style={[jobListStyles.listGroup, { borderColor: theme.border }]}>
          {children}
        </View>
      )}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  countPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  countText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

const createStyles = () =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F8FAFC',
    },
    scrollContent: {
      paddingHorizontal: 16,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 18,
    },
    backButton: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: BLUE_LIGHT,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      flex: 1,
      fontSize: 22,
      fontWeight: '700',
      color: '#0F172A',
      letterSpacing: -0.3,
    },
    reportButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: RED_LIGHT,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#FECACA',
      paddingHorizontal: 10,
      paddingVertical: 7,
    },
    reportButtonText: {
      fontSize: 12,
      fontWeight: '700',
      color: RED,
    },
    itemDivider: {
      height: 1,
      marginHorizontal: 12,
    },
  });
