import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AttendanceScreen from '../screens/AttendanceScreen';
import DocumentUploadScreen from '../screens/DocumentUploadScreen';
import JobQueueScreen from '../screens/JobQueueScreen';
import JobDetailScreen from '../screens/JobDetailScreen';
import BeforePhotosScreen from '../screens/BeforePhotosScreen';
import StartServiceScreen from '../screens/StartServiceScreen';
import MaterialDetailScreen from '../screens/MaterialDetailScreen';
import MaterialUsageScreen from '../screens/MaterialUsageScreen';
import RequestRefillScreen from '../screens/RequestRefillScreen';
import MyRequestsScreen from '../screens/MyRequestsScreen';
import UpsellPitchScreen from '../screens/UpsellPitchScreen';
import ReportProblemScreen from '../screens/ReportProblemScreen';
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
      <Stack.Screen name="Jobs">
        {(props) => <JobQueueScreen {...props} employeeId={employeeId} />}
      </Stack.Screen>
      <Stack.Screen name="JobDetail">
        {(props) => <JobDetailScreen {...props} employeeId={employeeId} />}
      </Stack.Screen>
      <Stack.Screen name="BeforePhotos">
        {(props) => <BeforePhotosScreen {...props} employeeId={employeeId} />}
      </Stack.Screen>
      <Stack.Screen name="StartService" component={StartServiceScreen} />
      <Stack.Screen name="MaterialDetail">
        {(props) => <MaterialDetailScreen {...props} employeeId={employeeId} />}
      </Stack.Screen>
      <Stack.Screen name="MaterialUsage">
        {(props) => <MaterialUsageScreen {...props} employeeId={employeeId} />}
      </Stack.Screen>
      <Stack.Screen name="RequestRefill">
        {(props) => <RequestRefillScreen {...props} employeeId={employeeId} />}
      </Stack.Screen>
      <Stack.Screen name="MyRequests">
        {(props) => <MyRequestsScreen {...props} employeeId={employeeId} />}
      </Stack.Screen>
      <Stack.Screen name="UpsellPitch" component={UpsellPitchScreen} />
      <Stack.Screen name="ReportProblem">
        {(props) => <ReportProblemScreen {...props} employeeId={employeeId} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
