import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

const BLACK = '#0a0a0a';
const GREY = '#6b7280';

/**
 * Woosh Black membership promo card (UI only).
 * White top, black footer, accent blue (matches app theme).
 */
export default function WooshBlackCard({
  durationMonths = 12,
  price = 499,
  originalPrice = 1200,
  savingsPercent = 40,
  onPressAdd,
}) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.accent), [theme.accent]);

  return (
    <View style={styles.outer}>
      <View style={styles.topSection}>
        <View style={styles.topLeft}>
          <View style={styles.logoWrap}>
            <Image
              source={require('../assets/appicon.png')}
              style={styles.logoImage}
              resizeMode="contain"
              accessibilityLabel="Woosh logo"
            />
          </View>
          <View style={styles.titleBlock}>
            <View style={styles.titleRow}>
              <Text style={styles.brandWoosh}>WOOSH </Text>
              <Text style={styles.brandBlack}>BLACK</Text>
              <View style={styles.infoWrap}>
                <MaterialCommunityIcons name="information-outline" size={12} color={theme.accent} />
              </View>
            </View>
            <Text style={styles.durationText}>for {durationMonths} months</Text>
          </View>
        </View>
        <View style={styles.topRight}>
          <View style={styles.priceRow}>
            <View style={styles.priceStack}>
              <Text style={styles.priceMain}>₹{price}</Text>
              <Text style={styles.priceStrike}>₹{originalPrice}</Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              activeOpacity={0.85}
              onPress={onPressAdd}
              accessibilityRole="button"
              accessibilityLabel="Add Woosh Black"
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <View style={styles.bottomSection}>
        <Text style={styles.footerText}>
          Save upto <Text style={styles.footerHighlight}>{savingsPercent}%</Text> on every service{' '}
          <Text style={styles.footerDot}>●</Text> <Text style={styles.footerBrand}>WOOSH </Text>
          <Text style={styles.footerBlackItalic}>BLACK</Text>
        </Text>
      </View>
    </View>
  );
}

function createStyles(accent) {
  return StyleSheet.create({
  outer: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: accent,
    overflow: 'hidden',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    paddingRight: 8,
  },
  logoWrap: {
    marginRight: 8,
    justifyContent: 'center',
  },
  logoImage: {
    width: 32,
    height: 32,
  },
  titleBlock: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  brandWoosh: {
    fontSize: 15,
    fontWeight: '800',
    color: BLACK,
    letterSpacing: 0.2,
  },
  brandBlack: {
    fontSize: 15,
    fontWeight: '900',
    fontStyle: 'italic',
    color: BLACK,
    letterSpacing: 0.2,
  },
  infoWrap: {
    marginLeft: 4,
    justifyContent: 'center',
  },
  durationText: {
    marginTop: 2,
    fontSize: 12,
    color: GREY,
    fontWeight: '500',
  },
  topRight: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexWrap: 'nowrap',
    gap: 10,
  },
  priceStack: {
    alignItems: 'flex-end',
  },
  priceMain: {
    fontSize: 19,
    fontWeight: '800',
    color: BLACK,
  },
  priceStrike: {
    marginTop: 2,
    fontSize: 12,
    color: GREY,
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: accent,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 7,
    minWidth: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: BLACK,
  },
  bottomSection: {
    backgroundColor: BLACK,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  footerText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 15,
  },
  footerHighlight: {
    color: accent,
    fontWeight: '800',
  },
  footerDot: {
    color: accent,
    fontSize: 10,
  },
  footerBrand: {
    color: '#fff',
    fontWeight: '700',
  },
  footerBlackItalic: {
    color: accent,
    fontStyle: 'italic',
    fontWeight: '700',
  },
  });
}
