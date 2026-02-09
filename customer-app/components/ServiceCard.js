import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

const { width } = Dimensions.get('window');

export default function ServiceCard({
  imageUri,
  imageSource,
  title,
  description,
  price,
  duration,
  showActions = true,
  showDescription = true,
  onReadMore,
  onBookService,
  onCardPress,
  showViewDetailsButton = false,
  viewDetailsLabel = 'View Details',
  onViewDetails,
}) {
  const [imageError, setImageError] = useState(false);
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const toTitleCase = (value) => {
    const s = String(value || '').trim();
    if (!s) return '';
    return s
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const normalizeDuration = (d) => {
    if (!d) return '';
    const s = String(d).trim();
    const m = s.match(/^(\d+)\s*min(s)?$/i);
    if (m) return `${m[1]} mins`;
    return s;
  };

  const durationLabel = normalizeDuration(duration);
  const titleLabel = toTitleCase(title);

  return (
    <TouchableOpacity 
      style={styles.serviceCard}
      onPress={onCardPress}
      activeOpacity={0.9}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {titleLabel}
          </Text>
          {showViewDetailsButton ? (
            <TouchableOpacity
              style={styles.viewDetailsButton}
              onPress={onViewDetails || onCardPress}
              activeOpacity={0.85}
            >
              <Text style={styles.viewDetailsText}>{viewDetailsLabel}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.imageContainer}>
        {!imageError ? (
          <Image 
            source={imageSource || { uri: imageUri }}
            style={styles.serviceImage}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={[styles.serviceImage, styles.placeholderImage]}>
            <MaterialCommunityIcons name="bike" size={48} color={theme.accent} />
          </View>
        )}
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardInfoRow}>
          <Text style={styles.cardPriceLine} numberOfLines={1}>
            <Text style={styles.cardPricePrefix}>Starting </Text>
            <Text style={styles.cardPriceValue}>{price}</Text>
          </Text>
          {!!durationLabel ? (
            <View style={styles.durationRowInline}>
              <MaterialCommunityIcons name="clock-outline" size={16} color={theme.textSecondary} />
              <Text style={styles.durationText}>{durationLabel}</Text>
            </View>
          ) : (
            <View />
          )}
        </View>

        {showDescription ? (
          <Text style={styles.cardDescription} numberOfLines={3}>
            {description}
          </Text>
        ) : null}
        {/*
          Action buttons are optional. Keep component reusable for list screens where
          we only need the card tap behavior.
        */}
        {showActions ? (
          <View style={styles.cardButtons}>
            <TouchableOpacity
              style={styles.readMoreButton}
              onPress={onReadMore}
            >
              <Text style={styles.readMoreText}>Read more</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bookButton}
              onPress={onBookService}
            >
              <Text style={styles.bookText}>Book service</Text>
              <MaterialCommunityIcons name="arrow-right" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const createStyles = theme => StyleSheet.create({
  serviceCard: {
    backgroundColor: theme.cardBackground,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  cardHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: '#CBD5E1', // darker grey strip behind the name row
    borderBottomWidth: 1,
    borderBottomColor: theme.cardBorder,
  },
  imageContainer: {
    position: 'relative',
    marginHorizontal: 0,
    marginBottom: 12,
    borderRadius: 0,
    overflow: 'hidden',
  },
  serviceImage: {
    width: '100%',
    height: 165,
    borderRadius: 0,
  },
  placeholderImage: {
    backgroundColor: theme.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    padding: 16,
    paddingTop: 0,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#0B0B0B',
  },
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  cardDescription: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  cardPriceLine: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0B0B0B',
  },
  cardPricePrefix: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.textSecondary,
  },
  cardPriceValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0B0B0B',
  },
  durationRowInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  durationText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.textSecondary,
  },
  cardButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  viewDetailsButton: {
    backgroundColor: theme.accent,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0B0B0B',
  },
  readMoreButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  readMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  bookButton: {
    flex: 1,
    backgroundColor: theme.accent,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  bookText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
});
