import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

const { width } = Dimensions.get('window');

const DEFAULT_ITEMS = [
  { id: 'aad1', name: 'Aadarsh', image: require('../assets/carImage.jpeg') },
  { id: 'dol1', name: 'Dolly Parma', image: require('../assets/carImage.jpeg') },
  { id: 'par1', name: 'Parth', image: require('../assets/carImage.jpeg') },
];

export default function CustomerTestimonials({
  title = 'Customer Testimonials',
  items = DEFAULT_ITEMS,
  onPressItem,
}) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.9}
            style={styles.card}
            onPress={() => onPressItem?.(item)}
          >
            <Image source={item.image} style={styles.image} resizeMode="cover" />
            <View style={styles.scrim} />

            <View style={styles.playWrap}>
              <View style={styles.playCircle}>
                <MaterialCommunityIcons name="play" size={28} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.nameWrap}>
              <View style={styles.nameAccent} />
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    section: {
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 6,
    },
    title: {
      fontSize: 22,
      fontWeight: '800',
      color: theme.textPrimary,
      marginBottom: 12,
    },
    row: {
      paddingRight: 16,
      gap: 14,
    },
    card: {
      width: Math.min(160, width * 0.42),
      height: 300,
      borderRadius: 18,
      overflow: 'hidden',
      backgroundColor: theme.cardBackground,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    image: {
      width: '100%',
      height: '100%',
    },
    scrim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.22)',
    },
    playWrap: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
    },
    playCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.9)',
      backgroundColor: 'rgba(0,0,0,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    nameWrap: {
      position: 'absolute',
      left: 12,
      right: 12,
      bottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    nameAccent: {
      width: 3,
      height: 22,
      borderRadius: 2,
      backgroundColor: '#F5C518',
    },
    name: {
      fontSize: 18,
      fontWeight: '800',
      color: '#FFFFFF',
      textShadowColor: 'rgba(0,0,0,0.35)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
      flex: 1,
    },
  });

