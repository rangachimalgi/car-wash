import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CustomHeader from '../components/CustomHeader';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 3; // 3 cards with padding

export default function HomeScreen({ navigation }) {
  const [imageErrors, setImageErrors] = useState({});

  const handleImageError = (key) => {
    setImageErrors(prev => ({ ...prev, [key]: true }));
  };

  const ServiceImage = ({ uri, style, imageKey }) => {
    if (imageErrors[imageKey]) {
      return (
        <View style={[style, { backgroundColor: '#E5E5E5', alignItems: 'center', justifyContent: 'center' }]}>
          <MaterialCommunityIcons name="image-outline" size={32} color="#999999" />
        </View>
      );
    }
    return (
      <Image 
        source={{ uri }}
        style={style}
        resizeMode="cover"
        onError={() => handleImageError(imageKey)}
      />
    );
  };

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
        
        <View style={styles.mainServicesSection}>
          <View style={styles.mainServicesRow}>
            <View style={styles.mainServiceItem}>
              <TouchableOpacity 
                style={styles.mainServiceCard}
                onPress={() => navigation.navigate('CarWash')}
                activeOpacity={0.9}
              >
                <ServiceImage 
                  uri="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop"
                  style={styles.mainServiceImage}
                  imageKey="carWash"
                />
              </TouchableOpacity>
              <Text style={styles.mainServiceName}>Car Wash</Text>
            </View>
            <View style={styles.mainServiceItem}>
              <TouchableOpacity 
                style={styles.mainServiceCard}
                onPress={() => navigation.navigate('BikeWash')}
                activeOpacity={0.9}
              >
                <ServiceImage 
                  uri="https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&h=400&fit=crop&auto=format"
                  style={styles.mainServiceImage}
                  imageKey="bikeWash"
                />
              </TouchableOpacity>
              <Text style={styles.mainServiceName}>Bike/Scooter Wash</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>Recommended Services</Text>
          <View style={styles.servicesGrid}>
            <View style={styles.servicesRow}>
              <View style={styles.serviceItem}>
                <TouchableOpacity style={styles.serviceCard} activeOpacity={0.9}>
                  <ServiceImage 
                    uri="https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=300&h=200&fit=crop"
                    style={styles.serviceImage}
                    imageKey="premiumCarWash"
                  />
                </TouchableOpacity>
                <Text style={styles.serviceName}>Premium Car Wash</Text>
              </View>
              <View style={styles.serviceItem}>
                <TouchableOpacity style={styles.serviceCard} activeOpacity={0.9}>
                  <ServiceImage 
                    uri="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop"
                    style={styles.serviceImage}
                    imageKey="standardCarWash"
                  />
                </TouchableOpacity>
                <Text style={styles.serviceName}>Standard Car Wash</Text>
              </View>
              <View style={styles.serviceItem}>
                <TouchableOpacity style={styles.serviceCard} activeOpacity={0.9}>
                  <ServiceImage 
                    uri="https://images.unsplash.com/photo-1502877338535-766e1452684a?w=300&h=200&fit=crop"
                    style={styles.serviceImage}
                    imageKey="cleanupCarWash"
                  />
                </TouchableOpacity>
                <Text style={styles.serviceName}>360 Cleanup Car Wash</Text>
              </View>
            </View>
            <View style={styles.servicesRow}>
              <View style={styles.serviceItem}>
                <TouchableOpacity style={styles.serviceCard} activeOpacity={0.9}>
                  <ServiceImage 
                    uri="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop"
                    style={styles.serviceImage}
                    imageKey="expressCarWash"
                  />
                </TouchableOpacity>
                <Text style={styles.serviceName}>Express Car Wash</Text>
              </View>
              <View style={styles.serviceItem}>
                <TouchableOpacity style={styles.serviceCard} activeOpacity={0.9}>
                  <ServiceImage 
                    uri="https://images.unsplash.com/photo-1502877338535-766e1452684a?w=300&h=200&fit=crop"
                    style={styles.serviceImage}
                    imageKey="deepCleanCarWash"
                  />
                </TouchableOpacity>
                <Text style={styles.serviceName}>Deep Clean Car Wash</Text>
              </View>
              <View style={styles.serviceItem}>
                <TouchableOpacity style={styles.serviceCard} activeOpacity={0.9}>
                  <ServiceImage 
                    uri="https://images.unsplash.com/photo-1558980664-1db506751c6a?w=300&h=200&fit=crop"
                    style={styles.serviceImage}
                    imageKey="bikeWashService"
                  />
                </TouchableOpacity>
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
  mainServicesSection: {
    paddingHorizontal: 16,
    paddingTop: 30,
    paddingBottom: 20,
  },
  mainServicesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mainServiceItem: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  mainServiceCard: {
    width: '100%',
    height: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  mainServiceImage: {
    width: '100%',
    height: '100%',
  },
  mainServiceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#38383A',
    textAlign: 'center',
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
    overflow: 'hidden',
  },
  serviceImage: {
    width: '100%',
    height: '100%',
  },
  serviceName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#38383A',
    textAlign: 'center',
  },
});
