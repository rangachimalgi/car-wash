import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../services/api';
import JobBookingRow, { jobListStyles } from '../components/JobBookingRow';
import {
  getAssignment,
  getScheduledDate,
  isToday,
  mapOrderToBooking,
  sortBookingsByDate,
} from '../utils/jobBookingHelpers';

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 17) return 'Good Afternoon';
  if (hour >= 17 && hour < 22) return 'Good Evening';
  return 'Hello';
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

  const greeting = getTimeGreeting();
  const displayName = (employeeName || '').trim();

  const loadStats = useCallback(async () => {
    if (!employeeId) return;
    setStatsLoading(true);
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
      setStatsLoading(false);
    }
  }, [employeeId]);

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
        { paddingTop: 24 + insets.top, paddingBottom: 24 + insets.bottom + 88 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={styles.name}>{displayName || 'there'}</Text>
      </View>

      {statsLoading && (
        <ActivityIndicator style={styles.statsLoader} size="small" color="#1A1A1A" />
      )}

      <View style={styles.statsGrid}>
        <StatCard
          title="Today's Jobs"
          value={displayValue(stats.todaysJobs)}
          icon="clipboard-text-outline"
          onPress={() => navigation.navigate('Jobs')}
        />
        <StatCard
          title="Pending Jobs"
          value={displayValue(stats.pendingJobs)}
          icon="timer-sand"
          onPress={() => navigation.navigate('Jobs')}
        />
        <StatCard
          title="Completed Jobs"
          value={displayValue(stats.completedJobs)}
          icon="check-circle-outline"
          onPress={() => navigation.navigate('Jobs')}
        />
        <StatCard
          title="Total Earnings"
          value={displayValue(stats.totalEarnings, true)}
          icon="wallet-outline"
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
        <TouchableOpacity
          style={styles.upcomingViewAllBtn}
          onPress={onViewAll}
          activeOpacity={0.7}
          hitSlop={8}
        >
          <Text style={styles.upcomingViewAll}>View all</Text>
          <MaterialCommunityIcons name="chevron-right" size={18} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={jobListStyles.listEmpty}>
          <ActivityIndicator size="small" color="#1A1A1A" />
        </View>
      ) : bookings.length === 0 ? (
        <View style={jobListStyles.listEmpty}>
          <Text style={jobListStyles.listEmptyText}>No upcoming jobs right now.</Text>
        </View>
      ) : (
        <View style={jobListStyles.listGroup}>
          {bookings.map((booking, index) => (
            <JobBookingRow
              key={booking.id}
              booking={booking}
              isLast={index === bookings.length - 1}
              onPress={() => onPressBooking(booking.id)}
            />
          ))}
        </View>
      )}
    </View>
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
            color={value >= i - 0.5 ? '#1A1A1A' : '#D1D5DB'}
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
      ? '1 review'
      : `${reviewCount} reviews`;

  return (
    <View style={styles.ratingCard}>
      <View style={styles.ratingTopRow}>
        <View style={styles.ratingTitleWrap}>
          <MaterialCommunityIcons name="star-four-points" size={14} color="#6B7280" />
          <Text style={styles.ratingLabel}>Your Rating</Text>
        </View>
        <View style={styles.reviewPill}>
          <Text style={styles.reviewPillText}>{reviewsText}</Text>
        </View>
      </View>

      <View style={styles.ratingMainRow}>
        <View style={styles.ratingLeft}>
          <StarRow rating={hasRating ? average : 0} />
          <Text style={styles.ratingHint}>
            {hasRating ? 'Average from customer feedback' : 'Complete jobs to collect ratings'}
          </Text>
        </View>
        <View style={styles.scoreBlock}>
          <Text style={styles.scoreValue}>{scoreText}</Text>
          {hasRating && <Text style={styles.scoreOutOf}>/ 5</Text>}
        </View>
      </View>
    </View>
  );
}

function StatCard({ title, value, icon, onPress }) {
  return (
    <TouchableOpacity style={styles.statCard} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.statIconWrap}>
        <MaterialCommunityIcons name={icon} size={22} color="#FFFFFF" />
      </View>
      <View style={styles.statBody}>
        <Text style={styles.statTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.statValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7FB',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 8,
  },
  greeting: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  statsLoader: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  statsGrid: {
    marginTop: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 10,
    minHeight: 88,
    shadowColor: '#0B1220',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBody: {
    flex: 1,
    minWidth: 0,
  },
  statTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  ratingCard: {
    marginTop: 16,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 18,
    shadowColor: '#0B1220',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  ratingTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  ratingTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  reviewPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  reviewPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  ratingMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 16,
  },
  ratingLeft: {
    flex: 1,
    minWidth: 0,
  },
  starRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  ratingHint: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 16,
  },
  scoreBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  scoreValue: {
    fontSize: 40,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -1,
    lineHeight: 44,
  },
  scoreOutOf: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 4,
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
    color: '#1A1A1A',
  },
  upcomingViewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  upcomingViewAll: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
});
