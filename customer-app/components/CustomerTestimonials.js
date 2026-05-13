import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { useTheme } from '../theme/ThemeContext';

/** Lightweight skeleton shimmer (no extra native deps; works with Expo + Reanimated). */
function TestimonialShimmer({ width, height, borderRadius, baseColor, highlightColor }) {
  const progress = useSharedValue(0);
  const stripeW = Math.max(56, Math.min(112, width * 0.45));

  useEffect(() => {
    progress.value = 0;
    progress.value = withRepeat(withTiming(1, { duration: 1350, easing: Easing.linear }), -1, false);
  }, [width, height, stripeW, progress]);

  const animStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateX: interpolate(progress.value, [0, 1], [-stripeW, width + stripeW]) }],
    }),
    [width, stripeW]
  );

  if (!width || !height) return null;

  return (
    <View style={{ width, height, borderRadius, overflow: 'hidden', backgroundColor: baseColor }}>
      <Animated.View style={[{ position: 'absolute', left: 0, top: 0, bottom: 0, width: stripeW }, animStyle]}>
        <LinearGradient
          colors={['transparent', highlightColor, 'transparent']}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ flex: 1, width: stripeW }}
        />
      </Animated.View>
    </View>
  );
}

/** expo-av `Video` is unreliable in some prod / New-Arch builds; expo-video uses the platform player. */
function TestimonialModalVideo({ uri, styles: s }) {
  const { width: winW } = useWindowDimensions();
  const shimmerW = Math.max(160, winW - 36);

  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
    p.muted = false;
    p.play();
  });
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const showLoading = status !== 'readyToPlay' && status !== 'error';

  return (
    <View style={s.videoPlayerWrap}>
      <VideoView
        style={s.videoPlayer}
        player={player}
        nativeControls
        contentFit="contain"
        allowsFullscreen
        useExoShutter={false}
        {...(Platform.OS === 'android' ? { surfaceType: 'textureView' } : {})}
      />
      {showLoading ? (
        <View style={s.videoLoadingOverlay} pointerEvents="none">
          <TestimonialShimmer
            width={shimmerW}
            height={360}
            borderRadius={8}
            baseColor={s.videoModalSkeletonBase}
            highlightColor={s.videoModalSkeletonHighlight}
          />
        </View>
      ) : null}
    </View>
  );
}

const { width } = Dimensions.get('window');

const DEFAULT_ITEMS = [
  { id: 'aad1', name: 'Rohit', image: require('../assets/cartestimonial.jpeg') },
  { id: 'dol1', name: 'Elizebeth', image: require('../assets/cartestimonialone.jpeg') },
  { id: 'par1', name: 'Ron', image: require('../assets/cartestimonialtwo.jpeg') },
];

const isVideoUrl = (url) => /\.(mp4|webm|mov)(\?|$)/i.test(url || '');

/** Warm TLS + CDN edge before decoding frames (cheap on RN; ignore failures). */
async function warmRemoteVideoUrls(urls) {
  await Promise.all(
    urls.map(async (url) => {
      if (!/^https?:\/\//i.test(url)) return;
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 5000);
      try {
        await fetch(url, { method: 'HEAD', signal: ctrl.signal });
      } catch {
        /* ignore */
      } finally {
        clearTimeout(timer);
      }
    })
  );
}

/** Prefer early frame + lower quality first — much faster over R2 than seeking to 500ms. */
async function thumbnailWithRetry(url, attempts = 3) {
  const tries = [
    { time: 0, quality: 0.42 },
    { time: 350, quality: 0.5 },
    { time: 1100, quality: 0.55 },
  ];
  for (let i = 0; i < attempts; i++) {
    const opts = tries[i] ?? tries[tries.length - 1];
    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(url, opts);
      return [url, uri];
    } catch {
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 180 * (i + 1)));
    }
  }
  return null;
}

const CARD_W = Math.min(160, width * 0.42);

