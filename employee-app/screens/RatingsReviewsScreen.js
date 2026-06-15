import React, { useCallback, useMemo, useState } from 'react';
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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../services/api';
import {
  formatReviewDate,
  formatReviewTime,
  getInitials,
  getRatingLabel,
  getVehicleLine,
} from '../utils/ratingsHelpers';

const GREEN_DARK = '#166534';
const GREEN_BANNER = '#15803D';
const BLUE = '#2563EB';
const BLUE_LIGHT = '#EFF6FF';
const ORANGE = '#F97316';

const cardShadow = Platform.select({
  ios: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  android: { elevation: 2 },
});

function StarRow({ rating, size = 22, color = '#FBBF24' }) {
  const value = Number(rating) || 0;
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <MaterialCommunityIcons
          key={i}
          name={value >= i ? 'star' : value >= i - 0.5 ? 'star-half-full' : 'star-outline'}
          size={size}
          color={value >= i - 0.5 ? color : '#E5E7EB'}
        />
      ))}
    </View>
  );
}

function DistributionBar({ stars, count, maxCount }) {
  const widthPct = maxCount > 0 ? Math.max(4, Math.round((count / maxCount) * 100)) : 0;
  return (
    <View style={styles.distRow}>
      <Text style={styles.distStars}>{stars}</Text>
      <MaterialCommunityIcons name="star" size={12} color="#FBBF24" />
      <View style={styles.distTrack}>
        <View style={[styles.distFill, { width: `${widthPct}%` }]} />
      </View>
      <Text style={styles.distCount}>{count}</Text>
    </View>
  );
}

