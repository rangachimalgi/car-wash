import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './navigators/AppNavigator';
import AuthNavigator from './navigators/AuthNavigator';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [employeeId, setEmployeeId] = useState('');

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider>
          <NavigationContainer>
            {isLoggedIn ? (
              <AppNavigator
                employeeId={employeeId}
                onLogout={() => {
                  setIsLoggedIn(false);
                  setEmployeeId('');
                }}
              />
            ) : (
              <AuthNavigator
                onLogin={({ employeeId: id }) => {
                  setEmployeeId(id || 'EMP-1024');
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
