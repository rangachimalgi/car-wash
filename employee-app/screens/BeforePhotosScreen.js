import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';
import { uploadOrderPhotos } from '../services/orderPhotosApi';
import { resolveUploadUrl } from '../utils/resolveUploadUrl';
const MAX_BEFORE_PHOTOS = 3;
const BLUE = '#2563EB';
const BLUE_LIGHT = '#EFF6FF';
const BLUE_BORDER = '#BFDBFE';

const cardShadow = Platform.select({
  ios: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  android: { elevation: 2 },
});

export default function BeforePhotosScreen({ navigation, route, employeeId: employeeIdProp }) {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(), []);
  const orderId = route?.params?.orderId;
  const employeeId = route?.params?.employeeId ?? employeeIdProp;

  const [loading, setLoading] = useState(true);
  const [beforePhotos, setBeforePhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [orderStatus, setOrderStatus] = useState(null);

  const loadOrder = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const url = employeeId
        ? `/orders/${orderId}?employeeId=${employeeId}`
        : `/orders/${orderId}`;
      const res = await api.get(url);
      const data = res.data?.data;
      if (data) {
        setBeforePhotos(data.servicePhotos?.beforePhotos || []);
        setOrderStatus(data.status);
      }
    } catch (error) {
      console.error('Error loading order:', error);
    } finally {
      setLoading(false);
    }
  }, [orderId, employeeId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const pickAndUpload = async () => {
    if (beforePhotos.length >= MAX_BEFORE_PHOTOS) {
      Alert.alert('Limit reached', `You can upload up to ${MAX_BEFORE_PHOTOS} before photos.`);
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to photos to upload.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_BEFORE_PHOTOS - beforePhotos.length,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) return;

    setUploading(true);
    try {
      const data = await uploadOrderPhotos({
        orderId,
        employeeId,
        type: 'before',
        assets: result.assets,
      });
      const updated = data.data?.servicePhotos;
      if (updated) {
        setBeforePhotos(updated.beforePhotos || []);
      }
    } catch (e) {
      console.error('Before photo upload error:', e);
      Alert.alert('Upload failed', e.message || 'Could not upload photos.');
    } finally {
      setUploading(false);
    }
  };

  const handleContinue = () => {
    if (orderStatus === 'In Progress') {
      navigation.navigate('StartService', { orderId, employeeId });
      return;
    }
    if (beforePhotos.length < 1) {
      Alert.alert('Photos required', 'Upload at least one before photo to continue.');
      return;
    }
    navigation.navigate('StartService', { orderId, employeeId });
  };

  const canContinue = orderStatus === 'In Progress' || beforePhotos.length >= 1;
  const slots = Array.from({ length: MAX_BEFORE_PHOTOS }, (_, i) => beforePhotos[i] || null);

  return (
    <View style={[styles.container, { paddingTop: 12 + insets.top }]}>
      <StatusBar style="dark" />

      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={BLUE} />
        </TouchableOpacity>
        <Text style={styles.title}>Before Photos</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={BLUE} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 130 + insets.bottom }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.introCard}>
              <MaterialCommunityIcons name="camera-outline" size={22} color={BLUE} />
              <View style={styles.introText}>
                <Text style={styles.introTitle}>Capture the vehicle before service</Text>
                <Text style={styles.introHint}>
                  Upload up to {MAX_BEFORE_PHOTOS} clear photos, then start the service with the
                  customer's code.
                </Text>
              </View>
            </View>

            <Text style={styles.counter}>
              {beforePhotos.length} / {MAX_BEFORE_PHOTOS} uploaded
            </Text>

            <View style={styles.photoGrid}>
              {slots.map((uri, index) => (
                <TouchableOpacity
                  key={`slot-${index}`}
                  style={styles.photoSlot}
                  onPress={pickAndUpload}
                  disabled={uploading || Boolean(uri)}
                  activeOpacity={uri ? 1 : 0.85}
                >
                  {uri ? (
                    <Image
                      source={{ uri: resolveUploadUrl(uri) }}
                      style={styles.photoImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      {uploading && index === beforePhotos.length ? (
                        <ActivityIndicator color={BLUE} />
                      ) : (
                        <>
                          <MaterialCommunityIcons
                            name="camera-plus-outline"
                            size={28}
                            color="#94A3B8"
                          />
                          <Text style={styles.photoPlaceholderText}>
                            {index === 0 ? 'Required' : 'Add photo'}
                          </Text>
                        </>
                      )}
                    </View>
                  )}
                  <View style={styles.photoLabel}>
                    <Text style={styles.photoLabelText}>Photo {index + 1}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {beforePhotos.length < MAX_BEFORE_PHOTOS ? (
              <TouchableOpacity
                style={[styles.addButton, uploading && styles.addButtonDisabled]}
                onPress={pickAndUpload}
                disabled={uploading}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="image-plus" size={20} color={BLUE} />
                <Text style={styles.addButtonText}>
                  {uploading ? 'Uploading...' : 'Add photos'}
                </Text>
              </TouchableOpacity>
            ) : null}
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: 14 + insets.bottom }]}>
            <TouchableOpacity
              style={[styles.startButton, !canContinue && styles.startButtonDisabled]}
              onPress={handleContinue}
              disabled={!canContinue}
              activeOpacity={0.9}
            >
              <View style={styles.playCircle}>
                <MaterialCommunityIcons name="play" size={14} color={BLUE} style={styles.playIcon} />
              </View>
              <Text style={styles.startButtonText}>
                {orderStatus === 'In Progress' ? 'Continue service' : 'Start Service'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.footerHint}>
              {orderStatus === 'In Progress'
                ? 'Return to the active service screen'
                : 'You will enter the customer start code on the next screen'}
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F1F5F9',
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    backButton: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: BLUE_LIGHT,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerSpacer: {
      width: 38,
    },
    title: {
      fontSize: 17,
      fontWeight: '700',
      color: '#0F172A',
    },
    loadingWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 16,
    },
    loadingText: {
      color: '#64748B',
      fontSize: 13,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
      gap: 14,
    },
    introCard: {
      flexDirection: 'row',
      gap: 12,
      backgroundColor: '#FFFFFF',
      borderRadius: 18,
      borderWidth: 1,
      borderColor: '#E8EDF3',
      padding: 16,
      ...cardShadow,
    },
    introText: {
      flex: 1,
      gap: 4,
    },
    introTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: '#0F172A',
    },
    introHint: {
      fontSize: 13,
      color: '#64748B',
      lineHeight: 18,
    },
    counter: {
      fontSize: 13,
      fontWeight: '600',
      color: '#64748B',
    },
    photoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    photoSlot: {
      width: '31%',
      aspectRatio: 0.85,
      borderRadius: 14,
      overflow: 'hidden',
      backgroundColor: '#E2E8F0',
      position: 'relative',
    },
    photoImage: {
      width: '100%',
      height: '100%',
    },
    photoPlaceholder: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: '#F8FAFC',
      borderWidth: 1.5,
      borderColor: '#E2E8F0',
      borderStyle: 'dashed',
      borderRadius: 14,
      padding: 8,
    },
    photoPlaceholderText: {
      fontSize: 10,
      color: '#94A3B8',
      fontWeight: '600',
      textAlign: 'center',
    },
    photoLabel: {
      position: 'absolute',
      top: 6,
      left: 6,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    photoLabelText: {
      color: '#FFFFFF',
      fontSize: 9,
      fontWeight: '600',
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: BLUE_LIGHT,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: BLUE_BORDER,
      paddingVertical: 14,
    },
    addButtonDisabled: {
      opacity: 0.6,
    },
    addButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: BLUE,
    },
    footer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#F1F5F9',
      paddingHorizontal: 16,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: '#E2E8F0',
    },
    startButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      backgroundColor: BLUE,
      borderRadius: 16,
      paddingVertical: 17,
      ...Platform.select({
        ios: {
          shadowColor: BLUE,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        android: { elevation: 4 },
      }),
    },
    startButtonDisabled: {
      opacity: 0.5,
    },
    playCircle: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    playIcon: {
      marginLeft: 2,
    },
    startButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    footerHint: {
      textAlign: 'center',
      fontSize: 12,
      color: '#94A3B8',
      marginTop: 10,
      lineHeight: 16,
    },
  });
