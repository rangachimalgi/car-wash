import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BackHeader from '../components/BackHeader';
import ServiceCard from '../components/ServiceCard';

export default function CarWashScreen({ navigation }) {
  const [expanded, setExpanded] = useState({
    basic: true,
    premium: true,
    deep: true,
  });

  const toggleExpanded = (key) => {
    setExpanded({ ...expanded, [key]: !expanded[key] });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <BackHeader navigation={navigation} title="Car Wash" />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.browseTitle}>browse woosh!</Text>
          <View style={styles.serviceSection}>
            {expanded.basic && (
              <ServiceCard
                imageUri="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop"
                title="Basic Routine Cleaning"
                description="Professional cleaning service for your vehicle"
                price="₹99"
                duration="30 mins"
                onReadMore={() => navigation.navigate('CarWashDetails', { serviceTitle: 'Basic Routine Cleaning' })}
                onBookService={() => console.log('Book service - Basic')}
                onCardPress={() => navigation.navigate('CarWashDetails', { serviceTitle: 'Basic Routine Cleaning' })}
              />
            )}
          </View>

          <View style={styles.serviceSection}>
            {expanded.premium && (
              <ServiceCard
                imageUri="https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&h=400&fit=crop"
                title="Premium Car Care"
                description="Premium deep cleaning and detailing service"
                price="₹309"
                duration="2 hours"
                onReadMore={() => navigation.navigate('CarWashDetails', { serviceTitle: 'Premium Car Care' })}
                onBookService={() => console.log('Book service - Premium')}
                onCardPress={() => navigation.navigate('CarWashDetails', { serviceTitle: 'Premium Car Care' })}
              />
            )}
          </View>

          <View style={styles.serviceSection}>
            {expanded.deep && (
              <ServiceCard
                imageUri="https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&h=400&fit=crop"
                title="360 Deep Cleaning"
                description="Complete 360-degree deep cleaning and sanitization"
                price="₹889"
                duration="3 hours"
                onReadMore={() => navigation.navigate('CarWashDetails', { serviceTitle: '360 Deep Cleaning' })}
                onBookService={() => console.log('Book service - Deep')}
                onCardPress={() => navigation.navigate('CarWashDetails', { serviceTitle: '360 Deep Cleaning' })}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  content: {
    paddingTop: 20,
  },
  browseTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  serviceSection: {
    marginBottom: 12,
  },
});
