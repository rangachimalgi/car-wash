import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import BackHeader from '../components/BackHeader';

export default function BikeWashScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <BackHeader navigation={navigation} />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Bike/Scooter Wash Services</Text>
          <Text style={styles.description}>
            Professional washing services for bikes and scooters to keep them clean and shiny.
          </Text>
          <Text style={styles.sectionTitle}>Available Services</Text>
          <Text style={styles.serviceItem}>• Bike Wash</Text>
          <Text style={styles.serviceItem}>• Scooter Wash</Text>
          <Text style={styles.serviceItem}>• Premium Bike Wash</Text>
          <Text style={styles.serviceItem}>• Express Bike Wash</Text>
          <Text style={styles.serviceItem}>• Deep Clean Bike Wash</Text>
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
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#38383A',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#38383A',
    marginBottom: 16,
  },
  serviceItem: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
    lineHeight: 24,
  },
});
