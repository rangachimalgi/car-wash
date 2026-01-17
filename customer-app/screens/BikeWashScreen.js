import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import BackHeader from '../components/BackHeader';
import ServiceCard from '../components/ServiceCard';

export default function BikeWashScreen({ navigation }) {
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
      <BackHeader navigation={navigation} title="Bike Wash" />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.browseTitle}>browse woosh!</Text>
          <View style={styles.serviceSection}>
            <TouchableOpacity 
              style={styles.serviceHeader}
              onPress={() => toggleExpanded('basic')}
            >
            </TouchableOpacity>
            {expanded.basic && (
              <ServiceCard
                imageUri="https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&h=400&fit=crop&auto=format"
                title="Basic Bike Wash"
                description="Quick and efficient cleaning service for your bike or scooter"
                price="₹79"
                duration="20 mins"
                onReadMore={() => navigation.navigate('BikeWashDetails', { serviceTitle: 'Basic Bike Wash', price: '₹79', duration: '20 mins' })}
                onBookService={() => console.log('Book service - Basic Bike')}
                onCardPress={() => navigation.navigate('BikeWashDetails', { serviceTitle: 'Basic Bike Wash', price: '₹79', duration: '20 mins' })}
              />
            )}
          </View>

          <View style={styles.serviceSection}>
            <TouchableOpacity 
              style={styles.serviceHeader}
              onPress={() => toggleExpanded('premium')}
            >
            </TouchableOpacity>
            {expanded.premium && (
              <ServiceCard
                imageUri="https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&h=400&fit=crop&auto=format"
                title="Premium Bike Care"
                description="Comprehensive cleaning and detailing for your two-wheeler"
                price="₹199"
                duration="1 hour"
                onReadMore={() => navigation.navigate('BikeWashDetails', { serviceTitle: 'Premium Bike Care', price: '₹199', duration: '1 hour' })}
                onBookService={() => console.log('Book service - Premium Bike')}
                onCardPress={() => navigation.navigate('BikeWashDetails', { serviceTitle: 'Premium Bike Care', price: '₹199', duration: '1 hour' })}
              />
            )}
          </View>

          <View style={styles.serviceSection}>
            <TouchableOpacity 
              style={styles.serviceHeader}
              onPress={() => toggleExpanded('deep')}
            >
            </TouchableOpacity>
            {expanded.deep && (
              <ServiceCard
                imageUri="https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&h=400&fit=crop&auto=format"
                title="360 Deep Bike Cleaning"
                description="Complete deep cleaning and sanitization for your bike"
                price="₹399"
                duration="2 hours"
                onReadMore={() => navigation.navigate('BikeWashDetails', { serviceTitle: '360 Deep Bike Cleaning', price: '₹399', duration: '2 hours' })}
                onBookService={() => console.log('Book service - Deep Bike')}
                onCardPress={() => navigation.navigate('BikeWashDetails', { serviceTitle: '360 Deep Bike Cleaning', price: '₹399', duration: '2 hours' })}
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
    backgroundColor: '#F5F5F5',
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
    color: '#000000',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  serviceSection: {
    marginBottom: 12,
  },
  serviceHeader: {
    backgroundColor: '#F0F4F8',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
