import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AttendanceScreen from '../screens/AttendanceScreen';
import DocumentUploadScreen from '../screens/DocumentUploadScreen';
import EarningsHistoryScreen from '../screens/EarningsHistoryScreen';
import InventoryScreen from '../screens/InventoryScreen';
import JobQueueScreen from '../screens/JobQueueScreen';
import JobDetailScreen from '../screens/JobDetailScreen';
import StartServiceScreen from '../screens/StartServiceScreen';
import MainTabs from './MainTabs';

const Stack = createStackNavigator();

export default function AppNavigator({ onLogout, employeeId }) {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="DocumentUpload"
    >
      <Stack.Screen name="DocumentUpload" component={DocumentUploadScreen} />
      <Stack.Screen name="MainTabs">
        {props => <MainTabs {...props} onLogout={onLogout} employeeId={employeeId} />}
      </Stack.Screen>
      <Stack.Screen name="Attendance" component={AttendanceScreen} />
      <Stack.Screen name="Earnings" component={EarningsHistoryScreen} />
      <Stack.Screen name="Inventory">
        {(props) => <InventoryScreen {...props} employeeId={employeeId} />}
      </Stack.Screen>
      <Stack.Screen name="Jobs">
        {(props) => <JobQueueScreen {...props} employeeId={employeeId} />}
      </Stack.Screen>
      <Stack.Screen name="JobDetail" component={JobDetailScreen} />
      <Stack.Screen name="StartService" component={StartServiceScreen} />
    </Stack.Navigator>
  );
}
