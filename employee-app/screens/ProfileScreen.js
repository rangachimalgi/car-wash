import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen({ onLogout }) {
  const insets = useSafeAreaInsets();
  const profile = {
    employeeId: 'EMP-1024',
    name: 'Ranga',
    phone: '+91 98765 43210',
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: 24 + insets.top }]}>
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
            <Text style={styles.nameText}>{profile.name}</Text>
            <Text style={styles.employeeText}>{profile.employeeId}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Employee ID</Text>
          <Text style={styles.infoValue}>{profile.employeeId}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Name</Text>
          <Text style={styles.infoValue}>{profile.name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone Number</Text>
          <Text style={styles.infoValue}>{profile.phone}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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
  logoutButton: {
    marginTop: 24,
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
});
