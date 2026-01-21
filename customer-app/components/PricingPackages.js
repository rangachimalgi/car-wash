import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

export default function PricingPackages({ oneTimePrice = 299, serviceTitle = 'Service', serviceImage = '', duration = '50 mins', navigation, onSelectionChange, packages = null }) {
  const [expandedSection, setExpandedSection] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState('oneTime'); // Default to one time wash
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Use packages from API if available, otherwise calculate (fallback)
  const monthlyPackages = packages?.monthly?.map((pkg, index) => ({
    id: `m${index + 1}`,
    ...pkg,
  })) || [
    { id: '1', times: 2, discount: 5, price: oneTimePrice * 2 * 0.95, perWash: (oneTimePrice * 2 * 0.95) / 2 },
    { id: '2', times: 4, discount: 10, price: oneTimePrice * 4 * 0.90, perWash: (oneTimePrice * 4 * 0.90) / 4 },
    { id: '3', times: 6, discount: 15, price: oneTimePrice * 6 * 0.85, perWash: (oneTimePrice * 6 * 0.85) / 6 },
    { id: '4', times: 8, discount: 20, price: oneTimePrice * 8 * 0.80, perWash: (oneTimePrice * 8 * 0.80) / 8 },
  ];

  const quarterlyPackages = packages?.quarterly?.map((pkg, index) => ({
    id: `q${index + 1}`,
    ...pkg,
  })) || [
    { id: 'q1', times: 6, discount: 15, price: oneTimePrice * 6 * 0.85 * 3, perWash: (oneTimePrice * 6 * 0.85 * 3) / 18 },
    { id: 'q2', times: 12, discount: 20, price: oneTimePrice * 12 * 0.80 * 3, perWash: (oneTimePrice * 12 * 0.80 * 3) / 36 },
    { id: 'q3', times: 18, discount: 25, price: oneTimePrice * 18 * 0.75 * 3, perWash: (oneTimePrice * 18 * 0.75 * 3) / 54 },
  ];

  const yearlyPackages = packages?.yearly?.map((pkg, index) => ({
    id: `y${index + 1}`,
    ...pkg,
  })) || [
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
            <MaterialCommunityIcons name="check-circle" size={20} color={theme.accent} />
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
            <MaterialCommunityIcons name="check-circle" size={24} color={theme.accent} />
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
          color={theme.textPrimary} 
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
          color={theme.textPrimary} 
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
          color={theme.textPrimary} 
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
export function AddToCartButton({ selectedPackage, oneTimePrice, totalPrice, duration, serviceId, serviceTitle, serviceImage, selectedAddOns = [], addOnServices = [], navigation, onSelectSlot }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Use totalPrice if provided, otherwise calculate from base price
  const displayPrice = totalPrice !== undefined ? totalPrice : (() => {
    if (selectedPackage === 'oneTime') {
      return oneTimePrice;
    }
    if (selectedPackage && selectedPackage.price) {
      return Math.round(selectedPackage.price);
    }
    return oneTimePrice;
  })();

  const handlePress = () => {
    if (!selectedPackage) return;

    const selectedAddOnsDetails = selectedAddOns.map(addOnId => {
      return addOnServices.find(a => a._id === addOnId);
    }).filter(Boolean);

    const item = selectedPackage === 'oneTime'
      ? {
          id: `oneTime_${Date.now()}`,
          serviceId,
          title: `${serviceTitle} - 1 Time Wash`,
          image: serviceImage || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&auto=format',
          price: Math.round(displayPrice),
          quantity: 1,
          addOns: selectedAddOnsDetails,
          packageType: 'OneTime',
        }
      : {
          id: `pkg_${selectedPackage.id}_${Date.now()}`,
          serviceId,
          title: `${serviceTitle} - ${selectedPackage.type} (${selectedPackage.times}x/month)`,
          image: serviceImage || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&auto=format',
          price: Math.round(selectedPackage.price || displayPrice),
          quantity: 1,
          addOns: selectedAddOnsDetails,
          packageType: selectedPackage.type,
          packageTimes: selectedPackage.times,
        };

    if (onSelectSlot) {
      onSelectSlot(item);
      return;
    }

    if (navigation) {
      navigation.navigate('SlotSelection', { pendingItem: item });
    }
  };

  return (
    <View style={styles.addToCartContainer}>
      <View style={styles.addToCartLeft}>
        <Text style={styles.addToCartPrice}>₹{Math.round(displayPrice)}</Text>
        <Text style={styles.addToCartDuration}>{duration || '50 mins'}</Text>
      </View>
      <TouchableOpacity 
        style={styles.addToCartButton}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Text style={styles.addToCartButtonText}>Select Slot</Text>
        <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const createStyles = theme => StyleSheet.create({
  container: {
    marginTop: 24,
  },
  oneTimeSection: {
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    marginBottom: 16,
  },
  oneTimeSectionSelected: {
    borderColor: theme.accent,
  },
  circlePlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.textSecondary,
  },
  oneTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  oneTimeLabel: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  oneTimePrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.textPrimary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.cardBorder,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.textPrimary,
  },
  packagesList: {
    marginBottom: 16,
  },
  packageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.cardBackground,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    position: 'relative',
  },
  packageItemSelected: {
    borderColor: theme.accent,
    backgroundColor: theme.accentSoft,
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
    color: theme.textPrimary,
    marginBottom: 4,
  },
  packageDiscount: {
    fontSize: 12,
    color: theme.accent,
  },
  packageRight: {
    alignItems: 'flex-end',
  },
  packagePerWash: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.accent,
    marginBottom: 4,
  },
  packageTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.textPrimary,
  },
  addToCartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  addToCartLeft: {
    flex: 1,
  },
  addToCartPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.accent,
    marginBottom: 4,
  },
  addToCartDuration: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.accent,
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
