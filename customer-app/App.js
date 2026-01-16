import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HeaderNavigator from './navigators/HeaderNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <HeaderNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}