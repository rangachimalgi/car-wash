import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
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
        <View style={[style, { backgroundColor: '#2A2A2A', alignItems: 'center', justifyContent: 'center' }]}>
          <MaterialCommunityIcons name="image-outline" size={32} color="#666666" />
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
      <StatusBar style="light" />
      <CustomHeader navigation={navigation} />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Special For You Section */}
        <View style={styles.specialForYouSection}>
          <Text style={styles.specialForYouTitle}>#WooshSpecialForYou</Text>
          {/* <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity> */}
        </View>

        {/* Special Offer Banner */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.offerScrollView}
          contentContainerStyle={styles.offerScrollContent}
        >
          <View style={styles.offerCard}>
            <ServiceImage 
              uri="https://images.unsplash.com/photo-1502877338535-766e1452684a?w=400&h=300&fit=crop&auto=format&blur=50"
              style={styles.offerBackgroundImage}
              imageKey="offer1"
            />
            <View style={styles.offerOverlay} />
            <View style={styles.offerBadge}>
              <Text style={styles.offerBadgeText}>Limited time!</Text>
            </View>
            <View style={styles.offerContent}>
              <Text style={styles.offerTitle}>Get Special Offer</Text>
              <View style={styles.offerDiscountRow}>
                <Text style={styles.offerUpTo}>Up to</Text>
                <Text style={styles.offerPercentage}>40%</Text>
              </View>
              <Text style={styles.offerDescription}>All Washing Service Available | T&C Applied</Text>
            </View>
            <TouchableOpacity style={styles.claimButton}>
              <Text style={styles.claimButtonText}>Claim</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.offerCard}>
            <ServiceImage 
              uri="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&auto=format&blur=50"
              style={styles.offerBackgroundImage}
              imageKey="offer2"
            />
            <View style={styles.offerOverlay} />
            <View style={styles.offerBadge}>
              <Text style={styles.offerBadgeText}>Limited time!</Text>
            </View>
            <View style={styles.offerContent}>
              <Text style={styles.offerTitle}>Get Special Offer</Text>
              <View style={styles.offerDiscountRow}>
                <Text style={styles.offerUpTo}>Up to</Text>
                <Text style={styles.offerPercentage}>30%</Text>
              </View>
              <Text style={styles.offerDescription}>All Washing Service Available | T&C Applied</Text>
            </View>
            <TouchableOpacity style={styles.claimButton}>
              <Text style={styles.claimButtonText}>Claim</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Services Section */}
        <View style={styles.servicesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Woosh Services</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.servicesScrollView}
            contentContainerStyle={styles.servicesScrollContent}
          >
            <TouchableOpacity style={styles.serviceIconContainer} activeOpacity={0.7}>
              <View style={styles.serviceIconCircle}>
                <MaterialCommunityIcons name="car-wash" size={32} color="#31C5FF" />
              </View>
              <Text style={styles.serviceIconLabel}>Exterior C...</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.serviceIconContainer} activeOpacity={0.7}>
              <View style={styles.serviceIconCircle}>
                <MaterialCommunityIcons name="vacuum" size={32} color="#31C5FF" />
              </View>
              <Text style={styles.serviceIconLabel}>Vacuum C...</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.serviceIconContainer} activeOpacity={0.7}>
              <View style={styles.serviceIconCircle}>
                <MaterialCommunityIcons name="car-seat" size={32} color="#31C5FF" />
              </View>
              <Text style={styles.serviceIconLabel}>Interior C...</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.serviceIconContainer} activeOpacity={0.7}>
              <View style={styles.serviceIconCircle}>
                <MaterialCommunityIcons name="car-cog" size={32} color="#31C5FF" />
              </View>
              <Text style={styles.serviceIconLabel}>Engine Ba...</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Car Wash and Bike Wash Cards */}
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

        {/* Popular Service Provider Section */}
        <View style={styles.popularSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Service Provider</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.providersScrollView}
            contentContainerStyle={styles.providersScrollContent}
          >
            <TouchableOpacity style={styles.providerCard} activeOpacity={0.9}>
              <View style={styles.providerRatingBadge}>
                <MaterialCommunityIcons name="star" size={14} color="#FFD700" />
                <Text style={styles.providerRating}>4.8</Text>
              </View>
              <TouchableOpacity style={styles.providerBookmark}>
                <MaterialCommunityIcons name="bookmark-outline" size={20} color="#31C5FF" />
              </TouchableOpacity>
              <ServiceImage 
                uri="https://images.unsplash.com/photo-1502877338535-766e1452684a?w=300&h=200&fit=crop"
                style={styles.providerImage}
                imageKey="provider1"
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.providerCard} activeOpacity={0.9}>
              <View style={styles.providerRatingBadge}>
                <MaterialCommunityIcons name="star" size={14} color="#FFD700" />
                <Text style={styles.providerRating}>4.8</Text>
              </View>
              <TouchableOpacity style={styles.providerBookmark}>
                <MaterialCommunityIcons name="bookmark-outline" size={20} color="#31C5FF" />
              </TouchableOpacity>
              <ServiceImage 
                uri="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop"
                style={styles.providerImage}
                imageKey="provider2"
              />
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Why Choose Woosh Section */}
        <View style={styles.whyChooseSection}>
          <Text style={styles.whyChooseTitle}>Why Choose Woosh</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.whyChooseScrollView}
            contentContainerStyle={styles.whyChooseScrollContent}
          >
            <View style={[styles.whyChooseCard, styles.whyChooseCardBlue]}>
              <ServiceImage 
                uri="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&auto=format"
                style={styles.whyChooseImage}
                imageKey="whyChoose1"
              />
              <View style={styles.whyChooseTextContent}>
                <Text style={styles.whyChooseCardTitle}>Car Wash at Your Home</Text>
                <Text style={styles.whyChooseCardDescription}>No waiting, No travel — we come to you.</Text>
              </View>
            </View>
            <View style={[styles.whyChooseCard, styles.whyChooseCardGreen]}>
              <ServiceImage 
                uri="https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=300&h=200&fit=crop&auto=format"
                style={styles.whyChooseImage}
                imageKey="whyChoose2"
              />
              <View style={styles.whyChooseTextContent}>
                <Text style={styles.whyChooseCardTitle}>Professional Service</Text>
                <Text style={styles.whyChooseCardDescription}>Expert team with top-quality equipment and products.</Text>
              </View>
            </View>
            <View style={[styles.whyChooseCard, styles.whyChooseCardPurple]}>
              <ServiceImage 
                uri="https://images.unsplash.com/photo-1502877338535-766e1452684a?w=300&h=200&fit=crop&auto=format"
                style={styles.whyChooseImage}
                imageKey="whyChoose3"
              />
              <View style={styles.whyChooseTextContent}>
                <Text style={styles.whyChooseCardTitle}>Affordable Pricing</Text>
                <Text style={styles.whyChooseCardDescription}>Best value for money with transparent pricing.</Text>
              </View>
            </View>
          </ScrollView>
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
  specialForYouSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  specialForYouTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  seeAllText: {
    fontSize: 14,
    color: '#31C5FF',
    fontWeight: '600',
  },
  offerScrollView: {
    marginVertical: 10,
  },
  offerScrollContent: {
    paddingHorizontal: 16,
    paddingRight: 32,
  },
  offerCard: {
    width: width - 32,
    height: 180,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    marginRight: 16,
    padding: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  offerBackgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.3,
  },
  offerOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  offerBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 2,
  },
  offerBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#000000',
  },
  offerContent: {
    marginTop: 32,
    marginRight: 100,
    zIndex: 2,
    position: 'relative',
  },
  offerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  offerDiscountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  offerUpTo: {
    fontSize: 14,
    color: '#FFFFFF',
    marginRight: 4,
  },
  offerPercentage: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#31C5FF',
  },
  offerDescription: {
    fontSize: 11,
    color: '#CCCCCC',
    lineHeight: 14,
  },
  claimButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#31C5FF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 2,
  },
  claimButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
  },
  servicesSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  servicesScrollView: {
    marginHorizontal: -16,
  },
  servicesScrollContent: {
    paddingHorizontal: 16,
  },
  serviceIconContainer: {
    alignItems: 'center',
    marginRight: 20,
    width: 80,
  },
  serviceIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#31C5FF',
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceIconLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  mainServicesSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
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
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
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
    color: '#FFFFFF',
    textAlign: 'center',
  },
  popularSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  providersScrollView: {
    marginHorizontal: -16,
  },
  providersScrollContent: {
    paddingHorizontal: 16,
  },
  providerCard: {
    width: 200,
    height: 160,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    marginRight: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  providerRatingBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  providerRating: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  providerBookmark: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
  },
  providerImage: {
    width: '100%',
    height: '100%',
  },
  whyChooseSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  whyChooseTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  whyChooseScrollView: {
    marginHorizontal: -16,
  },
  whyChooseScrollContent: {
    paddingHorizontal: 16,
  },
  whyChooseCard: {
    width: width - 64,
    height: 180,
    borderRadius: 20,
    marginRight: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    padding: 16,
    alignItems: 'center',
  },
  whyChooseCardBlue: {
    backgroundColor: '#E6F4FF',
  },
  whyChooseCardGreen: {
    backgroundColor: '#E6FFE6',
  },
  whyChooseCardPurple: {
    backgroundColor: '#F0E6FF',
  },
  whyChooseImage: {
    width: 120,
    height: 150,
    borderRadius: 12,
    marginRight: 16,
  },
  whyChooseTextContent: {
    flex: 1,
    justifyContent: 'center',
  },
  whyChooseCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  whyChooseCardDescription: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
});
