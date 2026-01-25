import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const attendance = {
    date: 'Today',
    status: 'Not marked',
    time: '09:30 AM',
  };
  const job = {
    id: 'JQ-1025',
    service: 'Premium Wash',
    customer: 'Kiran S',
    time: 'Today, 4:30 PM',
  };
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: 24 + insets.top }]}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar style="dark" />
      <Text style={styles.title}>Employee Home</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Attendance</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.cardTitle}>{attendance.date}</Text>
            <Text style={styles.badge}>{attendance.status}</Text>
          </View>
          <Text style={styles.cardMeta}>Last check-in: {attendance.time}</Text>
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Mark Attendance</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>New Job</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{job.service}</Text>
          <Text style={styles.cardMeta}>{job.customer}</Text>
          <Text style={styles.cardMeta}>{job.time}</Text>
          <View style={styles.row}>
            <Text style={styles.cardHint}>Job ID {job.id}</Text>
            <TouchableOpacity style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>View Job</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  section: {
    marginTop: 20,
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  cardMeta: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
  },
  cardHint: {
    fontSize: 12,
    color: '#6B7280',
  },
  badge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: '#2F8CF4',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  secondaryButton: {
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  secondaryButtonText: {
    color: '#2F5CF4',
    fontWeight: '700',
    fontSize: 12,
  },
});
