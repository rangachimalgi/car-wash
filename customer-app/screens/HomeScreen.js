import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Image, Share } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import CustomHeader from '../components/CustomHeader';
import CustomerTestimonials from '../components/CustomerTestimonials';
import SeeTheDifference from '../components/SeeTheDifference';
import SeeTheTransformations from '../components/SeeTheTransformations';
import { useTheme } from '../theme/ThemeContext';
import { getMedia } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getReferralInfo } from '../services/walletApi';
// import { getPopularServices } from '../services/serviceApi';

const sliderCardWidth = Dimensions.get('window').width;
const cardWidth = (sliderCardWidth - 48) / 3; // 3 cards with padding
const sliderImages = [
  { source: require('../assets/carbanner.jpeg'), key: 'special1' },
  { source: require('../assets/carbannertwo.jpeg'), key: 'special2' },
  { source: require('../assets/carbannerthree.jpeg'), key: 'special3' },
  { source: require('../assets/carbannerfour.jpeg'), key: 'special4' },
];

export default function HomeScreen({ navigation }) {
  const [imageErrors, setImageErrors] = useState({});
  const sliderRef = useRef(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [media, setMedia] = useState({ testimonials: [], transformations: [], seeTheDifference: [] });
  const [referralInfo, setReferralInfo] = useState({
    code: '',
    totalReferrals: 0,
    totalEarnings: 0,
    perReferralRewardReferred: 100,
  });
  const { theme, isLightMode } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleImageError = (key) => {
    setImageErrors(prev => ({ ...prev, [key]: true }));
  };

  const ServiceImage = ({ uri, source, style, imageKey }) => {
    if (imageErrors[imageKey]) {
      return (
        <View style={{
          width: sliderCardWidth,
          height: 260,
          backgroundColor: theme.cardBackground,
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <MaterialCommunityIcons 
            name="image-outline" 
            size={32} 
            color={theme.textSecondary} 
          />
        </View>
      );
    }
    return (
      <Image 
        source={source || { uri }}
        style={style}
        resizeMode="contain"
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

  useEffect(() => {
    let cancelled = false;
    getMedia()
      .then((data) => { if (!cancelled) setMedia(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadReferral = async () => {
      try {
        const storedPhone = await AsyncStorage.getItem('authPhone');
        if (!storedPhone) return;
        const referral = await getReferralInfo(storedPhone);
        if (cancelled || !referral) return;
        setReferralInfo((prev) => ({
          ...prev,
          code: referral.referralCode || '',
          totalReferrals: referral.totalReferrals || 0,
          totalEarnings: referral.totalReferralEarnings || 0,
          perReferralRewardReferred: referral.perReferralRewardReferred ?? prev.perReferralRewardReferred,
        }));
      } catch (_) {}
    };

    loadReferral();
    return () => { cancelled = true; };
  }, []);

  // Fetch popular services - commented out as section is removed
  // useEffect(() => {
  //   const fetchPopularServices = async () => {
  //     setLoadingPopular(true);
  //     try {
  //       const response = await getPopularServices({ limit: 2 });
  //       if (response.success) {
  //         setPopularServices(response.data || []);
  //       }
  //     } catch (error) {
  //       console.error('Error fetching popular services:', error);
  //     } finally {
  //       setLoadingPopular(false);
  //     }
  //   };

  //   fetchPopularServices();
  // }, []);

  // const handleServicePress = (service) => {
  //   const screenName = service.category === 'BikeWash' ? 'BikeWashDetails' : 'CarWashDetails';
  //   navigation.navigate(screenName, {
  //     serviceId: service._id,
  //     serviceTitle: service.name,
  //     price: `₹${service.basePrice}`,
  //     duration: service.duration,
  //     service: service,
  //   });
  // };

  return (
    <View style={styles.container}>
      <StatusBar style={isLightMode ? 'dark' : 'light'} />
      <CustomHeader navigation={navigation} />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >       
        {/* Woosh Special Slider */}
        <View style={styles.sliderWrap}>
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
                <Image 
                  source={item.source}
                  style={styles.sliderImage}
                  resizeMode="cover"
                />
              </View>
            ))}
          </ScrollView>

          <View style={styles.sliderDotsInside}>
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
        </View>

        {/* Services Section */}
        <View style={styles.servicesSection}>
          <View style={styles.sectionHeader}>
            {/*
            <Text style={styles.sectionTitle}>Woosh Services</Text>
            */}
            {/* <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity> */}
          </View>
          {/* Top row: Car Wash + Car Wash Packages */}
          <View style={styles.topServicesRow}>
            <TouchableOpacity
              style={styles.halfCard}
              onPress={() => navigation.navigate('CarWash')}
              activeOpacity={0.9}
            >
              <Text style={styles.halfCardTitle}>Car Wash</Text>
              <Text style={styles.halfCardTitle}>& Care</Text>
              <View style={styles.halfCardImageWrap}>
                <Image
                  source={require('../assets/carpicseven.png')}
                  style={styles.halfCardImage}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.halfCard}
              onPress={() => navigation.navigate('Packages')}
              activeOpacity={0.9}
            >
              <Text style={styles.halfCardTitle}>Monthly Packages</Text>
              {/* <Text style={styles.halfCardTitle}>PACKAGES</Text> */}
              {/* <View style={styles.offerPill}>
                <Text style={styles.offerPillText}>EXTRA 50% OFF</Text>
              </View> */}
              <View style={styles.halfCardImageWrap}>
                <Image
                  source={require('../assets/carpicnine.png')}
                  style={styles.halfCardImage}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>
          </View>

          {/* Below: Bike + Auto cards */}
          <View style={styles.bottomServicesRow}>
            <TouchableOpacity
              style={styles.halfCard}
              onPress={() => navigation.navigate('BikeWash')}
              activeOpacity={0.9}
            >
              <Text style={styles.halfCardTitle}>Bike Wash</Text>
              <Text style={styles.halfCardTitle}>& Care</Text>
              <View style={styles.halfCardImageWrap}>
                <Image
                  source={require('../assets/carpiceight.png')}
                  style={styles.halfCardImage}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.halfCard}
              onPress={() => navigation.navigate('CarWash')}
              activeOpacity={0.9}
            >
              <Text style={styles.halfCardTitle}>Auto Wash</Text>
              <Text style={styles.halfCardTitle}>& Care</Text>
              <View style={styles.halfCardImageWrap}>
                <Image
                  source={require('../assets/auto.png')}
                  style={styles.halfCardImage}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.dailyCleaningTile}
            onPress={() => navigation.navigate('PackageDetails')}
            activeOpacity={0.9}
          >
            <View style={styles.dailyCleaningImageWrap}>
              <Image
                source={require('../assets/dailyService.png')}
                style={styles.dailyCleaningImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.dailyCleaningTextWrap}>
              <Text style={styles.dailyCleaningTitle}>Daily Cleaning Services</Text>
              <Text style={styles.dailyCleaningSubtitle}>
                Custom monthly plans for interior, exterior and daily care.
              </Text>
            </View>
            <View style={styles.dailyCleaningChevronWrap}>
              <MaterialCommunityIcons name="chevron-right" size={22} color={theme.textPrimary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Refer & Earn Section */}
        <View style={styles.homeReferralSection}>
          <View style={styles.homeReferralBanner}>
            <View style={styles.homeReferralLeft}>
              <View style={styles.homeReferralTitleWrap}>
                <MaterialCommunityIcons name="gift-outline" size={18} color={theme.accent} />
                <Text style={styles.homeReferralTitle}>Refer &amp; Earn</Text>
              </View>
              <Text style={styles.homeReferralSubtitle}>
                Invite friends and both of you get ₹{referralInfo.perReferralRewardReferred || 100} in wallet.
              </Text>
              <View style={styles.homeReferralCodeChip}>
                <Text style={styles.homeReferralCodeChipLabel}>Code</Text>
                <Text style={styles.homeReferralCodeChipValue}>{referralInfo.code || 'COMINGSOON'}</Text>
              </View>
              <Text style={styles.homeReferralStats}>
                {referralInfo.totalReferrals} joined  |  ₹{referralInfo.totalEarnings} earned
              </Text>
            </View>
            <View style={styles.homeReferralRight}>
              <View style={styles.homeReferralIconWrap}>
                <MaterialCommunityIcons name="gift" size={24} color={theme.accent} />
              </View>
              <TouchableOpacity
                style={styles.homeReferralShareBtn}
                activeOpacity={0.85}
                onPress={() => {
                  const codeText = referralInfo.code || 'your Woosh referral code';
                  Share.share({
                    message: `Use my Woosh referral code ${codeText} and we both get ₹${referralInfo.perReferralRewardReferred || 100} in wallet on your first order!`,
                  }).catch(() => {});
                }}
              >
                <MaterialCommunityIcons name="share-variant" size={16} color="#000000" />
                <Text style={styles.homeReferralShareText}>Invite</Text>
              </TouchableOpacity>
            </View>
          </View>
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
                source={require('../assets/whychoose.jpeg')}
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
                source={require('../assets/whychooseone.jpeg')}
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
                source={require('../assets/whychoose.jpeg')}
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

        <CustomerTestimonials items={media.testimonials.length ? media.testimonials : undefined} />
        <SeeTheDifference slides={media.seeTheDifference.length ? media.seeTheDifference : undefined} />
        <SeeTheTransformations items={media.transformations.length ? media.transformations : undefined} />
      </ScrollView>
    </View>
  );
}

const createStyles = theme => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  homeReferralSection: {
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 18,
  },
  homeReferralBanner: {
    backgroundColor: theme.cardBackground,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  homeReferralLeft: {
    flex: 1,
  },
  homeReferralRight: {
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 118,
    paddingVertical: 2,
  },
  homeReferralIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeReferralTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  homeReferralTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.textPrimary,
  },
  homeReferralSubtitle: {
    fontSize: 12,
    color: theme.textSecondary,
    lineHeight: 17,
    marginBottom: 8,
  },
  homeReferralCodeChip: {
    backgroundColor: theme.accentSoft,
    borderRadius: 999,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 7,
  },
  homeReferralCodeChipLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  homeReferralCodeChipValue: {
    fontSize: 12,
    fontWeight: '900',
    color: theme.textPrimary,
    letterSpacing: 0.5,
  },
  homeReferralStats: {
    fontSize: 11,
    color: theme.textSecondary,
  },
  homeReferralShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.accent,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  homeReferralShareText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
  },
  homeReferralCodeRow: {
    backgroundColor: theme.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  homeReferralCodeLabel: {
    fontSize: 11,
    color: theme.textSecondary,
    marginBottom: 2,
  },
  homeReferralCodeValue: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.textPrimary,
    letterSpacing: 0.6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
 
  seeAllText: {
    fontSize: 14,
    color: theme.accent,
    fontWeight: '600',
  },
  sliderScrollView: {
    marginVertical: 6,
  },
  sliderWrap: {
    position: 'relative',
  },
  sliderScrollContent: {
    paddingHorizontal: 0,
  },
  sliderCard: {
    width: sliderCardWidth,
    height: 300,
    backgroundColor: theme.cardBackground,
    overflow: 'hidden',
  },
  sliderImage: {
    width: '100%',
    height: '100%',
  },
  sliderDotsInside: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  sliderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.cardBorder,
  },
  sliderDotActive: {
    width: 22,
    borderRadius: 8,
    backgroundColor: theme.accent,
  },
  servicesSection: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
  },
  topServicesRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 2,
  },
  bottomServicesRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 14,
  },
  dailyCleaningTile: {
    marginTop: 14,
    backgroundColor: theme.cardBackground,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 132,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dailyCleaningImageWrap: {
    width: 132,
    height: 104,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dailyCleaningTextWrap: {
    flex: 1,
    paddingRight: 6,
  },
  dailyCleaningTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.textPrimary,
  },
  dailyCleaningSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '600',
    lineHeight: 17,
  },
  dailyCleaningChevronWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dailyCleaningImage: {
    width: 122,
    height: 92,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  halfCard: {
    flex: 1,
    backgroundColor: theme.cardBackground,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    overflow: 'hidden',
    // ~40% shorter than before (190 -> 114)
    minHeight: 180,
  },
  halfCardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.textPrimary,
    letterSpacing: 0.3,
  },
  offerPill: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#D91F26',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  offerPillText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.4,
  },
  halfCardImageWrap: {
    flex: 1,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halfCardImage: {
    width: '120%',
    height: 140,
  },
  wideBikeCard: {
    marginTop: 14,
    backgroundColor: theme.cardBackground,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    overflow: 'hidden',
  },
  wideBikeImageWrap: {
    width: 140,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  wideBikeImage: {
    width: '120%',
    height: '120%',
  },
  wideBikeTextWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  wideBikeTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.textPrimary,
    letterSpacing: 0.3,
  },
  wideBikeSubtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: theme.textSecondary,
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
  providerCardWrapper: {
    width: 200,
    marginRight: 16,
  },
  providerCard: {
    width: 200,
    height: 160,
    backgroundColor: theme.cardBackground,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 8,
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
  providerServiceName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  whyChooseSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
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
    width: sliderCardWidth - 64,
    height: 120,
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
    height: 120,
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
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  emptyContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: theme.textSecondary,
  },
});
