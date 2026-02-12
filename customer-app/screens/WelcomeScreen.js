import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Dimensions, 
  TouchableOpacity, 
  Image 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import CustomHeader from '../components/CustomHeader';

const { width } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Section */}
        <View style={styles.bannerWrapper}>
          <View style={styles.heroBanner}>
            <Image
              source={require('../assets/welcomebanner.jpeg')}
              style={styles.heroImage}
              resizeMode="cover"
            />
          </View>
          
          {/* Header on top of banner */}
          <View style={styles.headerWrapper}>
            <CustomHeader navigation={navigation} />
          </View>
        </View>

        {/* Main Service Cards - Overlapping */}
        <View style={styles.serviceCardsContainer}>
          {/* Car/Bike Wash & Care Card */}
          <TouchableOpacity 
            style={styles.serviceCard}
            onPress={() => navigation.navigate('MainTabs')}
            activeOpacity={0.9}
          >
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>CAR WASH </Text>
              <Text style={styles.cardTitle}>& CARE</Text>
              <View style={styles.cardImageContainer}>
                <Image
                  source={require('../assets/carpicseven.png')}
                  style={styles.cardImage}
                  resizeMode="contain"
                />
              </View>
            </View>
          </TouchableOpacity>

          {/* Bike Wash & Care Card */}
          <TouchableOpacity 
            style={styles.serviceCard}
            onPress={() => navigation.navigate('MainTabs')}
            activeOpacity={0.9}
          >
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>BIKE WASH</Text>
              <Text style={styles.cardTitle}>& CARE</Text>
              {/* <View style={styles.offerBadge}>
                <Text style={styles.offerText}>Upto 50% Off</Text>
              </View> */}
              <View style={styles.cardImageContainer}>
                <Image
                  source={require('../assets/carpiceight.png')}
                  style={styles.cardImage}
                  resizeMode="contain"
                />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Insurance Section */}
        <View style={styles.insuranceCard}>
          <View style={styles.insuranceLeft}>
            <Text style={styles.insuranceTitle}>CAR / BIKE INSURANCE</Text>
            <Text style={styles.insuranceSubtitle}>EXPLORE OUR INSURANCE PARTNERS</Text>
            
            {/* <View style={styles.rewardsContainer}>
              <Text style={styles.rewardsText}>Get Hoora Points Rewards</Text>
              <Text style={styles.pointsText}>Upto 5000</Text>
            </View> */}
          </View>
          <View style={styles.insuranceRight}>
            <Image
              source={require('../assets/insurance.png')}
              style={styles.insuranceImage}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
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
    paddingBottom: 20,
  },
  bannerWrapper: {
    position: 'relative',
  },
  headerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  // Hero Banner Styles
  heroBanner: {
    width: '100%',
    height: 400,
    overflow: 'hidden',
    position: 'relative',
    paddingTop: 100,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },

  // Service Cards Styles
  serviceCardsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginTop: -40,
    marginBottom: 20,
    zIndex: 5,
  },
  serviceCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 20,
    minHeight: 240,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    flex: 1,
    padding: 8,
    justifyContent: 'flex-start',
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  offerBadge: {
    backgroundColor: '#FFF4CC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  offerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D4AF37',
  },
  cardImageContainer: {
    height: 170,
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },

  // Insurance Card Styles
  insuranceCard: {
    marginHorizontal: 16,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: 180,
  },
  insuranceLeft: {
    flex: 1,
    paddingRight: 16,
  },
  insuranceTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  insuranceSubtitle: {
    fontSize: 11,
    color: '#666',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  rewardsContainer: {
    backgroundColor: '#FFF4CC',
    padding: 12,
    borderRadius: 12,
  },
  rewardsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D4AF37',
    marginBottom: 4,
  },
  pointsText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000',
  },
  insuranceRight: {
    width: width * 0.3,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insuranceImage: {
    width: '100%',
    height: '120%',
  },
});
