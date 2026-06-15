import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { confirmRefillReceive, getRefillRequests } from '../services/inventoryApi.js';
import {
  formatAmount,
  getCategoryIcon,
  getQuantityStep,
} from '../utils/inventoryDisplay.js';

function formatApprovedDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatQtyDisplay(qty, unit) {
  const formatted = formatAmount(qty);
  const u = String(unit || '').toLowerCase();
  if (u === 'l' || u.includes('liter')) return `${formatted} L`;
  if (u === 'ml') return `${formatted} ml`;
  if (u === 'pcs' || u === 'pc' || u === 'pieces') return `${formatted} pcs`;
  return `${formatted} ${unit || 'units'}`;
}

export default function ReceiveItemsScreen({ navigation, route, employeeId: employeeIdProp }) {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(), []);

  const employeeId = route?.params?.employeeId ?? employeeIdProp;
  const requestId = route?.params?.requestId;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [request, setRequest] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [condition, setCondition] = useState('Good');
  const [notes, setNotes] = useState('Items received in good condition.');
  const [photoUri, setPhotoUri] = useState(null);

  const maxQty = Number(request?.quantity) || 1;
  const unit = request?.unit || request?.inventoryId?.unit || 'units';
  const step = useMemo(() => getQuantityStep(unit), [unit]);
  const item = request?.inventoryId;
  const category = item?.category || 'Other';
  const iconName = getCategoryIcon(category);

  const loadRequest = useCallback(async () => {
    if (!requestId || !employeeId) {
      Alert.alert('Error', 'Missing request details.');
      navigation.goBack();
      return;
    }

    setLoading(true);
    try {
      const res = await getRefillRequests({ employeeId, status: 'approved' });
      const found = (res?.data || []).find((r) => String(r._id) === String(requestId));
      if (!found) {
        Alert.alert('Not available', 'This request is no longer awaiting receipt.');
        navigation.goBack();
        return;
      }
      if (found.status !== 'approved') {
        Alert.alert('Already handled', `This request is ${found.status}.`);
        navigation.goBack();
        return;
      }
      setRequest(found);
      setQuantity(Number(found.quantity) || 1);
    } catch (e) {
      Alert.alert('Error', e?.message || 'Could not load request');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [requestId, employeeId, navigation]);

  useEffect(() => {
    loadRequest();
  }, [loadRequest]);

  const adjustQuantity = (delta) => {
    setQuantity((prev) => {
      const next = Math.round((Number(prev) + delta) * 100) / 100;
      if (next < step) return step;
      if (next > maxQty) return maxQty;
      return next;
    });
  };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleConfirm = () => {
    if (!request?._id || !employeeId) return;

    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0 || qty > maxQty) {
      Alert.alert('Invalid quantity', `Enter between ${step} and ${formatQtyDisplay(maxQty, unit)}.`);
      return;
    }

    Alert.alert(
      'Confirm receive',
      `Receive ${formatQtyDisplay(qty, unit)} of "${request.itemName || item?.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setSubmitting(true);
              const res = await confirmRefillReceive(request._id, {
                employeeId,
                quantity: qty,
                condition,
                notes: notes.trim(),
              });
              if (res?.success) {
                Alert.alert('Received', res.message || 'Stock updated.', [
                  { text: 'OK', onPress: () => navigation.replace('MyRequests', { employeeId }) },
                ]);
              } else {
                Alert.alert('Error', res?.message || 'Failed to confirm');
              }
            } catch (e) {
              Alert.alert('Error', e?.message || 'Failed to confirm receipt');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: 12 + insets.top }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receive Items</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 + insets.bottom + 100 }]}
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryThumb}>
            <MaterialCommunityIcons name={iconName} size={32} color="#374151" />
          </View>
          <View style={styles.summaryBody}>
            <Text style={styles.summaryName}>{request.itemName || item?.name || 'Item'}</Text>
            <Text style={styles.summaryQty}>{formatQtyDisplay(maxQty, unit)}</Text>
            <Text style={styles.summaryDate}>
              Approved on {formatApprovedDate(request.reviewedAt || request.updatedAt)}
            </Text>
          </View>
          <View style={styles.approvedCheck}>
            <MaterialCommunityIcons name="check-circle" size={28} color="#16A34A" />
          </View>
        </View>

        <Text style={styles.sectionLabel}>Receive Quantity</Text>
        <View style={styles.stepperRow}>
          <TouchableOpacity style={styles.stepperBtn} onPress={() => adjustQuantity(-step)} activeOpacity={0.7}>
            <MaterialCommunityIcons name="minus" size={22} color="#1A1A1A" />
          </TouchableOpacity>
          <View style={styles.stepperValue}>
            <Text style={styles.stepperValueText}>{formatQtyDisplay(quantity, unit)}</Text>
          </View>
          <TouchableOpacity style={styles.stepperBtn} onPress={() => adjustQuantity(step)} activeOpacity={0.7}>
            <MaterialCommunityIcons name="plus" size={22} color="#1A1A1A" />
          </TouchableOpacity>
        </View>
        <Text style={styles.helperText}>Max Approved: {formatQtyDisplay(maxQty, unit)}</Text>

        <Text style={styles.sectionLabel}>Verify Condition</Text>
        <View style={styles.radioRow}>
          {['Good', 'Damaged'].map((opt) => {
            const selected = condition === opt;
            return (
              <TouchableOpacity
                key={opt}
                style={styles.radioOption}
                onPress={() => {
                  setCondition(opt);
                  if (opt === 'Damaged' && notes === 'Items received in good condition.') {
                    setNotes('Items received with damage — noted for admin.');
                  }
                  if (opt === 'Good' && notes === 'Items received with damage — noted for admin.') {
                    setNotes('Items received in good condition.');
                  }
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                  {selected ? <View style={styles.radioInner} /> : null}
                </View>
                <Text style={styles.radioLabel}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>Notes (Optional)</Text>
        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          placeholder="Add any notes about the delivery..."
          placeholderTextColor="#9CA3AF"
          multiline
          textAlignVertical="top"
        />

        <Text style={styles.sectionLabel}>Photo (Optional)</Text>
        {photoUri ? (
          <View style={styles.photoPreviewWrap}>
            <Image source={{ uri: photoUri }} style={styles.photoPreview} />
            <TouchableOpacity style={styles.removePhotoBtn} onPress={() => setPhotoUri(null)}>
              <MaterialCommunityIcons name="close-circle" size={24} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.addPhotoBtn} onPress={pickPhoto} activeOpacity={0.85}>
            <MaterialCommunityIcons name="camera-outline" size={22} color="#2563EB" />
            <Text style={styles.addPhotoText}>Add Photo</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={[styles.confirmBtn, submitting && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmBtnText}>Confirm Receive</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    centered: { justifyContent: 'center', alignItems: 'center', gap: 12 },
    loadingText: { fontSize: 14, color: '#6B7280' },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
    },
    headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    scrollContent: { paddingHorizontal: 20, paddingTop: 20 },
    summaryCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F9FAFB',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      padding: 14,
      marginBottom: 24,
      gap: 12,
    },
    summaryThumb: {
      width: 56,
      height: 56,
      borderRadius: 12,
      backgroundColor: '#E0F2FE',
      alignItems: 'center',
      justifyContent: 'center',
    },
    summaryBody: { flex: 1, minWidth: 0 },
    summaryName: { fontSize: 16, fontWeight: '700', color: '#111827' },
    summaryQty: { fontSize: 14, color: '#4B5563', marginTop: 2 },
    summaryDate: { fontSize: 13, color: '#6B7280', marginTop: 4 },
    approvedCheck: { paddingLeft: 4 },
    sectionLabel: {
      fontSize: 15,
      fontWeight: '700',
      color: '#111827',
      marginBottom: 10,
    },
    stepperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 6,
    },
    stepperBtn: {
      width: 44,
      height: 44,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFFFFF',
    },
    stepperValue: {
      flex: 1,
      height: 48,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFFFFF',
    },
    stepperValueText: { fontSize: 16, fontWeight: '600', color: '#111827' },
    helperText: { fontSize: 13, color: '#6B7280', marginBottom: 24 },
    radioRow: { flexDirection: 'row', gap: 24, marginBottom: 24 },
    radioOption: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    radioOuter: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: '#D1D5DB',
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioOuterSelected: { borderColor: '#2563EB' },
    radioInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: '#2563EB',
    },
    radioLabel: { fontSize: 15, fontWeight: '600', color: '#111827' },
    notesInput: {
      minHeight: 88,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: 12,
      padding: 14,
      fontSize: 15,
      color: '#111827',
      backgroundColor: '#FFFFFF',
      marginBottom: 24,
    },
    addPhotoBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderWidth: 1.5,
      borderColor: '#BFDBFE',
      borderStyle: 'dashed',
      borderRadius: 12,
      paddingVertical: 18,
      backgroundColor: '#F8FAFC',
    },
    addPhotoText: { fontSize: 15, fontWeight: '600', color: '#2563EB' },
    photoPreviewWrap: { position: 'relative', marginBottom: 8 },
    photoPreview: { width: '100%', height: 160, borderRadius: 12 },
    removePhotoBtn: { position: 'absolute', top: 8, right: 8 },
    footer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: 20,
      paddingTop: 12,
      backgroundColor: '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
    },
    confirmBtn: {
      backgroundColor: '#2563EB',
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
    },
    confirmBtnDisabled: { opacity: 0.7 },
    confirmBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  });
