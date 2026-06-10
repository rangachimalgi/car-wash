import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import ServicePhotoGrid from '../components/ServicePhotoGrid';
import { uploadOrderPhotos } from '../services/orderPhotosApi';
import {
  countFilledSlots,
  emptyPhotoSlots,
  hasRequiredPhotos,
  normalizePhotoSlots,
  PHOTO_SLOTS,
} from '../utils/servicePhotoSlots';

const BLUE = '#2563EB';
const BLUE_LIGHT = '#EFF6FF';

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
  const [beforePhotos, setBeforePhotos] = useState(emptyPhotoSlots);
  const [uploadingSlot, setUploadingSlot] = useState(null);
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
        setBeforePhotos(normalizePhotoSlots(data.servicePhotos?.beforePhotos));
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

  const pickAndUpload = async (slotKey) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to photos to upload.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;

    setUploadingSlot(slotKey);
    try {
      const data = await uploadOrderPhotos({
        orderId,
        employeeId,
        type: 'before',
        slot: slotKey,
        assets: result.assets,
      });
      const updated = data.data?.servicePhotos;
      if (updated) {
        setBeforePhotos(normalizePhotoSlots(updated.beforePhotos));
      }
    } catch (e) {
      console.error('Before photo upload error:', e);
      Alert.alert('Upload failed', e.message || 'Could not upload photo.');
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleContinue = () => {
    if (orderStatus === 'In Progress') {
      navigation.navigate('StartService', { orderId, employeeId });
      return;
    }
    if (!hasRequiredPhotos(beforePhotos)) {
      Alert.alert('Photo required', 'Upload the front before photo to continue.');
      return;
    }
    navigation.navigate('StartService', { orderId, employeeId });
  };

  const filledCount = countFilledSlots(beforePhotos);
  const canContinue = orderStatus === 'In Progress' || hasRequiredPhotos(beforePhotos);

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
            <Text style={styles.hint}>
              Add up to {PHOTO_SLOTS.length} photos. Front is required.
            </Text>
            <Text style={styles.counter}>
              {filledCount} / {PHOTO_SLOTS.length} uploaded
            </Text>

            <ServicePhotoGrid
              photos={beforePhotos}
              uploadingSlot={uploadingSlot}
              onSlotPress={pickAndUpload}
              disabled={Boolean(uploadingSlot)}
            />
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
      gap: 10,
    },
    hint: {
      fontSize: 13,
      color: '#64748B',
      lineHeight: 18,
    },
    counter: {
      fontSize: 12,
      fontWeight: '600',
      color: '#94A3B8',
      marginBottom: 4,
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
      ...cardShadow,
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