export default function CustomerTestimonials({
  title = 'Customer Testimonials',
  items = DEFAULT_ITEMS,
  onPressItem,
}) {
  const { theme, isLightMode } = useTheme();
  const styles = useMemo(() => createStyles(theme, isLightMode), [theme, isLightMode]);
  const [activeVideoUrl, setActiveVideoUrl] = useState(null);
  const [videoThumbnails, setVideoThumbnails] = useState({});

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    }).catch(() => {});
  }, []);

  // Pre-generate thumbnails in parallel (faster than sequential). Depends only on `items`
  // so we do not re-run the whole pipeline on every thumbnail state update.
  useEffect(() => {
    let mounted = true;
    const videoUrls = items
      .map((item) => (typeof item?.url === 'string' ? item.url : ''))
      .filter((url) => isVideoUrl(url));

    if (!videoUrls.length) return undefined;

    (async () => {
      const [, entries] = await Promise.all([
        warmRemoteVideoUrls(videoUrls),
        Promise.all(videoUrls.map((url) => thumbnailWithRetry(url))),
      ]);

      if (!mounted) return;
      const ok = entries.filter(Boolean);
      if (!ok.length) return;
      setVideoThumbnails((prev) => {
        const next = { ...prev };
        ok.forEach(([url, uri]) => {
          if (!next[url]) next[url] = uri;
        });
        return next;
      });
    })();

    return () => {
      mounted = false;
    };
  }, [items]);

  return (
    <>
      <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {items.map((item) => {
          const key = item._id || item.id;
          const hasRemoteUrl = typeof item.url === 'string' && item.url;
          const isVideo = hasRemoteUrl && isVideoUrl(item.url);
          const source = item.image
            ? item.image
            : isVideo
              ? (videoThumbnails[item.url] ? { uri: videoThumbnails[item.url] } : null)
              : hasRemoteUrl
                ? { uri: item.url }
                : null;

          return (
            <TouchableOpacity
              key={key}
              activeOpacity={0.9}
              style={styles.card}
              onPress={() => {
                if (isVideo && item.url) {
                  setActiveVideoUrl(item.url);
                  return;
                }
                onPressItem?.(item);
              }}
            >
              {source ? (
                <Image source={source} style={styles.image} resizeMode="cover" />
              ) : isVideo ? (
                <View style={styles.image}>
                  <TestimonialShimmer
                    width={CARD_W}
                    height={300}
                    borderRadius={18}
                    baseColor={styles.videoCardSkeletonBase}
                    highlightColor={styles.videoCardSkeletonHighlight}
                  />
                </View>
              ) : null}
              <View style={styles.scrim} />

              <View style={styles.playWrap}>
                <View style={styles.playCircle}>
                  <MaterialCommunityIcons name="play" size={28} color="#FFFFFF" />
                </View>
              </View>

              <View style={styles.nameWrap}>
                <View style={styles.nameAccent} />
                <Text style={styles.name} numberOfLines={1}>
                  {item.name || 'Video'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      </View>
      <Modal
        visible={Boolean(activeVideoUrl)}
        animationType="fade"
        transparent
        onRequestClose={() => setActiveVideoUrl(null)}
      >
        <View style={styles.videoModalBackdrop}>
          <View style={styles.videoModalCard}>
            <TouchableOpacity
              style={styles.videoCloseButton}
              onPress={() => setActiveVideoUrl(null)}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            {activeVideoUrl ? (
              <TestimonialModalVideo key={activeVideoUrl} uri={activeVideoUrl} styles={styles} />
            ) : null}
          </View>
        </View>
      </Modal>
    </>
  );
}

const createStyles = (theme, isLightMode) =>
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
    videoCardSkeletonBase: isLightMode ? '#E8ECF3' : 'rgba(18,18,20,0.92)',
    videoCardSkeletonHighlight: isLightMode ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.14)',
    videoModalSkeletonBase: '#070707',
    videoModalSkeletonHighlight: 'rgba(255,255,255,0.12)',
    card: {
      width: CARD_W,
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
    videoModalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.9)',
      justifyContent: 'center',
      paddingHorizontal: 12,
    },
    videoModalCard: {
      position: 'relative',
      width: '100%',
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: '#000',
    },
    videoPlayerWrap: {
      position: 'relative',
      width: '100%',
    },
    videoPlayer: {
      width: '100%',
      height: 360,
      backgroundColor: '#000',
    },
    videoLoadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.42)',
    },
    videoCloseButton: {
      position: 'absolute',
      right: 8,
      top: 8,
      zIndex: 2,
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.55)',
    },
  });

