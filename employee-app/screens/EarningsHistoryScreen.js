import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function EarningsHistoryScreen() {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(), []);
  const [summary] = useState({
    period: 'This month',
    total: '₹12,450',
    jobs: 42,
  });
  const [incentives] = useState([
    { id: 'I-01', title: 'Peak hour bonus', amount: '₹450' },
    { id: 'I-02', title: '5-star rating bonus', amount: '₹300' },
    { id: 'I-03', title: 'Weekly target bonus', amount: '₹750' },
  ]);
  const [history] = useState([
    { id: 'E-01', date: 'Jan 22, 2026', desc: '4 jobs completed', amount: '₹920' },
    { id: 'E-02', date: 'Jan 21, 2026', desc: '3 jobs completed', amount: '₹760' },
    { id: 'E-03', date: 'Jan 20, 2026', desc: '2 jobs completed', amount: '₹540' },
  ]);

  return (
    <View style={[styles.container, { paddingTop: 24 + insets.top }]}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Earnings</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>{summary.period}</Text>
        <Text style={styles.summaryTotal}>{summary.total}</Text>
        <Text style={styles.summaryMeta}>{summary.jobs} jobs completed</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Incentives</Text>
        <FlatList
          data={incentives}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.listItem}>
              <Text style={styles.listTitle}>{item.title}</Text>
              <Text style={styles.listAmount}>{item.amount}</Text>
            </View>
          )}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>History</Text>
        <FlatList
          data={history}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.listItem}>
              <View>
                <Text style={styles.listTitle}>{item.date}</Text>
                <Text style={styles.listMeta}>{item.desc}</Text>
              </View>
              <Text style={styles.listAmount}>{item.amount}</Text>
            </View>
          )}
        />
      </View>
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
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: '#1A1A1A',
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
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: '#1A1A1A',
      marginBottom: 10,
    },
    listContent: {
      gap: 10,
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
    listAmount: {
      fontSize: 14,
      fontWeight: '700',
      color: '#16A34A',
    },
  });
