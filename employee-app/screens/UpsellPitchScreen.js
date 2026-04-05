import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function UpsellPitchScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(), []);
  const orderId = route?.params?.orderId;
  const shortId = orderId ? String(orderId).slice(-6) : '';

  return (
    <ScrollView
      style={[styles.container, { paddingTop: 24 + insets.top }]}
      contentContainerStyle={styles.content}
    >
      <StatusBar style="dark" />
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Customer add-ons</Text>
      <Text style={styles.body}>
        You don't book anything here — the customer does. Ask them to open Woosh →{' '}
        <Text style={styles.bold}>Bookings</Text> → <Text style={styles.bold}>Add services</Text> on this wash. That
        credits add-on sales to you (same assigned job). Weekly add-on total vs target sets commission.
      </Text>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Booking ref (last 6)</Text>
        <Text style={styles.cardValue}>{shortId || '—'}</Text>
      </View>
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
    content: {
      paddingBottom: 40,
    },
    back: {
      alignSelf: 'flex-start',
      marginBottom: 12,
    },
    backText: {
      color: '#2F5CF4',
      fontWeight: '700',
      fontSize: 16,
    },
    title: {
      fontSize: 22,
      fontWeight: '800',
      color: '#1A1A1A',
      marginBottom: 12,
    },
    body: {
      fontSize: 15,
      color: '#4B5563',
      lineHeight: 22,
      marginBottom: 20,
    },
    bold: {
      fontWeight: '800',
      color: '#1A1A1A',
    },
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      padding: 16,
    },
    cardLabel: {
      fontSize: 12,
      color: '#6B7280',
      marginBottom: 6,
    },
    cardValue: {
      fontSize: 20,
      fontWeight: '800',
      letterSpacing: 2,
      color: '#1A1A1A',
    },
  });
