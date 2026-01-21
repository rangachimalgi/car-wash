import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

const { width } = Dimensions.get('window');

export default function ServiceCard({
  imageUri,
  title,
  description,
  price,
  duration,
  onReadMore,
  onBookService,
  onCardPress,
}) {
  const [imageError, setImageError] = useState(false);
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <TouchableOpacity 
      style={styles.serviceCard}
      onPress={onCardPress}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        {!imageError ? (
          <Image 
            source={{ uri: imageUri }}
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
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDescription}>{description}</Text>
        <View style={styles.cardInfo}>
          <Text style={styles.cardPrice}>{price}</Text>
          <Text style={styles.cardDuration}>{duration}</Text>
        </View>
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
  imageContainer: {
    position: 'relative',
    margin: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  serviceImage: {
    width: width - 56,
    height: 150,
    borderRadius: 12,
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
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.accent,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  cardInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.textPrimary,
  },
  cardDuration: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
    backgroundColor: theme.accentSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cardButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
