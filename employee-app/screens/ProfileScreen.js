import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen({ onLogout }) {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState({
    employeeId: '',
    name: '',
    phone: '',
  });
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { paddingTop: 24 + insets.top }]}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#85E4FC" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  // Show Profile screen
  return (
    <View style={[styles.container, { paddingTop: 24 + insets.top }]}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 + insets.bottom + 88 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Profile</Text>

        <View style={styles.header}>
          <View style={styles.avatarWrap}>
            <Image
              source={require('../assets/icon.png')}
              style={styles.avatar}
              resizeMode="cover"
            />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.nameText}>{profile.name || 'Employee'}</Text>
            <Text style={styles.employeeText}>{profile.employeeId || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.list}>
          <ListRow
            icon="badge-account-horizontal-outline"
            label="Employee ID"
            value={profile.employeeId || 'N/A'}
          />
          <Divider />
          <ListRow icon="account-outline" label="Name" value={profile.name || 'N/A'} />
          <Divider />
          <ListRow icon="phone-outline" label="Phone" value={profile.phone || 'N/A'} />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.85}>
          <MaterialCommunityIcons name="logout" size={18} color="#DC2626" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function ListRow({ icon, label, value, onPress, tone = 'default', showChevron = true }) {
  const isDanger = tone === 'danger';
  const Container = onPress ? TouchableOpacity : View;
  return (
    <Container
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.row, isDanger && styles.rowDanger]}
    >
      <View style={styles.rowLeft}>
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={isDanger ? '#DC2626' : '#111827'}
        />
        <View style={styles.rowText}>
          <Text style={[styles.rowLabel, isDanger && styles.rowLabelDanger]}>{label}</Text>
          {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        </View>
      </View>
      {showChevron ? (
        <MaterialCommunityIcons name="chevron-right" size={22} color="#9CA3AF" />
      ) : null}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
    paddingHorizontal: 20,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
  },
  headerText: {
    flex: 1,
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
  list: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginLeft: 54,
  },
  row: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  rowDanger: {
    paddingVertical: 16,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  rowLabelDanger: {
    color: '#DC2626',
  },
  rowValue: {
    marginTop: 2,
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  footer: {
    paddingTop: 10,
    backgroundColor: '#F5F6F8',
    alignItems: 'center',
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.25)',
  },
  logoutText: {
    color: '#DC2626',
    fontWeight: '800',
    fontSize: 13,
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
