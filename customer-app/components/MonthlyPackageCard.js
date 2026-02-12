import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.35;

export default function MonthlyPackageCard({ 
  title, 
  price,
  perWashPrice,
  times,
  discount,
  packageId,
  isSelected = false,
  onSelect,
}) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <TouchableOpacity 
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={onSelect}
      activeOpacity={0.9}
    >
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={2}>{title}</Text>
          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discount}% OFF</Text>
            </View>
          )}
        </View>
        
        <View style={styles.priceSection}>
          <Text style={styles.price}>₹{price}</Text>
          {perWashPrice && (
            <Text style={styles.perWashPrice}> • ₹{perWashPrice}/wash</Text>
          )}
        </View>
        
        <TouchableOpacity 
          style={[styles.selectButton, isSelected && styles.selectButtonSelected]}
          onPress={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          activeOpacity={0.8}
        >
          <Text style={[styles.selectButtonText, isSelected && styles.selectButtonTextSelected]}>
            {isSelected ? 'Selected' : 'Select'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = theme => StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    minHeight: 130,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#E5E5E5',
  },
  cardSelected: {
    borderColor: '#66abf1',
    backgroundColor: '#F0F8FF',
  },
  content: {
    padding: 12,
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    flex: 1,
    lineHeight: 18,
  },
  discountBadge: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  discountText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  perWashPrice: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
  },
  selectButton: {
    backgroundColor: '#000000',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  selectButtonSelected: {
    backgroundColor: '#66abf1',
  },
  selectButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  selectButtonTextSelected: {
    color: '#FFFFFF',
  },
});
