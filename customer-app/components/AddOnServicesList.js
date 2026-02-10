import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AddOnServiceItem from './AddOnServiceItem';
import { useTheme } from '../theme/ThemeContext';

export default function AddOnServicesList({ 
  services = [], 
  maxVisible = 4,
  selectedAddOns = [],
  onToggleAddOn,
  buttonVariant = 'text',
  containerStyle,
}) {
  const [showAll, setShowAll] = useState(false);
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  const visibleServices = showAll ? services : services.slice(0, maxVisible);
  const remainingCount = services.length - maxVisible;

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.header}>
        <Text style={styles.title}>Add Services</Text>
      </View>
      {visibleServices.map((service, index) => (
        <AddOnServiceItem
          key={service._id || index}
          imageUri={service.imageUri}
          imageSource={service.imageSource}
          title={service.title}
          price={service.price}
          addOnId={service._id}
          isSelected={selectedAddOns.includes(service._id)}
          onToggle={() => onToggleAddOn && onToggleAddOn(service._id)}
          buttonVariant={buttonVariant}
        />
      ))}
      
      {!showAll && remainingCount > 0 && (
        <TouchableOpacity 
          style={styles.moreButton}
          onPress={() => setShowAll(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.moreText}>{remainingCount} More Add Ons</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = theme => StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    overflow: 'visible',
    marginTop: 0,
    borderWidth: 0,
  },
  header: {
    paddingVertical: 8,
    paddingHorizontal: 0,
    borderBottomWidth: 0,
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.textPrimary,
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    marginTop: 4,
  },
  moreText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF', // Blue link color like image
    marginRight: 4,
  },
});
