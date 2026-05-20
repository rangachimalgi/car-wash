import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Share, AppState, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import CustomHeader from '../components/CustomHeader';
import CustomerTestimonials from '../components/CustomerTestimonials';
import SeeTheDifference from '../components/SeeTheDifference';
import SeeTheTransformations from '../components/SeeTheTransformations';
import WhyChooseWoosh from '../components/WhyChooseWoosh';
import { useTheme } from '../theme/ThemeContext';
import { backfillMediaPosters, getMedia } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getReferralInfo } from '../services/walletApi';
// import { getPopularServices } from '../services/serviceApi';

/** One slide while waiting for GET /media/public — avoids flashing old bundled banners. */
const HERO_LOADING_SLIDE = [{ key: 'hero-loading', kind: 'loading' }];
/** After fetch: no homeSliders from admin — neutral strip (not hardcoded marketing photos). */
const HERO_EMPTY_SLIDE = [{ key: 'hero-empty', kind: 'empty' }];

export default function HomeScreen({ navigation }) {
  const [imageErrors, setImageErrors] = useState({});
  const sliderRef = useRef(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [media, setMedia] = useState({
    testimonials: [],
    transformations: [],
    seeTheDifference: [],
    homeSliders: [],
    whyChooseUs: [],
  });
  const [referralInfo, setReferralInfo] = useState({
    code: '',
    totalReferrals: 0,
    totalEarnings: 0,
    perReferralRewardReferred: 100,
  });
  /** After first public media fetch (success or fail) we stop showing the loading hero. */
  const [publicMediaFetched, setPublicMediaFetched] = useState(false);
  const { theme, isLightMode } = useTheme();
  const { width: screenW } = useWindowDimensions();
  const layout = useMemo(
    () => ({ screenW, heroH: Math.round(screenW * (9 / 16)) }),
    [screenW]
  );
  const styles = useMemo(() => createStyles(theme, layout, isLightMode), [theme, layout, isLightMode]);

  const heroSlides = useMemo(() => {
    if (!publicMediaFetched) return HERO_LOADING_SLIDE;
    const raw = media.homeSliders || [];
    const list = raw.filter((m) => m?.url && String(m.url).trim());
    if (list.length > 0) {
      return list.map((m, i) => ({
        key: String(m._id ?? m.url ?? `order-${m.order ?? i}`),
        kind: 'remote',
        uri: String(m.url).trim(),
      }));
    }
    return HERO_EMPTY_SLIDE;
  }, [media.homeSliders, publicMediaFetched]);

  const handleImageError = (key) => {
    setImageErrors(prev => ({ ...prev, [key]: true }));
  };

  const ServiceImage = ({ uri, source, style, imageKey }) => {
    if (imageErrors[imageKey]) {
      return (
        <View style={{
          width: layout.screenW,
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
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / layout.screenW);
    setActiveSlide(nextIndex);
  }, [layout.screenW]);

  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => {
        const nextIndex = (prev + 1) % heroSlides.length;
        sliderRef.current?.scrollTo({ x: nextIndex * layout.screenW, animated: true });
        return nextIndex;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [heroSlides.length, layout.screenW]);

  useEffect(() => {
    const n = heroSlides.length;
    if (n === 0) return;
    setActiveSlide((i) => Math.min(i, n - 1));
  }, [heroSlides.length]);

  /** Only throttle after a successful fetch so quick tab switches are not stuck with empty media. */
  const lastMediaFetchOkAtRef = useRef(0);
  const posterBackfillRequestedRef = useRef(false);
  const reloadMedia = useCallback(async () => {
    const now = Date.now();
    if (lastMediaFetchOkAtRef.current > 0 && now - lastMediaFetchOkAtRef.current < 3000) return;
    try {
      const data = await getMedia();
      lastMediaFetchOkAtRef.current = Date.now();
      const nextMedia = {
        testimonials: data.testimonials ?? [],
        transformations: data.transformations ?? [],
        seeTheDifference: data.seeTheDifference ?? [],
        homeSliders: data.homeSliders ?? [],
        whyChooseUs: data.whyChooseUs ?? [],
      };
      setMedia(nextMedia);

      const needsPosters = [...nextMedia.testimonials, ...nextMedia.transformations].some(
        (row) =>
          row?.url &&
          /\.(mp4|webm|mov)(\?|$)/i.test(String(row.url)) &&
          !row.posterUrl
      );
      if (needsPosters && !posterBackfillRequestedRef.current) {
        posterBackfillRequestedRef.current = true;
        backfillMediaPosters().finally(() => {
          setTimeout(() => {
            lastMediaFetchOkAtRef.current = 0;
            reloadMedia();
          }, 1500);
        });
      }
    } catch (_) {
      /* keep previous media; next focus/foreground will retry */
    } finally {
      setPublicMediaFetched(true);
    }
  }, []);

  useEffect(() => {
    reloadMedia();
  }, [reloadMedia]);

  useFocusEffect(
    useCallback(() => {
      reloadMedia();
    }, [reloadMedia])
  );

  const appStateRef = useRef(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (appStateRef.current.match(/inactive|background/) && next === 'active') {
        reloadMedia();
      }
      appStateRef.current = next;
    });
    return () => sub.remove();
  }, [reloadMedia]);

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
            snapToInterval={layout.screenW}
            onMomentumScrollEnd={handleSliderScrollEnd}
            ref={sliderRef}
          >
            {heroSlides.map((item) => (
              <View key={item.key} style={styles.sliderCard}>
                {item.kind === 'loading' ? (
                  <View style={[styles.sliderHeroImage, styles.heroCentered]}>
                    <ActivityIndicator size="large" color={theme.accent} />
                  </View>
                ) : item.kind === 'empty' ? (
                  <View style={[styles.sliderHeroImage, styles.heroCentered, { backgroundColor: theme.cardBackground }]}>
                    <Text style={{ color: theme.textSecondary, fontSize: 15, textAlign: 'center', paddingHorizontal: 24 }}>
                      Add hero images in Admin → Media → Home hero slider
                    </Text>
                  </View>
                ) : (
                  <Image
                    source={{ uri: item.uri }}
                    style={styles.sliderHeroImage}
                    resizeMode="cover"
                  />
                )}
              </View>
            ))}
          </ScrollView>

          <View style={styles.sliderDotsInside}>
            {heroSlides.map((item, index) => (
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
                  source={
                    isLightMode
                      ? require('../assets/carWashCare.png')
                      : require('../assets/carWashCare.png')
                  }
                  style={styles.halfCardImage}
                  resizeMode="cover"
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
                  source={
                    isLightMode
                      ? require('../assets/monthlyPackages.png')
                      : require('../assets/monthlyPackages.png')
                  }
                  style={styles.halfCardImage}
                  resizeMode="cover"
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
                  source={
                    isLightMode
                      ? require('../assets/bikeWashCare.png')
                      : require('../assets/bikeWashCare.png')
                  }
                  style={styles.halfCardImage}
                  resizeMode="cover"
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.halfCard}
              onPress={() => navigation.navigate('AutoWash')}
              activeOpacity={0.9}
            >
              <Text style={styles.halfCardTitle}>Auto Wash</Text>
              <Text style={styles.halfCardTitle}>& Care</Text>
              <View style={styles.halfCardImageWrap}>
                <Image
                  source={require('../assets/auto.png')}
                  style={styles.halfCardImage}
                  resizeMode="cover"
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
                Invite friends and both of you get {referralInfo.perReferralRewardReferred || 100} Woosh Coins in wallet.
              </Text>
              <View style={styles.homeReferralCodeChip}>
                <Text style={styles.homeReferralCodeChipLabel}>Code</Text>
                <Text style={styles.homeReferralCodeChipValue}>{referralInfo.code || 'COMINGSOON'}</Text>
              </View>
              <Text style={styles.homeReferralStats}>
                {referralInfo.totalReferrals} joined  |  {referralInfo.totalEarnings} Woosh Coins earned
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
                    message: `Use my Woosh referral code ${codeText} and we both get ${referralInfo.perReferralRewardReferred || 100} Woosh Coins in wallet on your first order!`,
                  }).catch(() => {});
                }}
              >
                <MaterialCommunityIcons name="share-variant" size={16} color={theme.onAccent} />
                <Text style={styles.homeReferralShareText}>Invite</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <WhyChooseWoosh items={media.whyChooseUs.length ? media.whyChooseUs : undefined} />

        <CustomerTestimonials items={media.testimonials.length ? media.testimonials : undefined} />
        <SeeTheDifference slides={media.seeTheDifference.length ? media.seeTheDifference : undefined} />
        <SeeTheTransformations items={media.transformations.length ? media.transformations : undefined} />
      </ScrollView>
    </View>
  );
}

const createStyles = (theme, layout, isLightMode) => StyleSheet.create({
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
    color: theme.onAccent,
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
    width: layout.screenW,
    height: layout.heroH,
    backgroundColor: theme.cardBackground,
    overflow: 'hidden',
  },
  sliderHeroImage: {
    width: layout.screenW,
    height: layout.heroH,
  },
  sliderImage: {
    width: '100%',
    height: '100%',
  },
  heroCentered: {
    justifyContent: 'center',
    alignItems: 'center',
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
    minHeight: 96,
    overflow: 'hidden',
  },
  halfCardImage: {
    width: '100%',
    height: '100%',
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
