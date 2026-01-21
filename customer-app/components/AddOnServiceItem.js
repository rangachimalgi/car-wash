import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

export default function AddOnServiceItem({ 
  imageUri, 
  title, 
  price, 
  addOnId,
  isSelected = false,
  onToggle 
}) {
  const [imageError, setImageError] = useState(false);
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.container, isSelected && styles.containerSelected]}>
      {imageUri && !imageError ? (
        <Image 
          source={{ uri: imageUri }} 
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
      <TouchableOpacity 
        style={[styles.addButton, isSelected && styles.addButtonSelected]}
        onPress={onToggle}
        activeOpacity={0.8}
      >
        <Text style={[styles.addButtonText, isSelected && styles.addButtonTextSelected]}>
          {isSelected ? 'Remove' : 'Add'}
        </Text>
      </TouchableOpacity>
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
    backgroundColor: theme.accent,
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
    color: '#FFFFFF',
  },
  addButtonTextSelected: {
    color: '#FFFFFF',
  },
});
