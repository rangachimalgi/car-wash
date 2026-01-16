import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import BookingsScreen from '../screens/BookingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import WalletScreen from '../screens/WalletScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Try to use BlurView if available, otherwise use fallback
let BlurView;
try {
  BlurView = require('expo-blur').BlurView;
} catch (e) {
  // Fallback component that mimics blur effect
  BlurView = ({ children, style, intensity, tint }) => (
    <View style={[style, { backgroundColor: tint === 'dark' ? 'rgba(44, 44, 46, 0.85)' : 'rgba(255, 255, 255, 0.85)' }]}>
      {children}
    </View>
  );
}

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');
const TAB_COUNT = 5;
const TAB_BAR_PADDING = 20; // left + right padding from tabBarContainer
const TAB_BAR_INNER_PADDING = 10; // paddingHorizontal from tabBar style
const TAB_BAR_WIDTH = width - TAB_BAR_PADDING * 2; // Actual width of tab bar
const TAB_WIDTH = TAB_BAR_WIDTH / TAB_COUNT;

// Map route keys to display names
const routeLabels = {
  Home: 'Home',
  Bookings: 'Bookings',
  Wallet: 'Wallet',
  Settings: 'Settings',
  Profile: 'Profile',
};

function LiquidGlassTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const labelOpacity = useRef(new Animated.Value(0)).current;
  const labelWidth = useRef(new Animated.Value(0)).current;

  // Label widths for each tab
  const labelWidths = {
    Home: 40,
    Bookings: 65,
    Wallet: 50,
    Settings: 60,
    Profile: 50,
  };

  useEffect(() => {
    const currentRoute = state.routes[state.index];
    const label = routeLabels[currentRoute.name] || currentRoute.name;
    const labelW = labelWidths[label] || 50;

    // Animate label appearance
    Animated.parallel([
      Animated.timing(labelOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(labelWidth, {
        toValue: labelW,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [state.index]);

  return (
    <View style={[styles.tabBarContainer, { bottom: 20 + insets.bottom }]}>
      <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
        <View style={styles.tabBar}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const focused = state.index === index;
            const label = routeLabels[route.name] || route.name;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const iconName = {
              Home: 'home',
              Bookings: 'calendar',
              Wallet: 'wallet',
              Settings: 'cog',
              Profile: 'account',
            }[route.name] || 'circle';

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                style={styles.tabButton}
                activeOpacity={0.7}
              >
                <View style={styles.tabContent}>
                  <Animated.View
                    style={[
                      styles.iconContainer,
                      focused && styles.iconContainerActive,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={iconName}
                      size={focused ? 24 : 22}
                      color={focused ? '#FFFFFF' : '#8E8E93'}
                    />
                  </Animated.View>
                  {focused && (
                    <Animated.View
                      style={[
                        styles.labelContainer,
                        {
                          opacity: labelOpacity,
                          width: labelWidth,
                        },
                      ]}
                    >
                      <Text style={styles.labelText} numberOfLines={1}>
                        {label}
                      </Text>
                    </Animated.View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

export default function BottomTabNavigator() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 20 + insets.bottom,
          left: 20,
          right: 20,
          height: 70,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#8E8E93',
      }}
      tabBar={(props) => <LiquidGlassTabBar {...props} />}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name="home" color={color} size={24} />
          ),
        }}
      />
      <Tab.Screen 
        name="Bookings" 
        component={BookingsScreen}
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name="calendar" color={color} size={24} />
          ),
        }}
      />
      <Tab.Screen 
        name="Wallet" 
        component={WalletScreen}
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name="wallet" color={color} size={24} />
          ),
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name="cog" color={color} size={24} />
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name="account" color={color} size={24} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 70,
    // bottom is set dynamically with insets
  },
  blurContainer: {
    borderRadius: 35,
    overflow: 'hidden',
    backgroundColor: 'rgba(44, 44, 46, 0.7)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  tabBar: {
    flexDirection: 'row',
    height: 70,
    alignItems: 'center',
    justifyContent: 'space-around',
    position: 'relative',
    paddingHorizontal: 10,
  },
  liquidIndicator: {
    position: 'absolute',
    left: 0, // Start at 0, position will be controlled by translateX
    width: 45, // Smaller base width for tighter selector
    height: 50,
    borderRadius: 20, // Keep at 20 as requested
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    top: 10,
    zIndex: 1, // Behind icons but visible
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    zIndex: 2, // Above indicator so icons appear inside selector
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
    zIndex: 3, // Ensure content is above selector
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    zIndex: 3, // Icon should be visible above selector
  },
  iconContainerActive: {
    marginRight: 6, // Reduced spacing to match calculation
  },
  labelContainer: {
    overflow: 'hidden',
    justifyContent: 'center',
  },
  labelText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 2, // Reduced margin to match calculation
    textAlign: 'left',
  },
});
