import React, { useState } from 'react';
import { BottomNavigation } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AttendanceScreen from '../screens/AttendanceScreen';
import EarningsHistoryScreen from '../screens/EarningsHistoryScreen';
import HomeScreen from '../screens/HomeScreen';
import JobQueueScreen from '../screens/JobQueueScreen';
import ProfileScreen from '../screens/ProfileScreen';

const routes = [
  { key: 'home', title: 'Home', icon: 'home-variant-outline' },
  { key: 'attendance', title: 'Attendance', icon: 'calendar-check-outline' },
  { key: 'jobs', title: 'Job Queue', icon: 'clipboard-list-outline' },
  { key: 'earnings', title: 'Earnings', icon: 'cash-multiple' },
  { key: 'profile', title: 'Profile', icon: 'account-outline' },
];

const renderIcon = ({ route, color, size }) => (
  <MaterialCommunityIcons name={route.icon} size={size} color={color} />
);

export default function MainTabs({ onLogout }) {
  const [index, setIndex] = useState(0);

  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'home':
        return <HomeScreen />;
      case 'attendance':
        return <AttendanceScreen />;
      case 'jobs':
        return <JobQueueScreen />;
      case 'earnings':
        return <EarningsHistoryScreen />;
      case 'profile':
        return <ProfileScreen onLogout={onLogout} />;
      default:
        return null;
    }
  };

  return (
    <BottomNavigation
      navigationState={{ index, routes }}
      onIndexChange={setIndex}
      renderScene={renderScene}
      renderIcon={renderIcon}
    />
  );
}
