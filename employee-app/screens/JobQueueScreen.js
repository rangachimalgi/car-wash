import React, { useMemo, useState, useEffect } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_BASE_URL } from '../config/api';

export default function JobQueueScreen({ employeeId }) {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(), []);
  const [incomingJobs, setIncomingJobs] = useState([]);
  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchJobs = async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const [incomingRes, queueRes, historyRes] = await Promise.all([
        fetch(`${API_BASE_URL}/jobs/incoming?employeeId=${employeeId}`),
        fetch(`${API_BASE_URL}/jobs/queue?employeeId=${employeeId}`),
        fetch(`${API_BASE_URL}/jobs/history?employeeId=${employeeId}`),
      ]);
      const incomingData = await incomingRes.json();
      const queueData = await queueRes.json();
      const historyData = await historyRes.json();
      setIncomingJobs(incomingData.data || []);
      setQueue(queueData.data || []);
      setHistory(historyData.data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [employeeId]);

  const handleAccept = async (orderId) => {
    try {
      await fetch(`${API_BASE_URL}/jobs/${orderId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId }),
      });
      fetchJobs();
    } catch (error) {
      console.error('Error accepting job:', error);
    }
  };

  const handleDecline = async (orderId) => {
    try {
      await fetch(`${API_BASE_URL}/jobs/${orderId}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId }),
      });
      fetchJobs();
    } catch (error) {
      console.error('Error declining job:', error);
    }
  };

  const mapOrderToCard = (order) => {
    const firstItem = order?.items?.[0];
    return {
      id: order?._id,
      service: firstItem?.service?.name || 'Service',
      customer: order?.customer?.name || 'Customer',
      address: order?.customer?.address || 'Address',
      time: firstItem?.scheduledTimeSlot || 'Time slot',
      price: `₹${order?.totalAmount ?? 0}`,
    };
  };

  return (
    <View style={[styles.container, { paddingTop: 24 + insets.top }]}>
      <StatusBar style="dark" />
      <View style={styles.titleRow}>
        <Text style={styles.title}>Job Queue</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchJobs}>
          <Text style={styles.refreshButtonText}>{loading ? 'Refreshing...' : 'Refresh'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>New Job</Text>
        {incomingJobs.length > 0 ? (
          <FlatList
            data={incomingJobs}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const card = mapOrderToCard(item);
              return (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>{card.service}</Text>
                  <Text style={styles.cardMeta}>{card.customer}</Text>
                  <Text style={styles.cardMeta}>{card.address}</Text>
                  <View style={styles.row}>
                    <Text style={styles.cardMeta}>{card.time}</Text>
                    <Text style={styles.priceText}>{card.price}</Text>
                  </View>
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.declineButton}
                      onPress={() => handleDecline(card.id)}
                    >
                      <Text style={styles.declineText}>Decline</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() => handleAccept(card.id)}
                    >
                      <Text style={styles.acceptText}>Accept</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              {loading ? 'Loading jobs...' : 'No new jobs right now.'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Queue</Text>
        <FlatList
          data={queue}
          keyExtractor={item => item._id || item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const card = mapOrderToCard(item);
            return (
              <View style={styles.queueItem}>
                <View>
                  <Text style={styles.queueTitle}>{card.service}</Text>
                  <Text style={styles.queueTime}>{card.time}</Text>
                </View>
                <Text style={styles.queueId}>{card.id?.slice(-6)}</Text>
              </View>
            );
          }}
          ListEmptyComponent={<Text style={styles.emptyText}>No jobs in queue.</Text>}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>History</Text>
        <FlatList
          data={history}
          keyExtractor={item => item._id || item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const card = mapOrderToCard(item);
            return (
              <View style={styles.historyItem}>
                <View>
                  <Text style={styles.queueTitle}>{card.service}</Text>
                  <Text style={styles.queueTime}>{card.time}</Text>
                </View>
                <Text style={styles.historyStatus}>Completed</Text>
              </View>
            );
          }}
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
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    refreshButton: {
      backgroundColor: '#EEF2FF',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
    },
    refreshButtonText: {
      color: '#2F5CF4',
      fontWeight: '700',
      fontSize: 12,
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
