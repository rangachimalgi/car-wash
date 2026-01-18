import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function PricingPackages({ oneTimePrice = 299, serviceTitle = 'Service', serviceImage = '', duration = '50 mins', navigation, onSelectionChange }) {
  const [expandedSection, setExpandedSection] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState('oneTime'); // Default to one time wash

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Calculate monthly packages based on one-time price
  const monthlyPackages = [
    { id: '1', times: 2, discount: 5, price: oneTimePrice * 2 * 0.95, perWash: (oneTimePrice * 2 * 0.95) / 2 },
    { id: '2', times: 4, discount: 10, price: oneTimePrice * 4 * 0.90, perWash: (oneTimePrice * 4 * 0.90) / 4 },
    { id: '3', times: 6, discount: 15, price: oneTimePrice * 6 * 0.85, perWash: (oneTimePrice * 6 * 0.85) / 6 },
    { id: '4', times: 8, discount: 20, price: oneTimePrice * 8 * 0.80, perWash: (oneTimePrice * 8 * 0.80) / 8 },
  ];

  // Quarterly packages (3 months)
  const quarterlyPackages = [
    { id: 'q1', times: 6, discount: 15, price: oneTimePrice * 6 * 0.85 * 3, perWash: (oneTimePrice * 6 * 0.85 * 3) / 18 },
    { id: 'q2', times: 12, discount: 20, price: oneTimePrice * 12 * 0.80 * 3, perWash: (oneTimePrice * 12 * 0.80 * 3) / 36 },
    { id: 'q3', times: 18, discount: 25, price: oneTimePrice * 18 * 0.75 * 3, perWash: (oneTimePrice * 18 * 0.75 * 3) / 54 },
  ];

  // Yearly packages (12 months)
  const yearlyPackages = [
    { id: 'y1', times: 24, discount: 25, price: oneTimePrice * 24 * 0.75 * 12, perWash: (oneTimePrice * 24 * 0.75 * 12) / 288 },
    { id: 'y2', times: 36, discount: 30, price: oneTimePrice * 36 * 0.70 * 12, perWash: (oneTimePrice * 36 * 0.70 * 12) / 432 },
    { id: 'y3', times: 48, discount: 35, price: oneTimePrice * 48 * 0.65 * 12, perWash: (oneTimePrice * 48 * 0.65 * 12) / 576 },
  ];

  const handleSelectPackage = (pkg, section) => {
    const newSelection = { ...pkg, section, type: section === 'monthly' ? 'Monthly' : section === 'quarterly' ? 'Quarterly' : 'Yearly' };
    setSelectedPackage(newSelection);
    if (onSelectionChange) {
      onSelectionChange(newSelection);
    }
  };

  const handleSelectOneTime = () => {
    setSelectedPackage('oneTime');
    if (onSelectionChange) {
      onSelectionChange('oneTime');
    }
  };

  const handleAddToCart = () => {
    if (!selectedPackage || !navigation || selectedPackage === 'oneTime') return;
    
    const packageTitle = `${serviceTitle} - ${selectedPackage.type} (${selectedPackage.times}x/month)`;
    const packagePrice = Math.round(selectedPackage.price);
    
    // Navigate to cart with the selected package
    navigation.navigate('Cart', {
      addItem: {
        id: `pkg_${selectedPackage.id}_${Date.now()}`,
        title: packageTitle,
        image: serviceImage || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&auto=format',
        price: packagePrice,
        quantity: 1,
      }
    });
  };

  const renderPackageItem = (pkg, section) => {
    const isSelected = selectedPackage?.id === pkg.id && selectedPackage?.section === section;
    return (
      <TouchableOpacity 
        key={pkg.id} 
        style={[styles.packageItem, isSelected && styles.packageItemSelected]}
        onPress={() => handleSelectPackage(pkg, section)}
        activeOpacity={0.7}
      >
        <View style={styles.packageLeft}>
          <Text style={styles.packageTimes}>{pkg.times} times/month</Text>
          <Text style={styles.packageDiscount}>{pkg.discount}% off</Text>
        </View>
        <View style={styles.packageRight}>
          <Text style={styles.packagePerWash}>₹{Math.round(pkg.perWash)}/wash</Text>
          <Text style={styles.packageTotal}>₹{Math.round(pkg.price)}</Text>
        </View>
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <MaterialCommunityIcons name="check-circle" size={20} color="#31C5FF" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* One Time Wash */}
      <TouchableOpacity 
        style={[styles.oneTimeSection, selectedPackage === 'oneTime' && styles.oneTimeSectionSelected]}
        onPress={handleSelectOneTime}
        activeOpacity={0.7}
      >
        <View style={styles.oneTimeRow}>
          <View>
            <Text style={styles.oneTimeLabel}>1 Time Wash</Text>
            <Text style={styles.oneTimePrice}>₹{oneTimePrice}</Text>
          </View>
          {selectedPackage === 'oneTime' ? (
            <MaterialCommunityIcons name="check-circle" size={24} color="#31C5FF" />
          ) : (
            <View style={styles.circlePlaceholder} />
          )}
        </View>
      </TouchableOpacity>

      {/* Monthly Packages */}
      <TouchableOpacity 
        style={styles.sectionHeader}
        onPress={() => toggleSection('monthly')}
        activeOpacity={0.7}
      >
        <Text style={styles.sectionTitle}>Monthly Packages</Text>
        <MaterialCommunityIcons 
          name={expandedSection === 'monthly' ? 'chevron-up' : 'chevron-down'} 
          size={24} 
          color="#FFFFFF" 
        />
      </TouchableOpacity>
      {expandedSection === 'monthly' && (
        <View style={styles.packagesList}>
          {monthlyPackages.map(pkg => renderPackageItem(pkg, 'monthly'))}
        </View>
      )}

      {/* Quarterly Packages */}
      <TouchableOpacity 
        style={styles.sectionHeader}
        onPress={() => toggleSection('quarterly')}
        activeOpacity={0.7}
      >
        <Text style={styles.sectionTitle}>Quarterly Packages</Text>
        <MaterialCommunityIcons 
          name={expandedSection === 'quarterly' ? 'chevron-up' : 'chevron-down'} 
          size={24} 
          color="#FFFFFF" 
        />
      </TouchableOpacity>
      {expandedSection === 'quarterly' && (
        <View style={styles.packagesList}>
          {quarterlyPackages.map(pkg => renderPackageItem(pkg, 'quarterly'))}
        </View>
      )}

      {/* Yearly Packages */}
      <TouchableOpacity 
        style={styles.sectionHeader}
        onPress={() => toggleSection('yearly')}
        activeOpacity={0.7}
      >
        <Text style={styles.sectionTitle}>Yearly Packages</Text>
        <MaterialCommunityIcons 
          name={expandedSection === 'yearly' ? 'chevron-up' : 'chevron-down'} 
          size={24} 
          color="#FFFFFF" 
        />
      </TouchableOpacity>
      {expandedSection === 'yearly' && (
        <View style={styles.packagesList}>
          {yearlyPackages.map(pkg => renderPackageItem(pkg, 'yearly'))}
        </View>
      )}

    </View>
  );
}

