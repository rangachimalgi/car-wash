import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = Math.min(Math.max(width * 0.4, 148), 168);

export default function MonthlyPackageCard({
  title,
  price,
  perWashPrice,
  discount,
  isSelected = false,
  onSelect,
}) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={onSelect}
      activeOpacity={0.85}
    >
      {discount > 0 && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{discount}% off</Text>
        </View>
      )}

      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>

      <View style={styles.priceBlock}>
        <Text style={styles.price}>₹{price}</Text>
        {perWashPrice ? (
          <Text style={styles.perWashPrice}>₹{perWashPrice} per wash</Text>
        ) : null}
      </View>

      <View style={[styles.footerRow, isSelected && styles.footerRowSelected]}>
        {isSelected ? (
          <>
            <MaterialCommunityIcons name="check-circle" size={16} color="#FFFFFF" />
            <Text style={styles.footerTextSelected}>Selected</Text>
          </>
        ) : (
          <Text style={styles.footerText}>Select plan</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    card: {
      width: CARD_WIDTH,
      minHeight: 128,
      borderRadius: 10,
      marginRight: 10,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E5E5E5',
      padding: 12,
      justifyContent: 'space-between',
    },
    cardSelected: {
      borderWidth: 2,
      borderColor: '#000000',
      backgroundColor: '#FFFFFF',
    },
    discountBadge: {
      alignSelf: 'flex-start',
      backgroundColor: '#E8F5E9',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      marginBottom: 8,
    },
    discountText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#2E7D32',
      textTransform: 'uppercase',
      letterSpacing: 0.2,
    },
    title: {
      fontSize: 14,
      fontWeight: '700',
      color: '#000000',
      lineHeight: 18,
      minHeight: 36,
    },
    priceBlock: {
      marginTop: 8,
      marginBottom: 10,
    },
    price: {
      fontSize: 18,
      fontWeight: '800',
      color: '#000000',
    },
    perWashPrice: {
      marginTop: 2,
      fontSize: 11,
      fontWeight: '500',
      color: '#666666',
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: '#F5F5F5',
      borderWidth: 1,
      borderColor: '#EEEEEE',
    },
    footerRowSelected: {
      backgroundColor: '#000000',
      borderColor: '#000000',
    },
    footerText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#000000',
    },
    footerTextSelected: {
      fontSize: 12,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });
