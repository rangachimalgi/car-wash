import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
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
import { getInventoryById, submitRefillRequest } from '../services/inventoryApi.js';
import {
  formatAmount,
  getCategoryIcon,
  getQuantityStep,
  getStockLabel,
} from '../utils/inventoryDisplay.js';

const MIN_REQUEST_QTY = 1;

const REASONS = ['Low Stock', 'Damaged', 'High Usage', 'Other'];

const DEFAULT_NOTES = {
  'Low Stock': 'Requesting refill to maintain minimum stock level.',
  Damaged: 'Item damaged — need replacement stock.',
  'High Usage': 'High usage this week — need more stock.',
  Other: '',
};

export default function RequestRefillScreen({ navigation, route, employeeId: employeeIdProp }) {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(), []);

  const employeeId = route?.params?.employeeId ?? employeeIdProp;
  const inventoryId = route?.params?.inventoryId;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [material, setMaterial] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('Low Stock');
  const [notes, setNotes] = useState(DEFAULT_NOTES['Low Stock']);
  const [reasonPickerOpen, setReasonPickerOpen] = useState(false);

  const step = useMemo(() => getQuantityStep(material?.unit), [material?.unit]);

  const loadMaterial = useCallback(async () => {
    if (!inventoryId) return;
    setLoading(true);
    try {
      const res = await getInventoryById(inventoryId);
      if (res?.success && res.data) {
        setMaterial(res.data);
        setQuantity(MIN_REQUEST_QTY);
        const defaultReason = res.data.isLowStock ? 'Low Stock' : 'Other';
        setReason(defaultReason);
        setNotes(DEFAULT_NOTES[defaultReason] || '');
      }
    } catch (e) {
      Alert.alert('Error', e?.message || 'Could not load item');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [inventoryId, navigation]);

  useEffect(() => {
    loadMaterial();
  }, [loadMaterial]);

  const adjustQuantity = (delta) => {
    setQuantity((prev) => {
      const next = Math.round((Number(prev) + delta) * 100) / 100;
      if (next < MIN_REQUEST_QTY) return MIN_REQUEST_QTY;
      return next;
    });
  };

  const selectReason = (value) => {
    setReason(value);
    setNotes((prev) => (prev.trim() ? prev : DEFAULT_NOTES[value] || ''));
    setReasonPickerOpen(false);
  };

  const handleSubmit = async () => {
    if (!material?._id || !employeeId) {
      Alert.alert('Error', 'Missing item or employee session.');
      return;
    }

    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty < MIN_REQUEST_QTY) {
      Alert.alert('Invalid quantity', `Minimum request is ${MIN_REQUEST_QTY} ${material.unit || 'units'}.`);
      return;
    }

    Alert.alert(
      'Submit request',
      `Request ${formatAmount(qty)} ${material.unit} of "${material.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            try {
              setSubmitting(true);
              const res = await submitRefillRequest(material._id, {
                quantity: qty,
                reason,
                notes: notes.trim(),
                employeeId,
              });
              if (res?.success) {
                Alert.alert('Submitted', res.message || 'Refill request sent to admin.', [
                  { text: 'View requests', onPress: () => navigation.replace('MyRequests', { employeeId }) },
                  { text: 'OK', onPress: () => navigation.goBack() },
                ]);
              } else {
                Alert.alert('Error', res?.message || 'Failed to submit');
              }
            } catch (e) {
              Alert.alert('Error', e?.message || 'Failed to submit');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const goToUsage = () => {
    navigation.navigate('MaterialUsage', {
      inventoryId: material?._id || inventoryId,
      employeeId,
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#1A1A1A" />
      </View>
    );
  }

  if (!material) return null;

  const unit = material.unit || 'units';
  const iconName = getCategoryIcon(material.category);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: 12 + insets.top }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Refill</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 24 + insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.itemCard}>
          <View style={styles.itemIcon}>
            <MaterialCommunityIcons name={iconName} size={32} color="#1A1A1A" />
          </View>
          <View style={styles.itemBody}>
            <Text style={styles.itemName}>{material.name}</Text>
            <Text style={styles.itemStock}>
              Current stock: {getStockLabel(material)}
            </Text>
            {material.isLowStock ? (
              <Text style={styles.itemLow}>Low stock — refill recommended</Text>
            ) : null}
          </View>
        </View>

        <Text style={styles.label}>Request quantity</Text>
        <View style={styles.stepperRow}>
          <TouchableOpacity style={styles.stepperBtn} onPress={() => adjustQuantity(-step)}>
            <MaterialCommunityIcons name="minus" size={22} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.stepperValue}>
            {formatAmount(quantity)} {unit}
          </Text>
          <TouchableOpacity style={styles.stepperBtn} onPress={() => adjustQuantity(step)}>
            <MaterialCommunityIcons name="plus" size={22} color="#1A1A1A" />
          </TouchableOpacity>
        </View>
        <Text style={styles.helper}>Minimum {formatAmount(MIN_REQUEST_QTY)} {unit}</Text>

        <Text style={styles.label}>Reason</Text>
        <TouchableOpacity style={styles.select} onPress={() => setReasonPickerOpen(true)}>
          <Text style={styles.selectText}>{reason}</Text>
          <MaterialCommunityIcons name="chevron-down" size={22} color="#6B7280" />
        </TouchableOpacity>

        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          placeholder="Add details for admin..."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Text style={styles.label}>Attachment (optional)</Text>
        <TouchableOpacity
          style={styles.photoBox}
          onPress={() => Alert.alert('Coming soon', 'Photo upload will be added in a future update.')}
        >
          <MaterialCommunityIcons name="camera-outline" size={28} color="#9CA3AF" />
          <Text style={styles.photoText}>Add photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkBtn} onPress={goToUsage}>
          <Text style={styles.linkBtnText}>Log usage instead</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.submitBtnText}>Submit request</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal visible={reasonPickerOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Reason</Text>
            {REASONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={styles.reasonRow}
                onPress={() => selectReason(opt)}
              >
                <Text style={[styles.reasonText, reason === opt && styles.reasonTextActive]}>
                  {opt}
                </Text>
                {reason === opt ? (
                  <MaterialCommunityIcons name="check" size={20} color="#1A1A1A" />
                ) : null}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalClose} onPress={() => setReasonPickerOpen(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    centered: { justifyContent: 'center', alignItems: 'center' },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
    },
    headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
    scroll: { paddingHorizontal: 16, paddingTop: 16 },
    itemCard: {
      flexDirection: 'row',
      gap: 12,
      padding: 14,
      borderRadius: 14,
      backgroundColor: '#F9FAFB',
      borderWidth: 1,
      borderColor: '#E5E7EB',
      marginBottom: 20,
    },
    itemIcon: {
      width: 56,
      height: 56,
      borderRadius: 12,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E5E7EB',
      alignItems: 'center',
      justifyContent: 'center',
    },
    itemBody: { flex: 1 },
    itemName: { fontSize: 16, fontWeight: '800', color: '#1A1A1A', marginBottom: 4 },
    itemStock: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
    itemLow: { fontSize: 12, fontWeight: '700', color: '#EA580C', marginTop: 4 },
    label: {
      fontSize: 13,
      fontWeight: '800',
      color: '#1A1A1A',
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    stepperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    stepperBtn: {
      width: 44,
      height: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepperValue: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
    helper: { fontSize: 12, color: '#6B7280', fontWeight: '600', marginBottom: 18 },
    select: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: 12,
      padding: 14,
      backgroundColor: '#F9FAFB',
      marginBottom: 18,
    },
    selectText: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
    notesInput: {
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: 12,
      padding: 14,
      minHeight: 100,
      fontSize: 14,
      fontWeight: '600',
      color: '#1A1A1A',
      marginBottom: 18,
    },
    photoBox: {
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: '#D1D5DB',
      borderRadius: 12,
      paddingVertical: 28,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    photoText: { marginTop: 8, fontSize: 13, fontWeight: '600', color: '#9CA3AF' },
    linkBtn: { alignItems: 'center', paddingVertical: 10 },
    linkBtnText: { fontSize: 14, fontWeight: '700', color: '#6B7280' },
    footer: {
      paddingHorizontal: 16,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: '#F3F4F6',
      backgroundColor: '#FFFFFF',
    },
    submitBtn: {
      backgroundColor: '#1A1A1A',
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
    },
    submitBtnDisabled: { opacity: 0.6 },
    submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      padding: 16,
    },
    modalTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12, color: '#1A1A1A' },
    reasonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
    },
    reasonText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
    reasonTextActive: { color: '#1A1A1A', fontWeight: '800' },
    modalClose: { marginTop: 12, paddingVertical: 12, alignItems: 'center' },
    modalCloseText: { fontSize: 14, fontWeight: '800', color: '#1A1A1A' },
  });
