import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AddOnServiceItem from './AddOnServiceItem';

export default function AddOnServicesList({ 
  services = [], 
  maxVisible = 4,
  selectedAddOns = [],
  onToggleAddOn
}) {
  const [showAll, setShowAll] = useState(false);
  
  const visibleServices = showAll ? services : services.slice(0, maxVisible);
  const remainingCount = services.length - maxVisible;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Add Ons</Text>
      </View>
      {visibleServices.map((service, index) => (
        <AddOnServiceItem
          key={service._id || index}
          imageUri={service.imageUri}
          title={service.title}
          price={service.price}
          addOnId={service._id}
          isSelected={selectedAddOns.includes(service._id)}
          onToggle={() => onToggleAddOn && onToggleAddOn(service._id)}
        />
      ))}
      
      {!showAll && remainingCount > 0 && (
        <TouchableOpacity 
          style={styles.moreButton}
          onPress={() => setShowAll(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.moreText}>+{remainingCount} More</Text>
          <MaterialCommunityIcons name="chevron-down" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#333333',
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  moreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 4,
  },
});
