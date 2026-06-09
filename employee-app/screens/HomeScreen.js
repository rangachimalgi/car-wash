import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../services/api';
import {
  getAssignment,
  getScheduledDate,
  isToday,
  mapOrderToBooking,
  sortBookingsByDate,
} from '../utils/jobBookingHelpers';

const STAT_THEMES = {
  today: {
    bg: '#EFF6FF',
    border: '#BFDBFE',
    accent: '#2563EB',
    iconBg: '#2563EB',
  },
  pending: {
    bg: '#FFF7ED',
    border: '#FED7AA',
    accent: '#EA580C',
    iconBg: '#EA580C',
  },
  completed: {
    bg: '#F0FDF4',
    border: '#BBF7D0',
    accent: '#16A34A',
    iconBg: '#16A34A',
  },
  earnings: {
    bg: '#F5F3FF',
    border: '#DDD6FE',
    accent: '#7C3AED',
    iconBg: '#7C3AED',
  },
};

const BOOKING_THEMES = [
  { bg: '#EFF6FF', accent: '#2563EB', badgeBg: '#DBEAFE', badgeText: '#1D4ED8' },
  { bg: '#F0FDF4', accent: '#16A34A', badgeBg: '#DCFCE7', badgeText: '#15803D' },
  { bg: '#FFF7ED', accent: '#EA580C', badgeBg: '#FFEDD5', badgeText: '#C2410C' },
];

const cardShadow = Platform.select({
  ios: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  android: { elevation: 2 },
});

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 22) return 'Good evening';
  return 'Hello';
}

function getInitials(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return '?';
}

function formatInr(amount) {
  const n = Number(amount) || 0;
  return `₹${n.toLocaleString('en-IN')}`;
}

function buildUpcomingBookings(incoming, queue, limit = 3) {
  const byId = new Map();
  for (const order of [...incoming, ...queue]) {
    if (order?._id) byId.set(String(order._id), order);
  }

  return sortBookingsByDate([...byId.values()].map((o) => mapOrderToBooking(o))).slice(0, limit);
}

function computeRating(history, employeeId) {
  const rated = history.filter((order) => {
    const assignment = getAssignment(order, employeeId);
    const r = order?.rating;
    const hasRating = typeof r === 'number' && r >= 1 && r <= 5;
    return assignment?.status === 'completed' && hasRating;
  });

  if (rated.length === 0) {
    return { average: null, count: 0 };
  }

  const sum = rated.reduce((s, order) => s + order.rating, 0);
  return {
    average: Math.round((sum / rated.length) * 10) / 10,
    count: rated.length,
  };
}

function computeStats({ incoming, queue, history, employeeId, totalEarnings }) {
  const pendingJobs = incoming.length;
  const completedJobs = history.filter(
    (order) => getAssignment(order, employeeId)?.status === 'completed'
  ).length;

  const todayIds = new Set();
  for (const order of [...incoming, ...queue]) {
    if (isToday(getScheduledDate(order))) {
      todayIds.add(String(order._id));
    }
  }
  for (const order of history) {
    const assignment = getAssignment(order, employeeId);
    if (assignment?.status === 'completed' && isToday(assignment.completedAt || getScheduledDate(order))) {
      todayIds.add(String(order._id));
    }
  }

  return {
    todaysJobs: todayIds.size,
    pendingJobs,
    completedJobs,
    totalEarnings,
  };
}

