import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import CustomHeader from '../components/CustomHeader';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 3; // 3 cards with padding

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <CustomHeader />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <View style={styles.sliderContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={styles.slider}
            >
              <View style={styles.slide}>
                <View style={styles.heroImageContainer}>
                  <View style={styles.textOverlay}>
                    <Text style={styles.wooshText}>woosh</Text>
                    <Text style={styles.tagline}>Here for your car wash, bike wash</Text>
                    <Text style={styles.description}>Book now and get sparkling clean!</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
        
        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>Recommended Services</Text>
          <View style={styles.servicesGrid}>
            <View style={styles.servicesRow}>
              <View style={styles.serviceItem}>
                <TouchableOpacity style={styles.serviceCard}></TouchableOpacity>
                <Text style={styles.serviceName}>Premium Car Wash</Text>
              </View>
              <View style={styles.serviceItem}>
                <TouchableOpacity style={styles.serviceCard}></TouchableOpacity>
                <Text style={styles.serviceName}>Standard Car Wash</Text>
              </View>
              <View style={styles.serviceItem}>
                <TouchableOpacity style={styles.serviceCard}></TouchableOpacity>
                <Text style={styles.serviceName}>360 Cleanup Car Wash</Text>
              </View>
            </View>
            <View style={styles.servicesRow}>
              <View style={styles.serviceItem}>
                <TouchableOpacity style={styles.serviceCard}></TouchableOpacity>
                <Text style={styles.serviceName}>Express Car Wash</Text>
              </View>
              <View style={styles.serviceItem}>
                <TouchableOpacity style={styles.serviceCard}></TouchableOpacity>
                <Text style={styles.serviceName}>Deep Clean Car Wash</Text>
              </View>
              <View style={styles.serviceItem}>
                <TouchableOpacity style={styles.serviceCard}></TouchableOpacity>
                <Text style={styles.serviceName}>Bike Wash</Text>
              </View>
            </View>
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
  heroSection: {
    alignItems: 'center',
    width: '100%',
  },
  sliderContainer: {
    width: width,
    height: 220,
    marginBottom: 30,
    overflow: 'hidden',
  },
  slider: {
    flex: 1,
  },
  slide: {
    width: width,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImageContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#17A9F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  wooshText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  description: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  servicesSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#38383A',
    marginBottom: 16,
  },
  servicesGrid: {
    // Grid container
  },
  servicesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  serviceItem: {
    width: cardWidth,
    alignItems: 'center',
  },
  serviceCard: {
    width: cardWidth,
    height: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#38383A',
    textAlign: 'center',
  },
});
