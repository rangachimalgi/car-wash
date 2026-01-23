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

const renderScene = BottomNavigation.SceneMap({
  home: HomeScreen,
  attendance: AttendanceScreen,
  jobs: JobQueueScreen,
  earnings: EarningsHistoryScreen,
  profile: ProfileScreen,
});

export default function MainTabs() {
  const [index, setIndex] = useState(0);

  return (
    <BottomNavigation
      navigationState={{ index, routes }}
      onIndexChange={setIndex}
      renderScene={renderScene}
      renderIcon={renderIcon}
    />
  );
}
