import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../services/api.js';
import {
  getInventory,
  getInventoryUsage,
  recordInventoryUsage,
  updateInventoryStock,
} from '../services/inventoryApi.js';
import {
  buildJobPickerLabel,
  formatAmount,
  getCategoryIcon,
  getItemCapacity,
  getQuantityStep,
  getStockLabel,
} from '../utils/inventoryDisplay.js';
import { mapOrderToBooking } from '../utils/jobBookingHelpers.js';

function formatUsageDate(value) {
  try {
    return new Date(value).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export default function MaterialUsageScreen({ navigation, route, employeeId: employeeIdProp }) {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(), []);

  const employeeId = route?.params?.employeeId ?? employeeIdProp;
  const initialInventoryId = route?.params?.inventoryId;
  const initialOrderId = route?.params?.orderId;
  const fromJobComplete = Boolean(route?.params?.fromJobComplete);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [allMaterials, setAllMaterials] = useState([]);
  const [material, setMaterial] = useState(null);
  const [job, setJob] = useState(null);
  const [jobOptions, setJobOptions] = useState([]);
  const [history, setHistory] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [materialPickerOpen, setMaterialPickerOpen] = useState(false);
  const [jobPickerOpen, setJobPickerOpen] = useState(false);

  const step = useMemo(() => getQuantityStep(material?.unit), [material?.unit]);
  const jobLocked = Boolean(initialOrderId);
  const materialLocked = Boolean(initialInventoryId);

  const loadHistory = useCallback(async (inventoryId) => {
    if (!inventoryId) return;
    try {
      const res = await getInventoryUsage(inventoryId);
      if (res?.success) setHistory(res.data || []);
    } catch {
      setHistory([]);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const tasks = [getInventory()];
      if (employeeId) {
        tasks.push(
          api.get(`/jobs/queue?employeeId=${employeeId}`),
          api.get(`/jobs/history?employeeId=${employeeId}`)
        );
      }

      const results = await Promise.all(tasks);
      const invRes = results[0];
      const materials = invRes?.success ? invRes.data || [] : [];
      setAllMaterials(materials);

      if (initialInventoryId) {
        const found = materials.find((m) => String(m._id) === String(initialInventoryId));
        setMaterial(found || null);
        if (found) await loadHistory(found._id);
      }

      if (employeeId && results.length > 2) {
        const queue = results[1]?.data?.data || [];
        const historyJobs = results[2]?.data?.data || [];
        const byId = new Map();
        for (const order of [...queue, ...historyJobs]) {
          if (order?._id) byId.set(String(order._id), order);
        }
        const options = [...byId.values()].map((order) => ({
          id: order._id,
          order,
          label: buildJobPickerLabel(order),
        }));
        setJobOptions(options);

        if (initialOrderId) {
          const match = byId.get(String(initialOrderId));
          if (match) setJob({ id: match._id, order: match, label: buildJobPickerLabel(match) });
          else {
            try {
              const orderRes = await api.get(
                `/orders/${initialOrderId}?employeeId=${employeeId}`
              );
              const order = orderRes.data?.data;
              if (order) {
                setJob({
                  id: order._id,
                  order,
                  label: buildJobPickerLabel(order),
                });
              }
            } catch {
              /* order may still display after usage if missing from list */
            }
          }
        }
      }
    } catch (e) {
      console.error('Material usage load error:', e);
    } finally {
      setLoading(false);
    }
  }, [employeeId, initialInventoryId, initialOrderId, loadHistory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (material?._id) {
      setQuantity(getQuantityStep(material.unit));
    }
  }, [material?._id, material?.unit]);

  const adjustQuantity = (delta) => {
    setQuantity((prev) => {
      const next = Math.round((Number(prev) + delta) * 100) / 100;
      return next < step ? step : next;
    });
  };

  const handleUpdateUsage = async () => {
    if (!material?._id) {
      Alert.alert('Select material', 'Choose which material was used.');
      return;
    }
    if (!job?.id) {
      Alert.alert('Select job', 'Choose which job this usage is for.');
      return;
    }
    if (!employeeId) {
      Alert.alert('Error', 'Employee session missing. Please log in again.');
      return;
    }

    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      Alert.alert('Invalid quantity', 'Enter a quantity greater than 0.');
      return;
    }

    Alert.alert(
      'Confirm usage',
      `Record ${formatAmount(qty)} ${material.unit || 'units'} of "${material.name}" for ${job.label}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            try {
              setSubmitting(true);
              const res = await recordInventoryUsage(material._id, {
                quantity: qty,
                orderId: job.id,
                employeeId,
              });
              if (res?.success) {
                const updated = res.data?.inventory;
                if (updated) {
                  setMaterial(updated);
                  setAllMaterials((prev) =>
                    prev.map((m) => (m._id === updated._id ? updated : m))
                  );
                }
                await loadHistory(material._id);
                setQuantity(getQuantityStep(material.unit));
                Alert.alert('Done', res.message || 'Usage recorded.');
              } else {
                Alert.alert('Error', res?.message || 'Failed to record usage');
              }
            } catch (e) {
              Alert.alert('Error', e?.message || 'Failed to record usage');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handleMarkPurchased = () => {
    if (!material?._id) {
      Alert.alert('Select material', 'Choose a material first.');
      return;
    }
    Alert.alert(
      'Mark as purchased',
      `Remove ${formatAmount(quantity)} ${material.unit} from stock without linking to a job?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              setSubmitting(true);
              const res = await updateInventoryStock(material._id, {
                quantity: Number(quantity),
                operation: 'remove',
              });
              if (res?.success) {
                setMaterial(res.data);
                setAllMaterials((prev) =>
                  prev.map((m) => (m._id === res.data._id ? res.data : m))
                );
                await loadHistory(material._id);
                Alert.alert('Done', res.message || 'Stock updated.');
              } else {
                Alert.alert('Error', res?.message || 'Failed to update stock');
              }
            } catch (e) {
              Alert.alert('Error', e?.message || 'Failed to update stock');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const finishFlow = () => {
    if (fromJobComplete) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
      return;
    }
    navigation.goBack();
  };

  const { percent, hasConfiguredMax } = material ? getItemCapacity(material) : {};

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#1A1A1A" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: 12 + insets.top }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Material Details</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 24 + insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {fromJobComplete ? (
          <Text style={styles.banner}>
            Job completed — log any materials you used on this job.
          </Text>
        ) : null}

        <Text style={styles.sectionLabel}>Job</Text>
        <TouchableOpacity
          style={[styles.selector, jobLocked && styles.selectorLocked]}
          onPress={() => !jobLocked && setJobPickerOpen(true)}
          disabled={jobLocked}
        >
          <Text style={styles.selectorText} numberOfLines={2}>
            {job?.label || 'Select job'}
          </Text>
          {!jobLocked ? (
            <MaterialCommunityIcons name="chevron-down" size={22} color="#6B7280" />
          ) : null}
        </TouchableOpacity>

        <Text style={[styles.sectionLabel, { marginTop: 18 }]}>Material</Text>
        <TouchableOpacity
          style={[styles.selector, materialLocked && styles.selectorLocked]}
          onPress={() => !materialLocked && setMaterialPickerOpen(true)}
          disabled={materialLocked}
        >
          <Text style={styles.selectorText} numberOfLines={1}>
            {material?.name || 'Select material'}
          </Text>
          {!materialLocked ? (
            <MaterialCommunityIcons name="chevron-down" size={22} color="#6B7280" />
          ) : null}
        </TouchableOpacity>

        {material ? (
          <View style={styles.materialCard}>
            <View style={styles.materialIcon}>
              <MaterialCommunityIcons
                name={getCategoryIcon(material.category)}
                size={32}
                color="#1A1A1A"
              />
            </View>
            <View style={styles.materialBody}>
              <Text style={styles.materialName}>{material.name}</Text>
              <Text style={styles.materialStock}>{getStockLabel(material)}</Text>
              {hasConfiguredMax ? (
                <View style={styles.progressRow}>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${percent}%` }]} />
                  </View>
                  <Text style={styles.percentText}>{percent}%</Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        <Text style={[styles.sectionLabel, { marginTop: 18 }]}>Used quantity</Text>
        <View style={styles.stepperRow}>
          <TouchableOpacity style={styles.stepperBtn} onPress={() => adjustQuantity(-step)}>
            <MaterialCommunityIcons name="minus" size={22} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.stepperValue}>
            {formatAmount(quantity)} {material?.unit || ''}
          </Text>
          <TouchableOpacity style={styles.stepperBtn} onPress={() => adjustQuantity(step)}>
            <MaterialCommunityIcons name="plus" size={22} color="#1A1A1A" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, submitting && styles.primaryBtnDisabled]}
          onPress={handleUpdateUsage}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.primaryBtnText}>Update usage</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkBtn} onPress={handleMarkPurchased} disabled={submitting}>
          <Text style={styles.linkBtnText}>Mark as purchased (no job)</Text>
        </TouchableOpacity>

        {fromJobComplete ? (
          <TouchableOpacity style={styles.doneBtn} onPress={finishFlow}>
            <Text style={styles.doneBtnText}>Done — back to home</Text>
          </TouchableOpacity>
        ) : null}

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Usage history</Text>
        {history.length === 0 ? (
          <Text style={styles.emptyHistory}>No usage logged yet for this material.</Text>
        ) : (
          history.map((entry) => (
            <View key={entry._id} style={styles.historyRow}>
              <Text style={styles.historyDate}>{formatUsageDate(entry.createdAt)}</Text>
              <Text style={styles.historyDetail}>
                Used {formatAmount(entry.quantity)} {entry.unit || ''}
                {entry.jobLabel || entry.orderNumber
                  ? ` — ${entry.jobLabel || entry.orderNumber}`
                  : ''}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={materialPickerOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Select material</Text>
            <FlatList
              data={allMaterials}
              keyExtractor={(it) => it._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerRow}
                  onPress={async () => {
                    setMaterial(item);
                    setMaterialPickerOpen(false);
                    await loadHistory(item._id);
                  }}
                >
                  <Text style={styles.pickerRowTitle}>{item.name}</Text>
                  <Text style={styles.pickerRowMeta}>{getStockLabel(item)}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalClose} onPress={() => setMaterialPickerOpen(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={jobPickerOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Select job</Text>
            <FlatList
              data={jobOptions}
              keyExtractor={(it) => it.id}
              ListEmptyComponent={
                <Text style={styles.emptyHistory}>No recent jobs found.</Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerRow}
                  onPress={() => {
                    setJob(item);
                    setJobPickerOpen(false);
                  }}
                >
                  <Text style={styles.pickerRowTitle}>{item.label}</Text>
                  <Text style={styles.pickerRowMeta}>
                    {mapOrderToBooking(item.order, employeeId).service}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalClose} onPress={() => setJobPickerOpen(false)}>
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
    banner: {
      fontSize: 13,
      color: '#4B5563',
      fontWeight: '600',
      marginBottom: 16,
      lineHeight: 18,
    },
    sectionLabel: {
      fontSize: 13,
      fontWeight: '800',
      color: '#1A1A1A',
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    selector: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: 12,
      padding: 14,
      backgroundColor: '#F9FAFB',
    },
    selectorLocked: { backgroundColor: '#F3F4F6' },
    selectorText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
    materialCard: {
      flexDirection: 'row',
      marginTop: 12,
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      gap: 12,
    },
    materialIcon: {
      width: 56,
      height: 56,
      borderRadius: 12,
      backgroundColor: '#F3F4F6',
      alignItems: 'center',
      justifyContent: 'center',
    },
    materialBody: { flex: 1 },
    materialName: { fontSize: 16, fontWeight: '800', color: '#1A1A1A', marginBottom: 4 },
    materialStock: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 8 },
    progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    progressTrack: {
      flex: 1,
      height: 6,
      borderRadius: 999,
      backgroundColor: '#E5E7EB',
      overflow: 'hidden',
    },
    progressFill: { height: '100%', backgroundColor: '#1A1A1A', borderRadius: 999 },
    percentText: { fontSize: 12, fontWeight: '700', color: '#1A1A1A', minWidth: 36 },
    stepperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
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
    primaryBtn: {
      backgroundColor: '#1A1A1A',
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    primaryBtnDisabled: { opacity: 0.6 },
    primaryBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
    linkBtn: { marginTop: 12, alignItems: 'center', paddingVertical: 8 },
    linkBtnText: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
    doneBtn: {
      marginTop: 16,
      borderWidth: 1,
      borderColor: '#1A1A1A',
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    doneBtnText: { fontSize: 14, fontWeight: '800', color: '#1A1A1A' },
    emptyHistory: { fontSize: 13, color: '#9CA3AF', fontWeight: '600' },
    historyRow: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
    },
    historyDate: { fontSize: 12, fontWeight: '600', color: '#9CA3AF', marginBottom: 4 },
    historyDetail: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
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
      maxHeight: '70%',
    },
    modalTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12, color: '#1A1A1A' },
    pickerRow: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
    },
    pickerRowTitle: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
    pickerRowMeta: { fontSize: 12, color: '#6B7280', marginTop: 2, fontWeight: '600' },
    modalClose: { marginTop: 12, paddingVertical: 12, alignItems: 'center' },
    modalCloseText: { fontSize: 14, fontWeight: '800', color: '#1A1A1A' },
  });
