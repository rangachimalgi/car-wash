import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppNavigator from './navigators/AppNavigator';
import AuthNavigator from './navigators/AuthNavigator';
import { JobNotificationsProvider } from './context/JobNotificationsContext';
import { navigationRef } from './navigation/navigationRef';
import { configureNotificationPresentation } from './services/notificationSetup';
import './locationTask';

configureNotificationPresentation();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing token on app startup
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const [token, storedEmployeeId] = await Promise.all([
          AsyncStorage.getItem('employeeAuthToken'),
          AsyncStorage.getItem('employeeId'),
        ]);
        if (token && storedEmployeeId) {
          setEmployeeId(storedEmployeeId);
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider>
          <NavigationContainer ref={navigationRef}>
            {isLoggedIn ? (
              <JobNotificationsProvider employeeId={employeeId}>
                <AppNavigator
                  employeeId={employeeId}
                  onLogout={async () => {
                  try {
                    await AsyncStorage.multiRemove(['employeeAuthToken', 'employeeId', 'employeeName']);
                  } catch (error) {
                    console.error('Error clearing storage:', error);
                  }
                  setIsLoggedIn(false);
                  setEmployeeId('');
                }}
                />
              </JobNotificationsProvider>
            ) : (
              <AuthNavigator
                onLogin={({ employeeId: id }) => {
                  setEmployeeId(id || '');
                  setIsLoggedIn(true);
                }}
              />
            )}
          </NavigationContainer>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
