import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomHeader from '../components/CustomHeader';
import UpcomingWashCard from '../components/UpcomingWashCard';
import RecentServiceCard from '../components/RecentServiceCard';

export default function BookingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  // Mock data for upcoming washes
  const upcomingWashes = [
    {
      id: '1',
      serviceType: 'Car Wash',
      serviceName: 'Premium Car Wash',
      date: 'Today',
      time: '2:30 PM',
      address: '123 Main St, City',
      price: '₹599',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&auto=format',
    },
    {
      id: '2',
      serviceType: 'Bike Wash',
      serviceName: 'Basic Bike Wash',
      date: 'Tomorrow',
      time: '10:00 AM',
      address: '456 Park Ave, City',
      price: '₹299',
      image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=300&h=200&fit=crop&auto=format',
    },
  ];

  // Mock data for recent services
  const recentServices = [
    {
      id: '1',
      serviceType: 'Car Wash',
      serviceName: 'Deep Clean Car Wash',
      date: '5 days ago',
      status: 'Completed',
      price: '₹899',
      image: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=300&h=200&fit=crop&auto=format',
    },
    {
      id: '2',
      serviceType: 'Bike Wash',
      serviceName: 'Premium Bike Wash',
      date: '1 week ago',
      status: 'Completed',
      price: '₹499',
      image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=300&h=200&fit=crop&auto=format',
    },
    {
      id: '3',
      serviceType: 'Car Wash',
      serviceName: 'Basic Car Wash',
      date: '2 weeks ago',
      status: 'Completed',
      price: '₹399',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&auto=format',
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <CustomHeader navigation={navigation} />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Upcoming Wash Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Wash</Text>
          </View>
          
          {upcomingWashes.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="calendar-remove" size={64} color="#666666" />
              <Text style={styles.emptyStateText}>No upcoming washes</Text>
              <Text style={styles.emptyStateSubtext}>Book a service to see it here</Text>
            </View>
          ) : (
            upcomingWashes.map((wash) => (
              <UpcomingWashCard 
                key={wash.id} 
                wash={wash}
                onCancel={(wash) => {
                  // Handle cancel logic here
                  console.log('Cancel wash:', wash);
                }}
                onPress={() => {
                  // Handle card press if needed
                  console.log('View wash:', wash);
                }}
              />
            ))
          )}
        </View>

        {/* Recent Services Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Services</Text>
          </View>
          
          {recentServices.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="history" size={64} color="#666666" />
              <Text style={styles.emptyStateText}>No recent services</Text>
              <Text style={styles.emptyStateSubtext}>Your service history will appear here</Text>
            </View>
          ) : (
            recentServices.map((service) => (
              <RecentServiceCard 
                key={service.id} 
                service={service}
                onReBook={(service) => {
                  // Handle re-book logic here
                  console.log('Re-book service:', service);
                }}
                onPress={() => {
                  // Handle card press if needed
                  console.log('View service:', service);
                }}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#28282A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
  },
});