export default function HomeScreen({ navigation, employeeId }) {
  const insets = useSafeAreaInsets();
  const [employeeName, setEmployeeName] = useState('');
  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState({
    todaysJobs: 0,
    pendingJobs: 0,
    completedJobs: 0,
    totalEarnings: 0,
  });
  const [rating, setRating] = useState({ average: null, count: 0 });
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const greeting = getTimeGreeting();
  const displayName = (employeeName || '').trim() || 'there';

  const loadStats = useCallback(async ({ silent = false } = {}) => {
    if (!employeeId) return;
    if (!silent) setStatsLoading(true);
    try {
      const [incomingRes, queueRes, historyRes, earningsRes] = await Promise.all([
        api.get(`/jobs/incoming?employeeId=${employeeId}`),
        api.get(`/jobs/queue?employeeId=${employeeId}`),
        api.get(`/jobs/history?employeeId=${employeeId}`),
        api.get('/employee-incentives/me'),
      ]);

      const incoming = incomingRes.data?.data || [];
      const queue = queueRes.data?.data || [];
      const history = historyRes.data?.data || [];
      const totalEarnings = Number(earningsRes.data?.data?.totalIncentives) || 0;

      setStats(computeStats({ incoming, queue, history, employeeId, totalEarnings }));
      setRating(computeRating(history, employeeId));
      setUpcomingBookings(buildUpcomingBookings(incoming, queue));
    } catch (error) {
      console.error('Error loading home stats:', error);
    } finally {
      if (!silent) setStatsLoading(false);
    }
  }, [employeeId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const name = await AsyncStorage.getItem('employeeName');
      setEmployeeName(name || '');
      await loadStats({ silent: true });
    } catch (error) {
      console.error('Error refreshing home:', error);
    } finally {
      setRefreshing(false);
    }
  }, [loadStats]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const name = await AsyncStorage.getItem('employeeName');
          if (active) setEmployeeName(name || '');
        } catch {
          if (active) setEmployeeName('');
        }
      })();
      loadStats();
      return () => {
        active = false;
      };
    }, [loadStats])
  );

  const displayValue = (value, isCurrency = false) => {
    if (statsLoading) return '—';
    return isCurrency ? formatInr(value) : String(value);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: 16 + insets.top, paddingBottom: 24 + insets.bottom + 88 },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#2563EB"
          colors={['#2563EB']}
        />
      }
    >
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>{greeting}, 👋</Text>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.subtitle}>Here's your today overview</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.notifButton} activeOpacity={0.8}>
          <MaterialCommunityIcons name="bell-outline" size={22} color="#0F172A" />
          {stats.pendingJobs > 0 ? <View style={styles.notifDot} /> : null}
        </TouchableOpacity>
      </View>

      {statsLoading ? (
        <ActivityIndicator style={styles.statsLoader} size="small" color="#2563EB" />
      ) : null}

      <View style={styles.statsGrid}>
        <StatCard
          title="Today's Jobs"
          value={displayValue(stats.todaysJobs)}
          icon="clipboard-text-outline"
          theme={STAT_THEMES.today}
          onPress={() => navigation.navigate('Jobs')}
        />
        <StatCard
          title="Pending Jobs"
          value={displayValue(stats.pendingJobs)}
          icon="timer-sand"
          theme={STAT_THEMES.pending}
          onPress={() => navigation.navigate('Jobs')}
        />
        <StatCard
          title="Completed Jobs"
          value={displayValue(stats.completedJobs)}
          icon="check-circle-outline"
          theme={STAT_THEMES.completed}
          onPress={() => navigation.navigate('Jobs')}
        />
        <StatCard
          title="Total Earnings"
          value={displayValue(stats.totalEarnings, true)}
          icon="wallet-outline"
          theme={STAT_THEMES.earnings}
          onPress={() => navigation.navigate('Earnings')}
        />
      </View>

      <RatingCard average={rating.average} reviewCount={rating.count} loading={statsLoading} />

      <UpcomingBookingsSection
        bookings={upcomingBookings}
        loading={statsLoading}
        onViewAll={() => navigation.navigate('Jobs')}
        onPressBooking={(orderId) =>
          navigation.navigate('JobDetail', { orderId, employeeId })
        }
      />
    </ScrollView>
  );
}

