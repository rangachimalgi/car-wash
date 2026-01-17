import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import ServiceDetailsBottomSheet from '../components/ServiceDetailsBottomSheet';

const { width, height } = Dimensions.get('window');
const IMAGE_SECTION_HEIGHT = height * 0.65;

export default function BikeWashDetailsScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { serviceTitle = "Basic Bike Wash", price = "₹79", duration = "20 mins" } = route.params || {};
  const bottomSheetRef = useRef(null);

  // Determine image and specs based on service
  const getServiceData = () => {
    if (serviceTitle.includes("Basic")) {
      return {
        imageUri: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&h=400&fit=crop&auto=format',
        specs: { duration: "20 mins", rating: "4.3", weight: "Quick" }
      };
    } else if (serviceTitle.includes("Premium")) {
      return {
        imageUri: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&h=400&fit=crop&auto=format',
        specs: { duration: "1 hour", rating: "4.7", weight: "Standard" }
      };
    } else {
      return {
        imageUri: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&h=400&fit=crop&auto=format',
        specs: { duration: "2 hours", rating: "4.5", weight: "Deep" }
      };
    }
  };

  const serviceData = getServiceData();

  // Render bottom sheet content
  const renderBottomSheetContent = () => (
    <BottomSheetScrollView 
      contentContainerStyle={styles.bottomSheetContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.categoryText}>BIKE WASH SERVICE</Text>
      <View style={styles.titleRow}>
        <Text style={styles.serviceTitle}>{serviceTitle}</Text>
        <Text style={styles.distanceText}>6 km</Text>
      </View>
      <View style={styles.ratingRow}>
        <MaterialCommunityIcons name="star" size={20} color="#FFFFFF" />
        <MaterialCommunityIcons name="star" size={20} color="#FFFFFF" />
        <MaterialCommunityIcons name="star" size={20} color="#FFFFFF" />
        <MaterialCommunityIcons name="star" size={20} color="#FFFFFF" />
        <MaterialCommunityIcons name="star-half-full" size={20} color="#FFFFFF" />
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.viewButton} activeOpacity={0.8}>
          <Text style={styles.viewButtonText}>View available</Text>
        </TouchableOpacity>
        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>{price}</Text>
          <Text style={styles.priceUnit}>service</Text>
        </View>
      </View>
      
      {/* Additional Content */}
      <View style={styles.detailsSection}>
        <Text style={styles.bottomSheetTitle}>Service Details</Text>
        <Text style={styles.bottomSheetText}>
          Our professional bike and scooter wash service provides comprehensive cleaning for your two-wheeler. 
          We use premium products and eco-friendly solutions to ensure your bike looks spotless 
          while being gentle on the environment. Our certified technicians are trained to handle 
          all types of bikes and scooters with care and precision.
        </Text>
        
        <Text style={styles.bottomSheetSubtitle}>What's Included:</Text>
        <Text style={styles.bottomSheetText}>
          • Exterior hand wash and dry{'\n'}
          • Wheel and rim cleaning{'\n'}
          • Chain cleaning and lubrication{'\n'}
          • Seat and handlebar cleaning{'\n'}
          • Dashboard and console wipe down{'\n'}
          • Engine area cleaning{'\n'}
          • Undercarriage cleaning{'\n'}
          • Mirror and light cleaning{'\n'}
          • Exterior polish application{'\n'}
          • Tire shine treatment
        </Text>

        <Text style={styles.bottomSheetSubtitle}>Service Process:</Text>
        <Text style={styles.bottomSheetText}>
          Our service follows a systematic approach to ensure thorough cleaning. We start with a 
          pre-rinse to remove loose dirt and debris, followed by a gentle hand wash using premium 
          pH-balanced soap. Each section of your bike is carefully cleaned and dried with 
          microfiber towels to prevent water spots. Special attention is given to the chain, 
          wheels, and engine area with professional-grade cleaning products safe for all surfaces.
        </Text>

        <Text style={styles.bottomSheetSubtitle}>Benefits:</Text>
        <Text style={styles.bottomSheetText}>
          • Protects your bike's paint and finish{'\n'}
          • Maintains resale value{'\n'}
          • Eco-friendly cleaning solutions{'\n'}
          • Time-saving convenience{'\n'}
          • Professional equipment and techniques{'\n'}
          • Flexible scheduling options{'\n'}
          • Satisfaction guaranteed
        </Text>

        <Text style={styles.bottomSheetSubtitle}>Pricing & Packages:</Text>
        <Text style={styles.bottomSheetText}>
          Our pricing is transparent with no hidden fees. The service price includes all materials, 
          labor, and quality assurance. We offer various packages to suit different needs and budgets. 
          Regular customers can benefit from our loyalty program with discounts and special offers.
        </Text>

        <Text style={styles.bottomSheetSubtitle}>Why Choose Us:</Text>
        <Text style={styles.bottomSheetText}>
          With over 5 years of experience in the two-wheeler care industry, we've built a reputation 
          for excellence. Our team consists of certified professionals who undergo regular training 
          to stay updated with the latest techniques and products. We use only premium, eco-friendly 
          products that are safe for your bike and the environment. Customer satisfaction is our 
          top priority, and we stand behind our work with a satisfaction guarantee.
        </Text>

        <Text style={styles.bottomSheetSubtitle}>Booking & Scheduling:</Text>
        <Text style={styles.bottomSheetText}>
          Booking your service is quick and easy. Simply select your preferred date and time through 
          our app, and we'll confirm your appointment. We offer flexible scheduling to accommodate 
          your busy lifestyle, including early morning and evening slots. Same-day bookings are 
          available subject to availability. You'll receive reminders before your appointment to 
          ensure you don't miss it.
        </Text>

        <Text style={styles.bottomSheetSubtitle}>What to Expect:</Text>
        <Text style={styles.bottomSheetText}>
          On the day of your service, our team will arrive at your location at the scheduled time. 
          The entire process typically takes 20-45 minutes depending on your bike size and the 
          package selected. You can watch the process or leave your bike with us - we're fully 
          insured and trustworthy. After completion, we'll do a final inspection with you to ensure 
          everything meets your expectations.
        </Text>

        <Text style={styles.bottomSheetSubtitle}>Customer Reviews:</Text>
        <Text style={styles.bottomSheetText}>
          "Best bike wash service I've ever used! My bike looks brand new every time." - Vikram R.{'\n'}
          "Professional, punctual, and thorough. Highly recommend!" - Sneha P.{'\n'}
          "Great value for money. The team is friendly and does excellent work." - Rohan K.
        </Text>

        <Text style={styles.bottomSheetSubtitle}>Additional Information:</Text>
        <Text style={styles.bottomSheetText}>
          Our team of experienced professionals ensures every detail is taken care of. We offer 
          flexible scheduling and can accommodate your busy lifestyle. All our services come with 
          a satisfaction guarantee - if you're not happy with the results, we'll make it right. 
          Book your service today and experience the difference professional bike care makes!
        </Text>
      </View>
    </BottomSheetScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="chevron-left" size={24} color="#000000" />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerButton}>
              <MaterialCommunityIcons name="dots-vertical" size={24} color="#000000" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main Content Area - Image Section (65% of screen) */}
      <View style={styles.mainContent}>
        {/* Image fills the entire area - extends into status bar */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: serviceData.imageUri }}
            style={styles.serviceImage}
            resizeMode="cover"
          />
        </View>

        {/* Specifications overlay on top of image */}
        <View style={styles.specsContainer}>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Duration</Text>
            <Text style={styles.specValue}>{serviceData.specs.duration}</Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Rating</Text>
            <Text style={styles.specValue}>{serviceData.specs.rating}</Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Type</Text>
            <Text style={styles.specValue}>{serviceData.specs.weight}</Text>
          </View>
          {/* QR Code Button */}
          <TouchableOpacity style={styles.qrButton}>
            <MaterialCommunityIcons name="qrcode-scan" size={24} color="#000000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Sheet */}
      <ServiceDetailsBottomSheet ref={bottomSheetRef}>
        {renderBottomSheetContent()}
      </ServiceDetailsBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#28282A',
  },
  headerContainer: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingBottom: 12,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  mainContent: {
    backgroundColor: 'transparent',
    marginTop: 0,
    height: IMAGE_SECTION_HEIGHT,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  specsContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    paddingLeft: 20,
    paddingTop: 80,
    justifyContent: 'flex-start',
    zIndex: 2,
    width: '45%',
  },
  specItem: {
    marginBottom: 32,
  },
  specLabel: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 8,
  },
  specValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
  qrButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  serviceImage: {
    width: '100%',
    height: '100%',
  },
  bottomSheetContent: {
    padding: 20,
    paddingBottom: 100,
  },
  detailsSection: {
    marginTop: 24,
  },
  categoryText: {
    fontSize: 12,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  distanceText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flex: 1,
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  priceUnit: {
    fontSize: 12,
    color: '#9E9E9E',
    textDecorationLine: 'underline',
    marginTop: 4,
  },
  bottomSheetTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  bottomSheetSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 12,
  },
  bottomSheetText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
    opacity: 0.8,
  },
});