export default function RatingsReviewsScreen({ navigation, route, employeeId: employeeIdProp }) {
  const insets = useSafeAreaInsets();
  const employeeId = route?.params?.employeeId ?? employeeIdProp;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [latest, setLatest] = useState(null);
  const [thisMonth, setThisMonth] = useState(null);
  const [allTime, setAllTime] = useState(null);

  const loadRatings = useCallback(async ({ silent = false } = {}) => {
    if (!employeeId) return;
    if (!silent) setLoading(true);
    try {
      const res = await api.get(`/jobs/ratings?employeeId=${encodeURIComponent(employeeId)}`);
      if (res.data?.success) {
        const data = res.data.data || {};
        setLatest(data.latest || null);
        setThisMonth(data.thisMonth || null);
        setAllTime(data.allTime || null);
      }
    } catch (error) {
      console.error('Error loading ratings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [employeeId]);

  useFocusEffect(
    useCallback(() => {
      loadRatings();
    }, [loadRatings])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadRatings({ silent: true });
  };

  const monthStats = thisMonth?.count > 0 ? thisMonth : allTime;
  const distribution = monthStats?.distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const maxDist = Math.max(...Object.values(distribution), 1);

  const latestRating = latest?.rating;
  const latestScore = typeof latestRating === 'number' ? latestRating.toFixed(1) : '—';
  const latestLabel = getRatingLabel(latestRating);
  const customerName = latest?.customer?.name || 'Customer';
  const ratedAt = latest?.ratedAt || latest?.updatedAt;
  const showNewBanner = latest && ratedAt && Date.now() - new Date(ratedAt).getTime() < 7 * 24 * 60 * 60 * 1000;

  const encouragement = useMemo(() => {
    const avg = monthStats?.average;
    if (avg == null) return 'Complete jobs to start collecting customer ratings.';
    if (avg >= 4.5) return 'Keep up the good work! Your service quality is above average.';
    if (avg >= 4) return 'Solid work — a few more 5-star reviews will boost your average.';
    return 'Focus on checklist quality and customer communication to improve ratings.';
  }, [monthStats?.average]);

  if (loading && !latest && !allTime) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={BLUE} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: 12 + insets.top }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ratings & Reviews</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 + insets.bottom + 88 }]}
      >
        {showNewBanner ? (
          <View style={styles.heroBanner}>
            <MaterialCommunityIcons name="star-circle" size={28} color="#FBBF24" />
            <View style={styles.heroTextWrap}>
              <Text style={styles.heroTitle}>Great Job!</Text>
              <Text style={styles.heroSub}>You received a new rating.</Text>
            </View>
          </View>
        ) : null}

        {latest ? (
          <>
            <View style={styles.customerCard}>
              <View style={styles.customerLeft}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getInitials(customerName)}</Text>
                </View>
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{customerName}</Text>
                  <Text style={styles.vehicleLine}>{getVehicleLine(latest)}</Text>
                </View>
              </View>
              <View style={styles.dateCol}>
                <Text style={styles.dateText}>{formatReviewDate(ratedAt)}</Text>
                <Text style={styles.timeText}>{formatReviewTime(ratedAt)}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Your Rating</Text>
            <View style={styles.card}>
              <StarRow rating={latestRating} size={28} />
              <View style={styles.scoreRow}>
                <Text style={styles.scoreBig}>{latestScore}/5</Text>
                <View style={styles.goodBadge}>
                  <Text style={styles.goodBadgeText}>{latestLabel}</Text>
                </View>
              </View>
              <Text style={styles.feedbackTitle}>Customer Feedback</Text>
              <Text style={styles.feedbackBody}>
                {latest.review?.trim() || 'No written feedback — customer left a star rating only.'}
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="star-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No ratings yet</Text>
            <Text style={styles.emptyText}>Complete jobs and customers can rate your service.</Text>
          </View>
        )}

        {monthStats?.count > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Rating Summary</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryLeft}>
                <Text style={styles.summaryAvg}>{monthStats.average?.toFixed(1) ?? '—'}</Text>
                <StarRow rating={monthStats.average} size={18} />
                <Text style={styles.summaryBased}>
                  Based on {monthStats.count} review{monthStats.count === 1 ? '' : 's'}
                </Text>
                <Text style={styles.summaryPeriod}>This month</Text>
              </View>
              <View style={styles.summaryRight}>
                {[5, 4, 3, 2, 1].map((stars) => (
                  <DistributionBar
                    key={stars}
                    stars={stars}
                    count={distribution[stars] || 0}
                    maxCount={maxDist}
                  />
                ))}
              </View>
            </View>

            <View style={styles.kpiRow}>
              <View style={styles.kpiCard}>
                <MaterialCommunityIcons name="calendar-month-outline" size={20} color={BLUE} />
                <Text style={styles.kpiValue}>{monthStats.count}</Text>
                <Text style={styles.kpiLabel}>Total Reviews</Text>
              </View>
              <View style={styles.kpiCard}>
                <MaterialCommunityIcons name="star-outline" size={20} color={BLUE} />
                <Text style={styles.kpiValue}>{monthStats.average?.toFixed(1) ?? '—'}</Text>
                <Text style={styles.kpiLabel}>Average Rating</Text>
              </View>
              <View style={styles.kpiCard}>
                <MaterialCommunityIcons name="trending-up" size={20} color={BLUE} />
                <Text style={styles.kpiValue}>{monthStats.positivePercent ?? 0}%</Text>
                <Text style={styles.kpiLabel}>Positive Ratings</Text>
              </View>
            </View>

            <View style={styles.encourageCard}>
              <MaterialCommunityIcons name="emoticon-happy-outline" size={22} color={BLUE} />
              <Text style={styles.encourageText}>{encouragement}</Text>
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, gap: 14 },
  heroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: GREEN_BANNER,
    borderRadius: 14,
    padding: 16,
  },
  heroTextWrap: { flex: 1 },
  heroTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  heroSub: { fontSize: 14, color: '#DCFCE7', marginTop: 2 },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    ...cardShadow,
  },
  customerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BLUE_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: BLUE },
  customerInfo: { flex: 1 },
  customerName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  vehicleLine: { fontSize: 13, color: '#64748B', marginTop: 2 },
  dateCol: { alignItems: 'flex-end' },
  dateText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  timeText: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    ...cardShadow,
  },
  starRow: { flexDirection: 'row', gap: 4 },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    marginBottom: 14,
  },
  scoreBig: { fontSize: 28, fontWeight: '800', color: '#111827' },
  goodBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  goodBadgeText: { fontSize: 12, fontWeight: '700', color: GREEN_DARK },
  feedbackTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 6 },
  feedbackBody: { fontSize: 14, color: '#475569', lineHeight: 21 },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 32,
    ...cardShadow,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginTop: 12 },
  emptyText: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 6 },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: BLUE_LIGHT,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  summaryLeft: { flex: 1, gap: 4 },
  summaryAvg: { fontSize: 36, fontWeight: '800', color: '#111827' },
  summaryBased: { fontSize: 12, color: '#64748B', marginTop: 4 },
  summaryPeriod: { fontSize: 11, fontWeight: '600', color: BLUE, marginTop: 2 },
  summaryRight: { flex: 1, justifyContent: 'center', gap: 6 },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  distStars: { width: 12, fontSize: 11, fontWeight: '600', color: '#64748B' },
  distTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  distFill: {
    height: '100%',
    backgroundColor: ORANGE,
    borderRadius: 4,
  },
  distCount: { width: 20, fontSize: 11, fontWeight: '600', color: '#64748B', textAlign: 'right' },
  kpiRow: { flexDirection: 'row', gap: 10 },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    ...cardShadow,
  },
  kpiValue: { fontSize: 18, fontWeight: '800', color: '#111827' },
  kpiLabel: { fontSize: 10, color: '#64748B', textAlign: 'center', fontWeight: '600' },
  encourageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: BLUE_LIGHT,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  encourageText: { flex: 1, fontSize: 13, color: '#1E40AF', fontWeight: '600', lineHeight: 18 },
});
