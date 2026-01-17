import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function ServiceCard({
  imageUri,
  title,
  description,
  price,
  duration,
  onReadMore,
  onBookService,
}) {
  return (
    <View style={styles.serviceCard}>
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: imageUri }}
          style={styles.serviceImage}
          resizeMode="cover"
        />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDescription}>{description}</Text>
        <View style={styles.cardInfo}>
          <Text style={styles.cardPrice}>{price}</Text>
          <Text style={styles.cardDuration}>{duration}</Text>
        </View>
        <View style={styles.cardButtons}>
          <TouchableOpacity style={styles.readMoreButton} onPress={onReadMore}>
            <Text style={styles.readMoreText}>Read more</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bookButton} onPress={onBookService}>
            <Text style={styles.bookText}>Book service</Text>
            <MaterialCommunityIcons name="arrow-right" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  serviceCard: {
    backgroundColor: '#38383A',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
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
  cardContent: {
    padding: 16,
    paddingTop: 0,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#6BB6FF',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 16,
    opacity: 0.8,
  },
  cardInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cardDuration: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  readMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bookButton: {
    flex: 1,
    backgroundColor: '#6BB6FF',
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
    color: '#FFFFFF',
  },
});
