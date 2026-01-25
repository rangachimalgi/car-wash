import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function JobQueueScreen() {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(), []);
  const [incomingJob, setIncomingJob] = useState({
    id: 'JQ-1025',
    service: 'Premium Wash',
    customer: 'Kiran S',
    address: 'HSR Layout, Bengaluru',
    time: 'Today, 4:30 PM',
    price: '₹499',
  });
  const [queue, setQueue] = useState([
    { id: 'Q-201', service: 'Interior Cleaning', time: 'Today, 5:30 PM' },
    { id: 'Q-202', service: 'Foam Wash', time: 'Tomorrow, 9:00 AM' },
  ]);
  const [history, setHistory] = useState([
    { id: 'H-101', service: 'Basic Wash', date: 'Jan 22, 2026', status: 'Completed' },
    { id: 'H-102', service: 'Detailing', date: 'Jan 20, 2026', status: 'Completed' },
  ]);

  const handleAccept = () => {
    if (!incomingJob) return;
    setQueue(prev => [{ id: incomingJob.id, service: incomingJob.service, time: incomingJob.time }, ...prev]);
    setIncomingJob(null);
  };

  const handleDecline = () => {
    setIncomingJob(null);
  };

  return (
    <View style={[styles.container, { paddingTop: 24 + insets.top }]}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Job Queue</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>New Job</Text>
        {incomingJob ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{incomingJob.service}</Text>
            <Text style={styles.cardMeta}>{incomingJob.customer}</Text>
            <Text style={styles.cardMeta}>{incomingJob.address}</Text>
            <View style={styles.row}>
              <Text style={styles.cardMeta}>{incomingJob.time}</Text>
              <Text style={styles.priceText}>{incomingJob.price}</Text>
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.declineButton} onPress={handleDecline}>
                <Text style={styles.declineText}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
                <Text style={styles.acceptText}>Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No new jobs right now.</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Queue</Text>
        <FlatList
          data={queue}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.queueItem}>
              <View>
                <Text style={styles.queueTitle}>{item.service}</Text>
                <Text style={styles.queueTime}>{item.time}</Text>
              </View>
              <Text style={styles.queueId}>{item.id}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No jobs in queue.</Text>}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>History</Text>
        <FlatList
          data={history}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.historyItem}>
              <View>
                <Text style={styles.queueTitle}>{item.service}</Text>
                <Text style={styles.queueTime}>{item.date}</Text>
              </View>
              <Text style={styles.historyStatus}>{item.status}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No history yet.</Text>}
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
    section: {
      marginBottom: 20,
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
    emptyCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      padding: 16,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 12,
      color: '#6B7280',
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: '#1A1A1A',
      marginBottom: 6,
    },
    cardMeta: {
      fontSize: 12,
      color: '#6B7280',
      marginBottom: 4,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 4,
    },
    priceText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#1A1A1A',
    },
    actionRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 12,
    },
    declineButton: {
      flex: 1,
      backgroundColor: '#FEE2E2',
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
    },
    declineText: {
      color: '#DC2626',
      fontWeight: '700',
      fontSize: 13,
    },
    acceptButton: {
      flex: 1,
      backgroundColor: '#2F8CF4',
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
    },
    acceptText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 13,
    },
    listContent: {
      gap: 10,
    },
    queueItem: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      padding: 14,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
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
    queueTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: '#1A1A1A',
      marginBottom: 4,
    },
    queueTime: {
      fontSize: 12,
      color: '#6B7280',
    },
    queueId: {
      fontSize: 11,
      color: '#6B7280',
      fontWeight: '600',
    },
    historyStatus: {
      fontSize: 12,
      fontWeight: '700',
      color: '#16A34A',
    },
  });
