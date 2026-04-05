import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EarningsHistoryScreen from '../screens/EarningsHistoryScreen';

const Tab = createBottomTabNavigator();

// Simple theme matching the employee app design
const theme = {
  background: '#FFFFFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  cardBorder: '#E2E8F0',
};

function SimpleTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), []);

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const label = descriptors[route.key]?.options?.tabBarLabel ?? route.name;

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
          Home: focused ? 'home' : 'home-outline',
          Earnings: focused ? 'cash' : 'cash',
          Profile: focused ? 'account' : 'account-outline',
        }[route.name] || 'circle-outline';

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tabButton}
            activeOpacity={0.8}
          >
            <View>
              <MaterialCommunityIcons
                name={iconName}
                size={24}
                color={focused ? theme.textPrimary : theme.textSecondary}
              />
            </View>
            <Text style={[styles.tabLabel, focused && styles.tabLabelActive]} numberOfLines={1}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function MainTabs({ onLogout, employeeId, navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 70 + Math.max(insets.bottom, 10),
          backgroundColor: theme.background,
          borderTopWidth: 1,
          borderTopColor: theme.cardBorder,
          elevation: 12,
        },
        tabBarActiveTintColor: theme.textPrimary,
        tabBarInactiveTintColor: theme.textSecondary,
      }}
      tabBar={(props) => <SimpleTabBar {...props} />}
    >
      <Tab.Screen
        name="Home"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'home' : 'home-outline'}
              color={color}
              size={24}
            />
          ),
        }}
      >
        {(props) => <HomeScreen {...props} employeeId={employeeId} />}
      </Tab.Screen>
      <Tab.Screen
        name="Earnings"
        options={{
          title: 'Earnings',
          tabBarLabel: 'Earnings',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'cash-multiple' : 'cash-multiple'}
              color={color}
              size={24}
            />
          ),
        }}
        component={EarningsHistoryScreen}
      />
      <Tab.Screen 
        name="Profile" 
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons 
              name={focused ? 'account' : 'account-outline'} 
              color={color} 
              size={24} 
            />
          ),
        }}
      >
        {(props) => <ProfileScreen {...props} onLogout={onLogout} employeeId={employeeId} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

const createStyles = (theme) => StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    paddingTop: 10,
    backgroundColor: theme.background,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  tabLabelActive: {
    color: theme.textPrimary,
    fontWeight: '800',
  },
});
