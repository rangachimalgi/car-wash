import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import BottomTabNavigator from './BottomTabNavigator';
import CarWashScreen from '../screens/CarWashScreen';
import CarWashDetailsScreen from '../screens/CarWashDetailsScreen';
import BikeWashScreen from '../screens/BikeWashScreen';
import BikeWashDetailsScreen from '../screens/BikeWashDetailsScreen';
import CartScreen from '../screens/CartScreen';
import SlotSelectionScreen from '../screens/SlotSelectionScreen';

const Stack = createStackNavigator();

export default function HeaderNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="MainTabs" 
        component={BottomTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="CarWash" 
        component={CarWashScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="CarWashDetails" 
        component={CarWashDetailsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="BikeWash" 
        component={BikeWashScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="BikeWashDetails" 
        component={BikeWashDetailsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Cart" 
        component={CartScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="SlotSelection" 
        component={SlotSelectionScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
