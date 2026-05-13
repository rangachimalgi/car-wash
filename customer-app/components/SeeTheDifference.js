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

/** Backend / legacy data used "Slide 1" style labels — hide those in the app so the carousel is image-led. */
const isGenericSlideLabel = (name) => {
  if (name == null || String(name).trim() === '') return true;
  return /^slide\s*\d+$/i.test(String(name).trim());
};

const normalizeSlides = (slides) => {
  if (!slides || !slides.length) return DEFAULT_SLIDES;
  return slides.map((s, i) => {
    if (s.image && typeof s.image === 'number') return { ...s, id: s.id || `s-${i}` };
    const fromApi = Boolean(s.url);
    const rawName = s.name != null && String(s.name).trim() !== '' ? String(s.name).trim() : '';
    const title =
      s.title ||
      (fromApi
        ? isGenericSlideLabel(rawName)
          ? null
          : rawName
        : rawName || `Slide ${i + 1}`);
    return {
      id: s._id || s.id || `s-${i}`,
      title,
      bullets: s.bullets,
      image: s.url ? { uri: s.url } : s.image,
    };
  });
};

export default function SeeTheDifference({ slides = DEFAULT_SLIDES }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const ref = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const list = useMemo(() => normalizeSlides(slides), [slides]);

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
          {list.map((slide) => (
            <View key={slide.id} style={styles.slide}>
              <View style={styles.imageWrap}>
                <Image source={slide.image} style={styles.image} resizeMode="contain" />
                <View style={styles.scrim} />
                <View style={styles.overlay}>
                  {(slide.title || (slide.bullets && slide.bullets.length > 0)) ? (
                    <View style={styles.badge}>
                      {slide.title ? <Text style={styles.badgeTitle}>{slide.title}</Text> : null}
                      {slide.bullets?.map((b, idx) => (
                        <Text key={`${slide.id}-b-${idx}`} style={styles.badgeBullet}>
                          {b}
                        </Text>
                      ))}
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.dots}>
          {list.map((s, idx) => (
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
    imageWrap: {
      width: '100%',
      height: 220,
      borderRadius: 18,
      overflow: 'hidden',
      backgroundColor: theme.cardBackground,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.cardBorder,
    },
    image: {
      width: '100%',
      height: '100%',
    },
    scrim: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 18,
      backgroundColor: 'rgba(0,0,0,0.14)',
    },
    overlay: {
      position: 'absolute',
      left: 12,
      top: 12,
      right: 12,
      bottom: 12,
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

