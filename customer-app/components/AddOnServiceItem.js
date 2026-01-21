import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AddOnServiceItem({ 
  imageUri, 
  title, 
  price, 
  addOnId,
  isSelected = false,
  onToggle 
}) {
  const [imageError, setImageError] = useState(false);

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
          <MaterialCommunityIcons name="image-outline" size={24} color="#666666" />
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  containerSelected: {
    backgroundColor: '#1A2A3A',
    borderLeftWidth: 3,
    borderLeftColor: '#31C5FF',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  placeholderImage: {
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: '500',
    color: '#CCCCCC',
  },
  addButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonSelected: {
    backgroundColor: '#FF3B30',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  addButtonTextSelected: {
    color: '#FFFFFF',
  },
});