function UpcomingBookingsSection({ bookings, loading, onViewAll, onPressBooking }) {
  return (
    <View style={styles.upcomingSection}>
      <View style={styles.upcomingHeader}>
        <Text style={styles.upcomingTitle}>Upcoming Bookings</Text>
        <TouchableOpacity style={styles.upcomingViewAllBtn} onPress={onViewAll} activeOpacity={0.7}>
          <Text style={styles.upcomingViewAll}>View all</Text>
          <MaterialCommunityIcons name="chevron-right" size={18} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.upcomingEmpty}>
          <ActivityIndicator size="small" color="#2563EB" />
        </View>
      ) : bookings.length === 0 ? (
        <View style={styles.upcomingEmpty}>
          <Text style={styles.upcomingEmptyText}>No upcoming jobs right now.</Text>
        </View>
      ) : (
        <View style={styles.upcomingList}>
          {bookings.map((booking, index) => (
            <ColoredBookingCard
              key={booking.id}
              booking={booking}
              theme={BOOKING_THEMES[index % BOOKING_THEMES.length]}
              onPress={() => onPressBooking(booking.id)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function ColoredBookingCard({ booking, theme, onPress }) {
  const badge = booking.dateLabel || 'Scheduled';

  return (
    <TouchableOpacity style={styles.bookingCard} onPress={onPress} activeOpacity={0.88}>
      <View style={[styles.bookingIconWrap, { backgroundColor: theme.bg }]}>
        <MaterialCommunityIcons name={booking.icon} size={22} color={theme.accent} />
      </View>
      <View style={styles.bookingBody}>
        <Text style={styles.bookingService} numberOfLines={1}>
          {booking.service}
        </Text>
        <View style={styles.bookingMetaRow}>
          <MaterialCommunityIcons name="clock-outline" size={13} color="#94A3B8" />
          <Text style={styles.bookingMeta} numberOfLines={1}>
            {booking.time}
          </Text>
        </View>
        <View style={styles.bookingMetaRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={13} color="#94A3B8" />
          <Text style={styles.bookingMeta} numberOfLines={1}>
            {booking.location}
          </Text>
        </View>
      </View>
      <View style={[styles.bookingBadge, { backgroundColor: theme.badgeBg }]}>
        <Text style={[styles.bookingBadgeText, { color: theme.badgeText }]}>{badge}</Text>
      </View>
    </TouchableOpacity>
  );
}

function StarRow({ rating }) {
  const value = Number(rating) || 0;
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((i) => {
        let icon = 'star-outline';
        if (value >= i) icon = 'star';
        else if (value >= i - 0.5) icon = 'star-half-full';
        return (
          <MaterialCommunityIcons
            key={i}
            name={icon}
            size={18}
            color={value >= i - 0.5 ? '#F59E0B' : '#E5E7EB'}
          />
        );
      })}
    </View>
  );
}

function RatingCard({ average, reviewCount, loading }) {
  const hasRating = average != null && reviewCount > 0;
  const scoreText = loading ? '—' : hasRating ? average.toFixed(1) : '—';
  const reviewsText = loading
    ? 'Loading…'
    : reviewCount === 1
      ? '(1 review)'
      : `(${reviewCount} reviews)`;

  return (
    <View style={styles.ratingCard}>
      <View style={styles.ratingIconWrap}>
        <MaterialCommunityIcons name="star" size={22} color="#F59E0B" />
      </View>
      <View style={styles.ratingBody}>
        <Text style={styles.ratingLabel}>Your Rating</Text>
        <View style={styles.ratingScoreRow}>
          <Text style={styles.scoreValue}>{scoreText}</Text>
          {hasRating ? <StarRow rating={average} /> : null}
        </View>
        <Text style={styles.reviewCount}>
          {hasRating ? reviewsText : 'Complete jobs to collect ratings'}
        </Text>
      </View>
    </View>
  );
}

function StatCard({ title, value, icon, theme, onPress }) {
  return (
    <TouchableOpacity
      style={[
        styles.statCard,
        { backgroundColor: theme.bg, borderColor: theme.border },
      ]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <View style={styles.statTopRow}>
        <View style={[styles.statIconWrap, { backgroundColor: theme.iconBg }]}>
          <MaterialCommunityIcons name={icon} size={20} color="#FFFFFF" />
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color={theme.accent} />
      </View>
      <Text style={[styles.statTitle, { color: theme.accent }]} numberOfLines={1}>
        {title}
      </Text>
      <Text style={[styles.statValue, { color: theme.accent }]} numberOfLines={1}>
        {value}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingRight: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadow,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  notifButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadow,
  },
  notifDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  statsLoader: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '47.5%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    minHeight: 108,
    ...cardShadow,
  },
  statTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  ratingCard: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8EDF3',
    padding: 18,
    ...cardShadow,
  },
  ratingIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF9C3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingBody: {
    flex: 1,
    gap: 4,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  ratingScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  starRow: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewCount: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  upcomingSection: {
    marginTop: 20,
  },
  upcomingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  upcomingTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  upcomingViewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  upcomingViewAll: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  upcomingList: {
    gap: 10,
  },
  upcomingEmpty: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8EDF3',
    padding: 24,
    alignItems: 'center',
    ...cardShadow,
  },
  upcomingEmptyText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
  bookingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8EDF3',
    padding: 14,
    ...cardShadow,
  },
  bookingIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingBody: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  bookingService: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  bookingMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  bookingMeta: {
    flex: 1,
    fontSize: 12,
    color: '#64748B',
  },
  bookingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  bookingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
