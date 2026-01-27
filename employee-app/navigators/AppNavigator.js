import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import DocumentUploadScreen from '../screens/DocumentUploadScreen';
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
    </Stack.Navigator>
  );
}
