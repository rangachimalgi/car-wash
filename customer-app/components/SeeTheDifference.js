import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Dimensions } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

const { width } = Dimensions.get('window');

const DEFAULT_SLIDES = [
  {
    id: 'foam',
    title: 'Foam Wash',
    bullets: ['Prevent swirl Marks', 'Lifts Dirt'],
    image: require('../assets/carbannerfour.jpeg'),
  },
  {
    id: 'interior',
    title: 'Interior Cleaning',
    bullets: ['Deep vacuum', 'Odour removal'],
    image: require('../assets/carbannerfour.jpeg'),
  },
  {
    id: 'shine',
    title: 'Final Shine',
    bullets: ['Gloss finish', 'Tyre dressing'],
    image: require('../assets/carbannerfour.jpeg'),
  },
];

export default function SeeTheDifference({ slides = DEFAULT_SLIDES }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const ref = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const onMomentumScrollEnd = useCallback((event) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(nextIndex);
  }, []);

  return (
    <View style={styles.section}>
      <Text style={styles.title}>See The Difference</Text>

      <View style={styles.carouselWrap}>
        <ScrollView
          ref={ref}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={width}
          onMomentumScrollEnd={onMomentumScrollEnd}
        >
          {slides.map((slide) => (
            <View key={slide.id} style={styles.slide}>
              <Image source={slide.image} style={styles.image} resizeMode="cover" />
              <View style={styles.scrim} />

              <View style={styles.overlay}>
                <View style={styles.badge}>
                  <Text style={styles.badgeTitle}>{slide.title}</Text>
                  {slide.bullets?.map((b, idx) => (
                    <Text key={`${slide.id}-b-${idx}`} style={styles.badgeBullet}>
                      {b}
                    </Text>
                  ))}
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.dots}>
          {slides.map((s, idx) => (
            <View
              key={`${s.id}-dot`}
              style={[styles.dot, idx === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    section: {
      paddingTop: 10,
      paddingBottom: 10,
    },
    title: {
      paddingHorizontal: 16,
      fontSize: 22,
      fontWeight: '800',
      color: theme.textPrimary,
      marginBottom: 12,
    },
    carouselWrap: {
      position: 'relative',
    },
    slide: {
      width,
      paddingHorizontal: 16,
    },
    image: {
      width: '100%',
      height: 170,
      borderRadius: 18,
    },
    scrim: {
      position: 'absolute',
      left: 16,
      right: 16,
      top: 0,
      bottom: 0,
      borderRadius: 18,
      backgroundColor: 'rgba(0,0,0,0.18)',
    },
    overlay: {
      position: 'absolute',
      left: 28,
      top: 14,
      right: 28,
      bottom: 14,
    },
    badge: {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(0,0,0,0.62)',
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      maxWidth: '85%',
    },
    badgeTitle: {
      color: '#F5C518',
      fontSize: 18,
      fontWeight: '900',
      marginBottom: 4,
    },
    badgeBullet: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '600',
      lineHeight: 18,
    },
    dots: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      marginTop: 10,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.cardBorder,
      opacity: 0.9,
    },
    dotActive: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.textPrimary,
      opacity: 1,
    },
  });

