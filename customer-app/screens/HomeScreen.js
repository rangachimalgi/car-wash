import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import CustomHeader from '../components/CustomHeader';
import { useTheme } from '../theme/ThemeContext';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 3; // 3 cards with padding
const sliderImages = [
  { uri: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200&h=800&fit=crop&auto=format', key: 'special1' },
  { uri: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=800&fit=crop&auto=format', key: 'special2' },
  { uri: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&h=800&fit=crop&auto=format', key: 'special3' },
  { uri: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&h=800&fit=crop&auto=format', key: 'special4' },
];
const sliderCardWidth = width;

export default function HomeScreen({ navigation }) {
  const [imageErrors, setImageErrors] = useState({});
  const sliderRef = useRef(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const { theme, isLightMode } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleImageError = (key) => {
    setImageErrors(prev => ({ ...prev, [key]: true }));
  };

  const ServiceImage = ({ uri, style, imageKey }) => {
    if (imageErrors[imageKey]) {
      return (
        <View style={[style, { backgroundColor: theme.cardBackground, alignItems: 'center', justifyContent: 'center' }]}>
          <MaterialCommunityIcons name="image-outline" size={32} color={theme.textSecondary} />
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

  const handleSliderScrollEnd = useCallback((event) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / sliderCardWidth);
    setActiveSlide(nextIndex);
  }, []);

  useEffect(() => {
    if (sliderImages.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlide(prev => {
        const nextIndex = (prev + 1) % sliderImages.length;
        sliderRef.current?.scrollTo({ x: nextIndex * sliderCardWidth, animated: true });
        return nextIndex;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style={isLightMode ? 'dark' : 'light'} />
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

        {/* Woosh Special Slider */}
        <ScrollView 
          horizontal 
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.sliderScrollView}
          contentContainerStyle={styles.sliderScrollContent}
          decelerationRate="fast"
          snapToInterval={sliderCardWidth}
          onMomentumScrollEnd={handleSliderScrollEnd}
          ref={sliderRef}
        >
          {sliderImages.map(item => (
            <View key={item.key} style={styles.sliderCard}>
              <ServiceImage 
                uri={item.uri}
                style={styles.sliderImage}
                imageKey={item.key}
              />
            </View>
          ))}
        </ScrollView>
        <View style={styles.sliderDots}>
          {sliderImages.map((item, index) => (
            <View
              key={`${item.key}-dot`}
              style={[
                styles.sliderDot,
                index === activeSlide && styles.sliderDotActive,
              ]}
            />
          ))}
        </View>

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
                <MaterialCommunityIcons name="car-wash" size={32} color="#85E4FC" />
              </View>
              <Text style={styles.serviceIconLabel}>Exterior C...</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.serviceIconContainer} activeOpacity={0.7}>
              <View style={styles.serviceIconCircle}>
                <MaterialCommunityIcons name="vacuum" size={32} color="#85E4FC" />
              </View>
              <Text style={styles.serviceIconLabel}>Vacuum C...</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.serviceIconContainer} activeOpacity={0.7}>
              <View style={styles.serviceIconCircle}>
                <MaterialCommunityIcons name="car-seat" size={32} color="#85E4FC" />
              </View>
              <Text style={styles.serviceIconLabel}>Interior C...</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.serviceIconContainer} activeOpacity={0.7}>
              <View style={styles.serviceIconCircle}>
                <MaterialCommunityIcons name="car-cog" size={32} color="#85E4FC" />
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
                <MaterialCommunityIcons name="bookmark-outline" size={20} color="#85E4FC" />
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
                <MaterialCommunityIcons name="bookmark-outline" size={20} color="#85E4FC" />
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

const createStyles = theme => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
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
    color: theme.textPrimary,
  },
  seeAllText: {
    fontSize: 14,
    color: theme.accent,
    fontWeight: '600',
  },
  sliderScrollView: {
    marginVertical: 10,
  },
  sliderScrollContent: {
    paddingHorizontal: 0,
  },
  sliderCard: {
    width: width,
    height: 200,
    backgroundColor: theme.cardBackground,
    borderRadius: 0,
    marginRight: 0,
    overflow: 'hidden',
    position: 'relative',
  },
  sliderImage: {
    width: '100%',
    height: '100%',
  },
  sliderDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
    gap: 6,
  },
  sliderDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.cardBorder,
  },
  sliderDotActive: {
    width: 18,
    borderRadius: 6,
    backgroundColor: theme.accent,
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
    color: theme.textPrimary,
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
    borderWidth: 1,
    borderColor: theme.cardBorder,
    backgroundColor: theme.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceIconLabel: {
    fontSize: 12,
    color: theme.textPrimary,
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
    backgroundColor: theme.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.cardBorder,
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
    color: theme.textPrimary,
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
    backgroundColor: theme.cardBackground,
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
    backgroundColor: theme.cardBorder,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  providerRating: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textPrimary,
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
    color: theme.textPrimary,
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
