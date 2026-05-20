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

/** Alternate: light blue ↔ peach (same in dark mode — no grey wash) */
const CARD_BACKGROUNDS = ['#E8F2FA', '#FADDDA'];

const DEFAULT_CARDS = [
  {
    id: 'why-1',
    title: 'Simple & Fast Booking',
    description: 'Book, track & rate — all in one app.',
    image: require('../assets/whychoose.jpeg'),
  },
  {
    id: 'why-2',
    title: 'Professional Service',
    description: 'Expert team with top-quality equipment and products.',
    image: require('../assets/whychooseone.jpeg'),
  },
  {
    id: 'why-3',
    title: 'Car Wash at Your Home',
    description: 'No waiting, no travel — we come to you.',
    image: require('../assets/whychoose.jpeg'),
  },
];

const CARD_HEIGHT = 140;

const normalizeCards = (items) => {
  if (!items?.length) return DEFAULT_CARDS;
  const fromApi = items.filter(
    (m) => m?.url && String(m.url).trim() && String(m.title || '').trim()
  );
  if (fromApi.length === 0) return DEFAULT_CARDS;
  return fromApi.map((m, i) => ({
    id: String(m._id ?? m.url ?? `why-${m.order ?? i}`),
    title: String(m.title || '').trim(),
    description: String(m.description || '').trim(),
    image: { uri: String(m.url).trim() },
        colorIndex: i % 2,
  }));
};

function CardImage({ source, style, fallbackSource }) {
  const [failed, setFailed] = useState(false);
  const resolved = failed ? fallbackSource : source;
  if (!resolved) return <View style={[style, stylesShared.imagePlaceholder]} />;
  return (
    <Image
      source={resolved}
      style={style}
      resizeMode="contain"
      onError={() => setFailed(true)}
    />
  );
}

function WhyChooseCard({ card, cardWidth, backgroundColor, fallbackImage, textStyles }) {
  return (
    <View style={[stylesShared.card, { width: cardWidth, height: CARD_HEIGHT, backgroundColor }]}>
      <CardImage
        source={card.image}
        fallbackSource={fallbackImage}
        style={stylesShared.cardImage}
      />
      <View style={stylesShared.textCol}>
        <Text style={textStyles.cardTitle} numberOfLines={2}>
          {card.title}
        </Text>
        {card.description ? (
          <Text style={textStyles.cardDescription} numberOfLines={3}>
            {card.description}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const LOOP_COPIES = 3;
const AUTO_MS = 4500;

export default function WhyChooseWoosh({ items }) {
  const { theme } = useTheme();
  const { width: screenW } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const listRef = useRef(null);
  const scrollIndexRef = useRef(0);
  const userDraggingRef = useRef(false);
  const autoTimerRef = useRef(null);

  const list = useMemo(() => normalizeCards(items), [items]);
  const fallbackImage = DEFAULT_CARDS[0]?.image;

  const layout = useMemo(() => {
    const cardWidth = Math.round(screenW * 0.76);
    const cardGap = 18;
    const snapInterval = cardWidth + cardGap;
    const sidePadding = Math.round((screenW - cardWidth) / 2);
    return { cardWidth, snapInterval, sidePadding };
  }, [screenW]);

  const loopData = useMemo(() => {
    if (list.length === 0) return [];
    if (list.length === 1) return [...list, ...list, ...list];
    return Array.from({ length: LOOP_COPIES }, () => list).flat();
  }, [list]);

  const baseOffset = list.length;

  useEffect(() => {
    list.forEach((card) => {
      const uri = card.image?.uri;
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
      startAuto();
    });
    return clearAuto;
  }, [loopData.length, baseOffset, list.length, scrollToIndex, startAuto, clearAuto]);

  const onMomentumScrollEnd = useCallback(
    (e) => {
      let idx = Math.round(e.nativeEvent.contentOffset.x / layout.snapInterval);
      idx = normalizeLoopPosition(idx);
      scrollIndexRef.current = idx;
      startAuto();
    },
    [layout.snapInterval, normalizeLoopPosition, startAuto]
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
    ({ item, index }) => {
      const colorIndex = item.colorIndex ?? index % CARD_BACKGROUNDS.length;
      return (
        <View style={[styles.cardSlot, { width: layout.snapInterval }]}>
          <WhyChooseCard
            card={item}
            cardWidth={layout.cardWidth}
            backgroundColor={CARD_BACKGROUNDS[colorIndex % CARD_BACKGROUNDS.length]}
            fallbackImage={fallbackImage}
            textStyles={styles.cardText}
          />
        </View>
      );
    },
    [styles.cardSlot, styles.cardText, layout.snapInterval, layout.cardWidth, fallbackImage]
  );

  if (list.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Why Choose Woosh</Text>
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
        onMomentumScrollEnd={onMomentumScrollEnd}
        onScrollBeginDrag={() => {
          userDraggingRef.current = true;
          clearAuto();
        }}
        onScrollEndDrag={() => {
          userDraggingRef.current = false;
        }}
      />
    </View>
  );
}

const stylesShared = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  cardImage: {
    width: '42%',
    height: '100%',
    marginRight: 12,
  },
  imagePlaceholder: {
    backgroundColor: 'transparent',
  },
  textCol: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 4,
  },
});

const createStyles = (theme) =>
  StyleSheet.create({
    section: {
      paddingTop: 8,
      paddingBottom: 20,
    },
    title: {
      paddingHorizontal: 16,
      fontSize: 22,
      fontWeight: '800',
      color: theme.textPrimary,
      marginBottom: 16,
    },
    cardSlot: {
      alignItems: 'center',
    },
    cardText: {
      cardTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#000000',
        marginBottom: 8,
        letterSpacing: -0.2,
      },
      cardDescription: {
        fontSize: 14,
        fontWeight: '400',
        color: '#000000',
        lineHeight: 20,
      },
    },
  });
