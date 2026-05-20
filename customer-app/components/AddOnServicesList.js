import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AddOnServiceItem from './AddOnServiceItem';
import { useTheme } from '../theme/ThemeContext';

export default function AddOnServicesList({ 
  services = [], 
  maxVisible = 4,
  selectedAddOns = [],
  onToggleAddOn,
  buttonVariant = 'text',
  containerStyle,
  fallbackImageSource,
  /** Main wash service image from admin (R2 / uploads URL). */
  serviceImageUri = null,
  /** Local fallback when the service has no admin image. */
  serviceImageSource = null,
}) {
  const [showAll, setShowAll] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  const visibleServices = showAll ? services : services.slice(0, maxVisible);
  const remainingCount = services.length - maxVisible;

  const displayImage = (() => {
    const uri = String(serviceImageUri || '').trim();
    if (uri) return uri;
    if (serviceImageSource) return serviceImageSource;
    if (services.length > 0) {
      const first = services[0];
      if (first.imageUri) return first.imageUri;
      if (first.imageSource) return first.imageSource;
    }
    return fallbackImageSource || null;
  })();

  useEffect(() => {
    setImageError(false);
  }, [displayImage]);

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.header}>
        <Text style={styles.title}>Add Services</Text>
      </View>
      <View style={styles.contentWrapper}>
        <View style={styles.listColumn}>
          {visibleServices.map((service, index) => (
            <AddOnServiceItem
              key={service._id || index}
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
              <Text style={styles.moreText}>
                {remainingCount} More {remainingCount === 1 ? 'Add On' : 'Add Ons'}
              </Text>
            </TouchableOpacity>
          )}

          {showAll && services.length > maxVisible && (
            <TouchableOpacity 
              style={styles.moreButton}
              onPress={() => setShowAll(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.moreText}>
                View Less
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {displayImage && (
          <View style={styles.imageCard}>
            {!imageError ? (
              <Image
                source={typeof displayImage === 'string' ? { uri: displayImage } : displayImage}
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
        )}
      </View>
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
  contentWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  listColumn: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.textPrimary,
  },
  imageCard: {
    width: 150,
    height: 280,
    marginTop: 0,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: theme.cardBackground,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    marginTop: 8,
  },
  moreText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#007AFF', // Blue color
    letterSpacing: 0.2,
  },
});
