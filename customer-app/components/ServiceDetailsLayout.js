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

  const data = serviceData || (getServiceData ? getServiceData() : {});
  
  const oneTimePrice = parseInt(price?.replace(/[₹,]/g, '')) || 299;


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
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Type</Text>
            <Text style={styles.specValue}>{data.specs?.weight}</Text>
          </View>
          {/* QR Code Button */}
          <TouchableOpacity style={styles.qrButton}>
            <MaterialCommunityIcons name="qrcode-scan" size={24} color="#000000" />
          </TouchableOpacity>
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
              duration={data.specs?.duration}
              serviceTitle={serviceTitle}
              serviceImage={data.imageUri}
              navigation={navigation}
              onAddToCart={() => {
                if (selectedPackage && selectedPackage !== 'oneTime' && navigation) {
                  const packageTitle = `${serviceTitle} - ${selectedPackage.type} (${selectedPackage.times}x/month)`;
                  const packagePrice = Math.round(selectedPackage.price);
                  
                  navigation.navigate('Cart', {
                    addItem: {
                      id: `pkg_${selectedPackage.id}_${Date.now()}`,
                      title: packageTitle,
                      image: data.imageUri || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&auto=format',
                      price: packagePrice,
                      quantity: 1,
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
              <Text style={styles.serviceTitle}>{serviceTitle}</Text>
              <Text style={styles.distanceText}>6 km</Text>
            </View>
            <View style={styles.ratingRow}>
              <MaterialCommunityIcons name="star" size={20} color="#FFD700" />
              <MaterialCommunityIcons name="star" size={20} color="#FFD700" />
              <MaterialCommunityIcons name="star" size={20} color="#FFD700" />
              <MaterialCommunityIcons name="star" size={20} color="#FFD700" />
              <MaterialCommunityIcons name="star-half-full" size={20} color="#FFD700" />
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
            
            {/* Pricing Packages */}
            <PricingPackages 
              oneTimePrice={oneTimePrice}
              serviceTitle={serviceTitle}
              serviceImage={data.imageUri}
              duration={data.specs?.duration}
              navigation={navigation}
              onSelectionChange={setSelectedPackage}
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
    paddingBottom: 20,
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
