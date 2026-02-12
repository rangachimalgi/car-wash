import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.35;

export default function AddOnCard({ 
  title, 
  price, 
  imageUri,
  imageSource,
  addOnId,
  isSelected = false,
  onToggle,
}) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [imageError, setImageError] = useState(false);

  const imageSourceToUse = imageUri 
    ? { uri: imageUri }
    : imageSource || null;

  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={onToggle}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        {imageSourceToUse && !imageError ? (
          <Image
            source={imageSourceToUse}
            style={styles.image}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <MaterialCommunityIcons name="image-outline" size={32} color={theme.textSecondary} />
          </View>
        )}
      </View>
      
      <View style={styles.overlay}>
        <View style={styles.overlayContent}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.price}>₹{price}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.addButton, isSelected && styles.addButtonSelected]}
          onPress={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          activeOpacity={0.8}
        >
          <Text style={[styles.addButtonText, isSelected && styles.addButtonTextSelected]}>
            {isSelected ? 'Remove' : 'Add'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = theme => StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: theme.cardBackground,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: '65%',
    backgroundColor: theme.cardBackground,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  overlayContent: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonSelected: {
    backgroundColor: '#FF4444',
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  addButtonTextSelected: {
    color: '#FFFFFF',
  },
});
