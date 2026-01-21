import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import ServiceDetailsBottomSheet from './ServiceDetailsBottomSheet';
import ServiceCoverage from './ServiceCoverage';
import AddOnServicesList from './AddOnServicesList';
import PricingPackages, { AddToCartButton } from './PricingPackages';

const { width, height } = Dimensions.get('window');
const IMAGE_SECTION_HEIGHT = height * 0.65;

export default function ServiceDetailsLayout({
  navigation,
  route,
  serviceData,
  categoryText,
  getServiceData,
  addOnServices = [],
}) {
  const insets = useSafeAreaInsets();
  const { serviceTitle, price, duration } = route?.params || {};
  const bottomSheetRef = useRef(null);
  const [selectedPackage, setSelectedPackage] = useState('oneTime');
  const [selectedAddOns, setSelectedAddOns] = useState([]); // Array of add-on IDs

  // Get data from API - all data comes from serviceData now
  const data = getServiceData ? getServiceData() : {};
  // Use basePrice from API (serviceData) - this is the source of truth
  const oneTimePrice = serviceData?.basePrice || parseInt(price?.replace(/[₹,]/g, '')) || 0;

  // Toggle add-on selection
  const toggleAddOn = (addOnId) => {
    setSelectedAddOns(prev => {
      if (prev.includes(addOnId)) {
        // Remove if already selected
        return prev.filter(id => id !== addOnId);
      } else {
        // Add if not selected
        return [...prev, addOnId];
      }
    });
  };

  // Calculate total price: base price + selected add-ons
  const calculateTotalPrice = () => {
    let basePrice = 0;
    
    // Get base price based on selected package
    if (selectedPackage === 'oneTime') {
      basePrice = oneTimePrice;
    } else if (selectedPackage && selectedPackage.price) {
      basePrice = selectedPackage.price;
    } else {
      basePrice = oneTimePrice;
    }

    // Add selected add-ons prices
    const addOnsTotal = selectedAddOns.reduce((total, addOnId) => {
      const addOn = addOnServices.find(a => a._id === addOnId);
      return total + (addOn?.price || 0);
    }, 0);

    return basePrice + addOnsTotal;
  };

  const totalPrice = calculateTotalPrice();


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
            source={{ uri: data.imageUri }}
            style={styles.serviceImage}
            resizeMode="cover"
          />
        </View>

        {/* Specifications overlay on top of image */}
        <View style={styles.specsContainer}>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Duration</Text>
            <Text style={styles.specValue}>{data.specs?.duration}</Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Rating</Text>
            <Text style={styles.specValue}>{data.specs?.rating}</Text>
          </View>
        </View>
      </View>

      {/* Bottom Sheet */}
      <ServiceDetailsBottomSheet 
        ref={bottomSheetRef}
        footer={
          <View style={styles.addToCartFooter}>
            <AddToCartButton
              selectedPackage={selectedPackage}
              oneTimePrice={oneTimePrice}
              totalPrice={totalPrice}
              duration={data.specs?.duration}
              serviceTitle={serviceData?.name || serviceTitle}
              serviceImage={data.imageUri}
              selectedAddOns={selectedAddOns}
              addOnServices={addOnServices}
              navigation={navigation}
              onAddToCart={() => {
                if (selectedPackage && selectedPackage !== 'oneTime' && navigation) {
                  const currentServiceTitle = serviceData?.name || serviceTitle;
                  const packageTitle = `${currentServiceTitle} - ${selectedPackage.type} (${selectedPackage.times}x/month)`;
                  const packagePrice = Math.round(selectedPackage.price);
                  
                  // Get selected add-ons details
                  const selectedAddOnsDetails = selectedAddOns.map(addOnId => {
                    return addOnServices.find(a => a._id === addOnId);
                  }).filter(Boolean);
                  
                  navigation.navigate('Cart', {
                    addItem: {
                      id: `pkg_${selectedPackage.id}_${Date.now()}`,
                      title: packageTitle,
                      image: data.imageUri || serviceData?.image || '',
                      price: Math.round(totalPrice),
                      quantity: 1,
                      addOns: selectedAddOnsDetails,
                    }
                  });
                }
              }}
            />
          </View>
        }
      >
        <BottomSheetScrollView 
          contentContainerStyle={styles.bottomSheetContent}
          showsVerticalScrollIndicator={false}
        >
            <Text style={styles.categoryText}>{categoryText}</Text>
            <View style={styles.titleRow}>
              <Text style={styles.serviceTitle}>{serviceData?.name || serviceTitle}</Text>
            </View>
            {serviceData?.description ? (
              <Text style={styles.serviceDescription}>{serviceData.description}</Text>
            ) : null}
            <View style={styles.ratingRow}>
              {[...Array(5)].map((_, i) => {
                const rating = parseFloat(data.specs?.rating || 0);
                const filledStars = Math.floor(rating);
                const hasHalfStar = rating % 1 >= 0.5;
                let iconName = 'star-outline';
                if (i < filledStars) {
                  iconName = 'star';
                } else if (i === filledStars && hasHalfStar) {
                  iconName = 'star-half-full';
                }
                return (
                  <MaterialCommunityIcons 
                    key={i}
                    name={iconName} 
                    size={20} 
                    color="#FFD700" 
                  />
                );
              })}
            </View>
            {/* <View style={styles.actionRow}>
              <TouchableOpacity style={styles.viewButton} activeOpacity={0.8}>
                <Text style={styles.viewButtonText}>View available</Text>
              </TouchableOpacity>
              <View style={styles.priceContainer}>
                <Text style={styles.priceText}>{price}</Text>
                <Text style={styles.priceUnit}>service</Text>
              </View>
            </View> */}
            
            {/* Pricing Packages */}
            <PricingPackages 
              oneTimePrice={oneTimePrice}
              serviceTitle={serviceData?.name || serviceTitle}
              serviceImage={data.imageUri}
              duration={data.specs?.duration}
              navigation={navigation}
              onSelectionChange={setSelectedPackage}
              packages={serviceData?.packages}
            />
            
            {/* Service Coverage Table */}
            <ServiceCoverage 
              included={data.included || []}
              notIncluded={data.notIncluded || []}
            />
            
            {/* Add-On Services List */}
            {addOnServices.length > 0 && (
              <AddOnServicesList 
                services={addOnServices}
                maxVisible={4}
                selectedAddOns={selectedAddOns}
                onToggleAddOn={toggleAddOn}
              />
            )}
        </BottomSheetScrollView>
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
  serviceImage: {
    width: '100%',
    height: '100%',
  },
  bottomSheetContent: {
    padding: 20,
    paddingBottom: 160,
  },
  addToCartFooter: {
    backgroundColor: '#28282A',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#333333',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
  serviceDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.85,
    marginBottom: 16,
    lineHeight: 20,
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
});
