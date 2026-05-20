import React, { useState, useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerPushTokenWithBackend } from '../services/pushNotifications';
import BottomTabNavigator from './BottomTabNavigator';
import CarWashScreen from '../screens/CarWashScreen';
import CarWashDetailsScreen from '../screens/CarWashDetailsScreen';
import BikeWashScreen from '../screens/BikeWashScreen';
import BikeWashDetailsScreen from '../screens/BikeWashDetailsScreen';
import ServiceDetailsScreen from '../screens/ServiceDetailsScreen';
import CartScreen from '../screens/CartScreen';
import SlotSelectionScreen from '../screens/SlotSelectionScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import BookingConfirmationScreen from '../screens/BookingConfirmationScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import AddressesScreen from '../screens/AddressesScreen';
import EmployeeLiveLocationScreen from '../screens/EmployeeLiveLocationScreen';
import VehicleDetailsScreen from '../screens/VehicleDetailsScreen';
import BrandsScreen from '../screens/BrandsScreen';
import ModelSelectionScreen from '../screens/ModelSelectionScreen';
import PaymentMethodsScreen from '../screens/PaymentMethodsScreen';
import PackageDetailsScreen from '../screens/PackageDetailsScreen';
import PackagesScreen from '../screens/PackagesScreen';
import MySubscriptionsScreen from '../screens/MySubscriptionsScreen';
import OrderUpsellScreen from '../screens/OrderUpsellScreen';

const Stack = createStackNavigator();

export default function HeaderNavigator() {
  const [initialRoute, setInitialRoute] = useState('Login');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          setInitialRoute('MainTabs');
          registerPushTokenWithBackend().catch(() => {});
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
    <Stack.Navigator
      initialRouteName={initialRoute}
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
        name="Login" 
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Welcome" 
        component={WelcomeScreen}
        options={{ headerShown: false }}
      />
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
        name="AutoWash"
        component={CarWashScreen}
        initialParams={{ category: 'AutoWash' }}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="CarWashDetails" 
        component={CarWashDetailsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ServiceDetails" 
        component={ServiceDetailsScreen}
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
      <Stack.Screen 
        name="Checkout" 
        component={CheckoutScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BookingConfirmation"
        component={BookingConfirmationScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Addresses" 
        component={AddressesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EmployeeLiveLocation"
        component={EmployeeLiveLocationScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SelectVehicle"
        component={VehicleDetailsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Brands"
        component={BrandsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ModelSelection"
        component={ModelSelectionScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PaymentMethods"
        component={PaymentMethodsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PackageDetails"
        component={PackageDetailsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Packages"
        component={PackagesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MySubscriptions"
        component={MySubscriptionsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="OrderUpsell"
        component={OrderUpsellScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
