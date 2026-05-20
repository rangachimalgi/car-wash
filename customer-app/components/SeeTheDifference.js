import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';

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

const isGenericSlideLabel = (name) => {
  if (name == null || String(name).trim() === '') return true;
  return /^slide\s*\d+$/i.test(String(name).trim());
};

const normalizeSlides = (slides) => {
  if (!slides || !slides.length) return DEFAULT_SLIDES;
  const mapped = slides
    .map((s, i) => {
      if (s.image && typeof s.image === 'number') return { ...s, id: s.id || `s-${i}` };
      const url = s.url != null ? String(s.url).trim() : '';
      const fromApi = Boolean(url);
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
        image: url ? { uri: url } : s.image,
      };
    })
    .filter((s) => s.image && (typeof s.image === 'number' || s.image.uri));
  return mapped.length > 0 ? mapped : DEFAULT_SLIDES;
};

function SlideImage({ source, style, fallbackSource }) {
  const [failed, setFailed] = useState(false);
  const resolved = failed ? fallbackSource : source;
  if (!resolved) return <View style={[style, { backgroundColor: '#1a2744' }]} />;
  return (
    <Image
      source={resolved}
      style={style}
      resizeMode="cover"
      onError={() => setFailed(true)}
    />
  );
}

const LOOP_COPIES = 3;
const AUTO_MS = 4200;
const SLIDE_HEIGHT = 185;

export default function SeeTheDifference({ slides = DEFAULT_SLIDES }) {
  const { theme, isLightMode } = useTheme();
  const { width: screenW } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme, isLightMode), [theme, isLightMode]);
  const listRef = useRef(null);
  const scrollIndexRef = useRef(0);
  const userDraggingRef = useRef(false);
  const autoTimerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const list = useMemo(() => normalizeSlides(slides), [slides]);
  const fallbackImage = DEFAULT_SLIDES[0]?.image;

  const layout = useMemo(() => {
    const slideWidth = Math.round(screenW * 0.76);
    const slideGap = 20;
    const snapInterval = slideWidth + slideGap;
    const sidePadding = Math.round((screenW - slideWidth) / 2);
    return { slideWidth, snapInterval, sidePadding };
  }, [screenW]);

  const loopData = useMemo(() => {
    if (list.length === 0) return [];
    if (list.length === 1) return [...list, ...list, ...list];
    return Array.from({ length: LOOP_COPIES }, () => list).flat();
  }, [list]);

  const baseOffset = list.length;

  useEffect(() => {
    list.forEach((slide) => {
      const uri = slide.image?.uri;
      if (uri) Image.prefetch(uri).catch(() => {});
    });
  }, [list]);

  const scrollToIndex = useCallback(
    (index, animated = true) => {
      if (!listRef.current || loopData.length === 0) return;
      scrollIndexRef.current = index;
      listRef.current.scrollToOffset({
        offset: index * layout.snapInterval,
        animated,
      });
    },
    [layout.snapInterval, loopData.length]
  );

  const normalizeLoopPosition = useCallback(
    (index) => {
      const n = list.length;
      if (n === 0) return index;
      if (n === 1) {
        if (index <= 0) {
          scrollToIndex(1, false);
          return 1;
        }
        if (index >= 2) {
          scrollToIndex(1, false);
          return 1;
        }
        return index;
      }
      if (index < n) {
        const target = index + n;
        scrollToIndex(target, false);
        return target;
      }
      if (index >= n * 2) {
        const target = index - n;
        scrollToIndex(target, false);
        return target;
      }
      return index;
    },
    [list.length, scrollToIndex]
  );

  const logicalIndex = useCallback(
    (index) => {
      const n = list.length;
      if (n === 0) return 0;
      return ((index % n) + n) % n;
    },
    [list.length]
  );

  const advance = useCallback(() => {
    if (userDraggingRef.current || list.length <= 1) return;
    scrollToIndex(scrollIndexRef.current + 1, true);
  }, [list.length, scrollToIndex]);

  const clearAuto = useCallback(() => {
    if (autoTimerRef.current) {
      clearInterval(autoTimerRef.current);
      autoTimerRef.current = null;
    }
  }, []);

  const startAuto = useCallback(() => {
    clearAuto();
    if (list.length <= 1) return;
    autoTimerRef.current = setInterval(advance, AUTO_MS);
  }, [advance, clearAuto, list.length]);

  useEffect(() => {
    if (loopData.length === 0) return;
    const start = list.length > 1 ? baseOffset : 0;
    scrollIndexRef.current = start;
    requestAnimationFrame(() => {
      scrollToIndex(start, false);
      setActiveIndex(0);
      startAuto();
    });
    return clearAuto;
  }, [loopData.length, baseOffset, list.length, scrollToIndex, startAuto, clearAuto]);

  const onScroll = useCallback(
    (e) => {
      const idx = Math.round(e.nativeEvent.contentOffset.x / layout.snapInterval);
      scrollIndexRef.current = idx;
      setActiveIndex(logicalIndex(idx));
    },
    [layout.snapInterval, logicalIndex]
  );

  const onMomentumScrollEnd = useCallback(
    (e) => {
      let idx = Math.round(e.nativeEvent.contentOffset.x / layout.snapInterval);
      idx = normalizeLoopPosition(idx);
      scrollIndexRef.current = idx;
      setActiveIndex(logicalIndex(idx));
      startAuto();
    },
    [layout.snapInterval, logicalIndex, normalizeLoopPosition, startAuto]
  );

  const getItemLayout = useCallback(
    (_, index) => ({
      length: layout.snapInterval,
      offset: layout.snapInterval * index,
      index,
    }),
    [layout.snapInterval]
  );

  const keyExtractor = useCallback((item, index) => `${item.id}-${index}`, []);

  const renderItem = useCallback(
    ({ item }) => (
      <View style={[styles.slideSlot, { width: layout.snapInterval }]}>
        <View style={[styles.imageWrap, { width: layout.slideWidth, height: SLIDE_HEIGHT }]}>
          <SlideImage source={item.image} style={styles.image} fallbackSource={fallbackImage} />
          <View style={styles.scrim} />
          {(item.title || (item.bullets && item.bullets.length > 0)) ? (
            <View style={styles.overlay}>
              <View style={styles.badge}>
                {item.title ? <Text style={styles.badgeTitle}>{item.title}</Text> : null}
                {item.bullets?.map((b, idx) => (
                  <Text key={`${item.id}-b-${idx}`} style={styles.badgeBullet}>
                    {b}
                  </Text>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </View>
    ),
    [styles, layout.snapInterval, layout.slideWidth, fallbackImage]
  );

  if (list.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.title}>See The Difference</Text>

      <View style={styles.carouselWrap}>
        <FlatList
          ref={listRef}
          data={loopData}
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={layout.snapInterval}
          snapToAlignment="start"
          disableIntervalMomentum
          bounces={false}
          getItemLayout={getItemLayout}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: layout.sidePadding }}
          onScroll={onScroll}
          scrollEventThrottle={16}
          onMomentumScrollEnd={onMomentumScrollEnd}
          onScrollBeginDrag={() => {
            userDraggingRef.current = true;
            clearAuto();
          }}
          onScrollEndDrag={() => {
            userDraggingRef.current = false;
          }}
        />

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

const createStyles = (theme, isLightMode) =>
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
    slideSlot: {
      alignItems: 'center',
    },
    imageWrap: {
      borderRadius: 0,
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
      backgroundColor: isLightMode ? theme.cardBorder : 'rgba(255,255,255,0.28)',
    },
    dotActive: {
      width: 22,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.accent,
    },
  });