// Separate component for fixed Add to Cart button
export function AddToCartButton({ selectedPackage, oneTimePrice, duration, serviceTitle, serviceImage, navigation, onAddToCart }) {
  const getPrice = () => {
    if (selectedPackage === 'oneTime') {
      return oneTimePrice;
    }
    if (selectedPackage && selectedPackage.price) {
      return Math.round(selectedPackage.price);
    }
    return oneTimePrice;
  };

  const handlePress = () => {
    if (selectedPackage === 'oneTime') {
      if (!navigation) return;
      navigation.navigate('Cart', {
        addItem: {
          id: `oneTime_${Date.now()}`,
          title: `${serviceTitle} - 1 Time Wash`,
          image: serviceImage || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&auto=format',
          price: oneTimePrice,
          quantity: 1,
        }
      });
    } else if (onAddToCart) {
      onAddToCart();
    }
  };

  return (
    <View style={styles.addToCartContainer}>
      <View style={styles.addToCartLeft}>
        <Text style={styles.addToCartPrice}>₹{getPrice()}</Text>
        <Text style={styles.addToCartDuration}>{duration || '50 mins'}</Text>
      </View>
      <TouchableOpacity 
        style={styles.addToCartButton}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Text style={styles.addToCartButtonText}>Add to Cart</Text>
        <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  oneTimeSection: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
    marginBottom: 16,
  },
  oneTimeSectionSelected: {
    borderColor: '#31C5FF',
  },
  circlePlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#666666',
  },
  oneTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  oneTimeLabel: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 4,
  },
  oneTimePrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  packagesList: {
    marginBottom: 16,
  },
  packageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333333',
    position: 'relative',
  },
  packageItemSelected: {
    borderColor: '#31C5FF',
    backgroundColor: '#1A2A3A',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  packageLeft: {
    flex: 1,
  },
  packageTimes: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  packageDiscount: {
    fontSize: 12,
    color: '#31C5FF',
  },
  packageRight: {
    alignItems: 'flex-end',
  },
  packagePerWash: {
    fontSize: 14,
    fontWeight: '600',
    color: '#31C5FF',
    marginBottom: 4,
  },
  packageTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  addToCartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  addToCartLeft: {
    flex: 1,
  },
  addToCartPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#31C5FF',
    marginBottom: 4,
  },
  addToCartDuration: {
    fontSize: 14,
    color: '#000000',
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
  },
  addToCartButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
