import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EarningsHistoryScreen from './EarningsHistoryScreen';
import InventoryScreen from './InventoryScreen';

export default function ProfileScreen({ onLogout, employeeId }) {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState({
    employeeId: '',
    name: '',
    phone: '',
  });
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('profile'); // 'profile', 'earnings', 'inventory'

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [employeeId, employeeName, employeePhone] = await Promise.all([
          AsyncStorage.getItem('employeeId'),
          AsyncStorage.getItem('employeeName'),
          AsyncStorage.getItem('employeePhone'),
        ]);

        setProfile({
          employeeId: employeeId || '',
          name: employeeName || '',
          phone: employeePhone || '',
        });
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  if (loading && activeView === 'profile') {
    return (
      <View style={[styles.container, styles.loadingContainer, { paddingTop: 24 + insets.top }]}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#85E4FC" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  // Show Earnings screen
  if (activeView === 'earnings') {
    return (
      <View style={[styles.container, { paddingTop: 24 + insets.top }]}>
        <StatusBar style="dark" />
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => setActiveView('profile')}>
            <MaterialCommunityIcons name="arrow-left" size={20} color="#2F5CF4" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Earnings</Text>
          <View style={styles.headerSpacer} />
        </View>
        <EarningsHistoryScreen />
      </View>
    );
  }

  // Show Inventory screen
  if (activeView === 'inventory') {
    return (
      <View style={[styles.container, { paddingTop: 24 + insets.top }]}>
        <StatusBar style="dark" />
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => setActiveView('profile')}>
            <MaterialCommunityIcons name="arrow-left" size={20} color="#2F5CF4" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Inventory</Text>
          <View style={styles.headerSpacer} />
        </View>
        <InventoryScreen employeeId={employeeId} />
      </View>
    );
  }

  // Show Profile screen
  return (
    <ScrollView 
      style={[styles.container, { paddingTop: 24 + insets.top }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar style="dark" />
      <Text style={styles.title}>Profile</Text>

      <View style={styles.card}>
        <View style={styles.avatarRow}>
          <View style={styles.avatarWrap}>
            <Image
              source={require('../assets/icon.png')}
              style={styles.avatar}
              resizeMode="cover"
            />
          </View>
          <View>
            <Text style={styles.nameText}>{profile.name || 'Employee'}</Text>
            <Text style={styles.employeeText}>{profile.employeeId || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Employee ID</Text>
          <Text style={styles.infoValue}>{profile.employeeId || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Name</Text>
          <Text style={styles.infoValue}>{profile.name || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone Number</Text>
          <Text style={styles.infoValue}>{profile.phone || 'N/A'}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.earningsButton} onPress={() => setActiveView('earnings')}>
        <MaterialCommunityIcons name="cash-multiple" size={20} color="#FFFFFF" />
        <Text style={styles.earningsText}>Earnings</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.inventoryButton} onPress={() => setActiveView('inventory')}>
        <MaterialCommunityIcons name="package-variant-closed" size={20} color="#FFFFFF" />
        <Text style={styles.inventoryText}>Inventory</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  backText: {
    color: '#2F5CF4',
    fontWeight: '700',
    fontSize: 12,
  },
  headerSpacer: {
    width: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  nameText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  employeeText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  infoLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
  },
  earningsButton: {
    marginTop: 24,
    backgroundColor: '#22C55E',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  earningsText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  inventoryButton: {
    marginTop: 12,
    backgroundColor: '#2F8CF4',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  inventoryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  logoutButton: {
    marginTop: 12,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
});
