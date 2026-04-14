import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { useTheme } from '../theme/ThemeContext';

const { width } = Dimensions.get('window');

const DEFAULT_ITEMS = [
  { id: 'aad1', name: 'Rohit', image: require('../assets/cartestimonial.jpeg') },
  { id: 'dol1', name: 'Elizebeth', image: require('../assets/cartestimonialone.jpeg') },
  { id: 'par1', name: 'Ron', image: require('../assets/cartestimonialtwo.jpeg') },
];

const isVideoUrl = (url) => /\.(mp4|webm|mov)(\?|$)/i.test(url || '');

export default function CustomerTestimonials({
  title = 'Customer Testimonials',
  items = DEFAULT_ITEMS,
  onPressItem,
}) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [activeVideoUrl, setActiveVideoUrl] = useState(null);
  const [videoThumbnails, setVideoThumbnails] = useState({});

  useEffect(() => {
    let mounted = true;
    const videoUrls = items
      .map((item) => (typeof item?.url === 'string' ? item.url : ''))
      .filter((url) => isVideoUrl(url) && !videoThumbnails[url]);

    if (!videoUrls.length) return () => { mounted = false; };

    (async () => {
      const generated = [];
      for (const url of videoUrls) {
        try {
          const { uri } = await VideoThumbnails.getThumbnailAsync(url, { time: 1000 });
          generated.push([url, uri]);
        } catch (_) {
          // Keep placeholder when thumbnail generation fails.
        }
      }

      if (!mounted || !generated.length) return;
      setVideoThumbnails((prev) => {
        const next = { ...prev };
        generated.forEach(([url, uri]) => {
          next[url] = uri;
        });
        return next;
      });
    })();

    return () => {
      mounted = false;
    };
  }, [items, videoThumbnails]);

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
                <View style={[styles.image, styles.videoPlaceholder]}>
                  <MaterialCommunityIcons name="video-outline" size={48} color="rgba(255,255,255,0.7)" />
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
              <Video
                source={{ uri: activeVideoUrl }}
                style={styles.videoPlayer}
                useNativeControls
                shouldPlay
                resizeMode={ResizeMode.CONTAIN}
              />
            ) : null}
          </View>
        </View>
      </Modal>
    </>
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
    videoPlaceholder: {
      backgroundColor: 'rgba(0,0,0,0.5)',
      alignItems: 'center',
      justifyContent: 'center',
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
    videoPlayer: {
      width: '100%',
      height: 360,
      backgroundColor: '#000',
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

