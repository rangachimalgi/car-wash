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
      {/* Thumbnails hidden for compact design */}
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
          <Text style={[styles.plusButtonText, isSelected && styles.plusButtonTextSelected]}>
            {isSelected ? '−' : '+'}
          </Text>
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
    backgroundColor: 'transparent',
    paddingVertical: 8,
    paddingHorizontal: 0,
    borderBottomWidth: 0,
  },
  containerSelected: {
    backgroundColor: 'transparent',
    borderLeftWidth: 0,
  },
  thumbnail: {
    width: 0,
    height: 0,
    display: 'none',
  },
  placeholderImage: {
    display: 'none',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 2,
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary,
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
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: theme.cardBorder,
    backgroundColor: theme.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  plusButtonSelected: {
    borderColor: theme.accent,
    backgroundColor: theme.accent,
  },
  plusButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.textPrimary,
    lineHeight: 20,
  },
  plusButtonTextSelected: {
    color: '#FFFFFF',
  },
});
