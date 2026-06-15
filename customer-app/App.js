import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import HeaderNavigator from './navigators/HeaderNavigator';
import { ThemeProvider, useTheme } from './theme/ThemeContext';
import { CustomerNotificationsProvider } from './context/CustomerNotificationsContext';
import { navigationRef } from './navigation/navigationRef';
import { configureNotificationPresentation } from './services/notificationSetup';

configureNotificationPresentation();

SplashScreen.hideAsync().catch(() => {});

function AppContent() {
  const { isLightMode } = useTheme();

  return (
    <>
      <StatusBar style={isLightMode ? 'dark' : 'light'} />
      <NavigationContainer ref={navigationRef}>
        <CustomerNotificationsProvider>
          <HeaderNavigator />
        </CustomerNotificationsProvider>
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
