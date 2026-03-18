import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: 24 + insets.top }]}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar style="dark" />
      <Text style={styles.kicker}>Dashboard</Text>

      <View style={styles.tilesGrid}>
        <Tile
          title="Earnings"
          subtitle="View history"
          icon="cash-multiple"
          onPress={() => navigation.navigate('Earnings')}
        />
        <Tile
          title="Inventory"
          subtitle="Stock & items"
          icon="package-variant-closed"
          onPress={() => navigation.navigate('Inventory')}
        />
        <Tile
          title="Attendance"
          subtitle="Check-in/out"
          icon="calendar-check"
          onPress={() => navigation.navigate('Attendance')}
        />
        <Tile
          title="Jobs"
          subtitle="Queue"
          icon="clipboard-list"
          onPress={() => navigation.navigate('Jobs')}
        />
      </View>
    </ScrollView>
  );
}

function Tile({ title, subtitle, icon, onPress }) {
  return (
    <TouchableOpacity style={styles.tile} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.tileTopRow}>
        <View style={styles.tileIconWrap}>
          <MaterialCommunityIcons name={icon} size={24} color="#2F5CF4" />
        </View>
        <View style={styles.tileChevronWrap}>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
        </View>
      </View>
      <Text style={styles.tileTitle}>{title}</Text>
      <Text style={styles.tileSubtitle} numberOfLines={1}>
        {subtitle}
      </Text>
      <View style={styles.tileAccent} />
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
  kicker: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#6B7280',
    marginBottom: 6,
  },
  tilesGrid: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  tile: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    padding: 16,
    minHeight: 140,
    shadowColor: '#0B1220',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
    overflow: 'hidden',
  },
  tileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  tileIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(47, 92, 244, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileChevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  tileSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  tileAccent: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    height: 4,
    width: '100%',
    backgroundColor: 'rgba(47, 92, 244, 0.18)',
  },
});
