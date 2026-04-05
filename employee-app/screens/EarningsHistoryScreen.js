import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';

function formatInr(amount) {
  const n = Number(amount) || 0;
  return `₹${n.toLocaleString('en-IN')}`;
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

export default function EarningsHistoryScreen() {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(), []);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [totalIncentives, setTotalIncentives] = useState(0);
  const [entries, setEntries] = useState([]);
  const [configSummary, setConfigSummary] = useState(null);
  const [upsell, setUpsell] = useState(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const { data } = await api.get('/employee-incentives/me');
      if (data?.success && data.data) {
        setTotalIncentives(Number(data.data.totalIncentives) || 0);
        setEntries(Array.isArray(data.data.entries) ? data.data.entries : []);
        setConfigSummary(data.data.config || null);
        setUpsell(data.data.upsell || null);
      } else {
        setError(data?.message || 'Could not load earnings.');
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Could not load earnings.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const periodHint =
    configSummary?.periodType === 'daily'
      ? 'Daily target (IST)'
      : 'Weekly target (Mon–Sun, IST)';

  return (
    <ScrollView
      style={[styles.container, { paddingTop: 24 + insets.top }]}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <StatusBar style="dark" />
      <Text style={styles.title}>Earnings</Text>
      <Text style={styles.subtitle}>Job bonuses and weekly add-on upsell commission.</Text>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#2F5CF4" />
        </View>
      ) : (
        <>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Job incentives (above service target)</Text>
            <Text style={styles.summaryTotal}>{formatInr(totalIncentives)}</Text>
            {configSummary && (
              <Text style={styles.summaryMeta}>
                {periodHint}: {configSummary.targetCount ?? '—'} services · +
                {formatInr(configSummary.amountPerExtraService || 0)} per extra job
                {configSummary.isActive === false ? ' · (paused by admin)' : ''}
              </Text>
            )}
          </View>

          {upsell && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Add-on upsell (this IST week)</Text>
              <Text style={styles.summaryMeta}>
                {formatInr(upsell.totalSales || 0)} / {formatInr(upsell.targetAmount || 0)} pre-tax add-ons
                {upsell.qualifies ? ' · Target reached' : ' · Below target — no commission yet'}
              </Text>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.round(Math.min(1, Number(upsell.progress) || 0) * 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.upsellCommissionLine}>
                Commission ({upsell.commissionPercent ?? 10}% of week sales):{' '}
                <Text style={styles.upsellCommissionAmt}>{formatInr(upsell.commissionAmount || 0)}</Text>
              </Text>
              {upsell.periodKey ? (
                <Text style={styles.periodKeySmall}>{upsell.periodKey}</Text>
              ) : null}
              {upsell.isActive === false ? (
                <Text style={styles.pausedText}>Upsell commission paused by admin.</Text>
              ) : null}
            </View>
          )}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Text style={styles.sectionTitle}>Job incentive history</Text>
          {entries.length === 0 ? (
            <Text style={styles.empty}>No incentive entries yet. Complete jobs above your target to earn here.</Text>
          ) : (
            entries.map((item) => (
              <View key={item._id} style={styles.listItem}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={styles.listTitle}>Above-target bonus</Text>
                  <Text style={styles.listMeta}>
                    {formatDate(item.completedAt)} · #{item.countInPeriod} in period · target {item.targetSnapshot}
                  </Text>
                  <Text style={styles.periodKey}>{item.periodKey}</Text>
                </View>
                <Text style={styles.listAmount}>{formatInr(item.amount)}</Text>
              </View>
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

const createStyles = () =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F5F6F8',
      paddingHorizontal: 20,
    },
    scrollContent: {
      paddingBottom: 100,
    },
    centered: {
      paddingVertical: 40,
      alignItems: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: '#1A1A1A',
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 13,
      color: '#6B7280',
      marginBottom: 16,
    },
    summaryCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      padding: 16,
      marginBottom: 20,
    },
    summaryLabel: {
      fontSize: 12,
      color: '#6B7280',
      marginBottom: 6,
    },
    summaryTotal: {
      fontSize: 28,
      fontWeight: '700',
      color: '#1A1A1A',
      marginBottom: 4,
    },
    summaryMeta: {
      fontSize: 13,
      color: '#6B7280',
      lineHeight: 18,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: '#1A1A1A',
      marginBottom: 10,
    },
    empty: {
      fontSize: 14,
      color: '#6B7280',
      marginBottom: 20,
    },
    errorText: {
      color: '#B91C1C',
      marginBottom: 12,
      fontSize: 14,
    },
    listItem: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      padding: 14,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    listTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: '#1A1A1A',
    },
    listMeta: {
      fontSize: 12,
      color: '#6B7280',
      marginTop: 4,
    },
    periodKey: {
      fontSize: 11,
      color: '#9CA3AF',
      marginTop: 4,
    },
    listAmount: {
      fontSize: 15,
      fontWeight: '700',
      color: '#16A34A',
    },
    progressTrack: {
      height: 10,
      borderRadius: 6,
      backgroundColor: '#E2E8F0',
      marginTop: 12,
      marginBottom: 10,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 6,
      backgroundColor: '#2F5CF4',
    },
    upsellCommissionLine: {
      fontSize: 13,
      color: '#4B5563',
      marginTop: 4,
    },
    upsellCommissionAmt: {
      fontWeight: '800',
      color: '#16A34A',
    },
    periodKeySmall: {
      fontSize: 11,
      color: '#9CA3AF',
      marginTop: 6,
    },
    pausedText: {
      fontSize: 12,
      color: '#B45309',
      marginTop: 8,
    },
  });
