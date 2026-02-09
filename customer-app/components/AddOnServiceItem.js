import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

const LIGHT_BLUE = '#85E4FC';

export default function AddOnServiceItem({ 
  imageUri, 
  imageSource,
  title, 
  price, 
  addOnId,
  isSelected = false,
  onToggle,
  buttonVariant = 'text', // 'text' | 'plus'
}) {
  const [imageError, setImageError] = useState(false);
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.container, isSelected && styles.containerSelected]}>
      {(imageSource || imageUri) && !imageError ? (
        <Image 
          source={imageSource || { uri: imageUri }} 
          style={styles.thumbnail}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <View style={[styles.thumbnail, styles.placeholderImage]}>
          <MaterialCommunityIcons name="image-outline" size={24} color={theme.textSecondary} />
        </View>
      )}
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.price}>₹{price}</Text>
      </View>
      {buttonVariant === 'plus' ? (
        <TouchableOpacity 
          style={[styles.plusButton, isSelected && styles.plusButtonSelected]}
          onPress={onToggle}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name={isSelected ? 'minus' : 'plus'}
            size={18}
            color={theme.textPrimary}
          />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
          style={[styles.addButton, isSelected && styles.addButtonSelected]}
          onPress={onToggle}
          activeOpacity={0.8}
        >
          <Text style={[styles.addButtonText, isSelected && styles.addButtonTextSelected]}>
            {isSelected ? 'Remove' : 'Add'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = theme => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.cardBackground,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.cardBorder,
  },
  containerSelected: {
    backgroundColor: theme.accentSoft,
    borderLeftWidth: 3,
    borderLeftColor: theme.accent,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  placeholderImage: {
    backgroundColor: theme.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  addButton: {
    backgroundColor: LIGHT_BLUE,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonSelected: {
    backgroundColor: theme.danger,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  addButtonTextSelected: {
    color: '#FFFFFF',
  },
  plusButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    backgroundColor: theme.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusButtonSelected: {
    borderColor: theme.accent,
    backgroundColor: theme.accentSoft,
  },
});
