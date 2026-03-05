import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import HeaderNavigator from './navigators/HeaderNavigator';
import { ThemeProvider, useTheme } from './theme/ThemeContext';

// Show notifications when app is in foreground (e.g. OTP from employee)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('default', {
    name: 'Woosh',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
  }).catch(() => {});
}

SplashScreen.hideAsync().catch(() => {});

function AppContent() {
  const { isLightMode } = useTheme();

  return (
    <>
      <StatusBar style={isLightMode ? 'dark' : 'light'} />
      <NavigationContainer>
        <HeaderNavigator />
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
