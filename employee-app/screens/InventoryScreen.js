import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getInventory, updateInventoryStock } from '../services/inventoryApi.js';

export default function InventoryScreen({ employeeId }) {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(), []);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  const [quantityText, setQuantityText] = useState('1');
  const [submitting, setSubmitting] = useState(false);

  const fetchInventory = useCallback(async () => {
    try {
      setError('');
      const res = await getInventory();
      if (res?.success) {
        setItems(res.data || []);
      } else {
        setItems([]);
        setError(res?.message || 'Failed to fetch inventory');
      }
    } catch (e) {
      setItems([]);
      setError(e?.message || 'Failed to fetch inventory');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchInventory();
  }, [fetchInventory]);

  const filteredItems = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const name = String(it?.name || '').toLowerCase();
      const category = String(it?.category || '').toLowerCase();
      return name.includes(q) || category.includes(q);
    });
  }, [items, pickerSearch]);

  const parseQuantity = () => {
    const n = Number(quantityText);
    if (!Number.isFinite(n)) return null;
    if (n <= 0) return null;
    return n;
  };

  const updateItemInList = (updated) => {
    if (!updated?._id) return;
    setItems((prev) => prev.map((it) => (it._id === updated._id ? updated : it)));
    setSelectedItem((prev) => (prev?._id === updated._id ? updated : prev));
  };

  const handleMarkPurchased = async () => {
    if (!selectedItem?._id) {
      Alert.alert('Select an item', 'Please select an inventory item first.');
      return;
    }

    const qty = parseQuantity();
    if (!qty) {
      Alert.alert('Invalid quantity', 'Enter a quantity greater than 0.');
      return;
    }

    const name = selectedItem?.name || 'this item';
    const unit = selectedItem?.unit || 'units';

    Alert.alert(
      'Confirm',
      `Mark as purchased: remove ${qty} ${unit} from "${name}" stock?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              setSubmitting(true);
              const res = await updateInventoryStock(selectedItem._id, {
                quantity: qty,
                operation: 'remove',
              });

              if (res?.success) {
                updateItemInList(res.data);
                Alert.alert('Done', res.message || 'Updated inventory stock');
              } else {
                Alert.alert('Error', res?.message || 'Failed to update inventory stock');
              }
            } catch (e) {
              Alert.alert('Error', e?.message || 'Failed to update inventory stock');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const renderPickerItem = ({ item }) => {
    const isLow = Boolean(item?.isLowStock);
    return (
      <TouchableOpacity
        style={styles.pickerItem}
        onPress={() => {
          setSelectedItem(item);
          setPickerOpen(false);
          setPickerSearch('');
        }}
      >
        <View style={styles.pickerItemTopRow}>
          <Text style={styles.pickerItemTitle} numberOfLines={1}>
            {item?.name || 'Unnamed'}
          </Text>
          {isLow && (
            <View style={styles.lowStockBadge}>
              <Text style={styles.lowStockText}>Low</Text>
            </View>
          )}
        </View>
        <Text style={styles.pickerItemMeta} numberOfLines={1}>
          {item?.category || 'Other'} • Stock: {item?.currentStock ?? 0} {item?.unit || 'units'}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: 24 + insets.top }]}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#2F8CF4" />
        <Text style={styles.loadingText}>Loading inventory...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.content, { paddingTop: 24 + insets.top }]}>
        <StatusBar style="dark" />
        <Text style={styles.title}>Inventory</Text>
        <Text style={styles.subtitle}>
          Select an item and mark what you purchased (this will reduce stock).
        </Text>

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Couldn’t load inventory</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.secondaryButton} onPress={fetchInventory}>
              <Text style={styles.secondaryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Item</Text>
          <TouchableOpacity style={styles.selector} onPress={() => setPickerOpen(true)}>
            <View style={styles.selectorLeft}>
              <MaterialCommunityIcons name="magnify" size={20} color="#64748B" />
              <Text style={styles.selectorText} numberOfLines={1}>
                {selectedItem?.name ? selectedItem.name : 'Select inventory item'}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-down" size={22} color="#64748B" />
          </TouchableOpacity>

          {selectedItem ? (
            <View style={styles.selectedMeta}>
              <Text style={styles.selectedMetaText}>
                Category: {selectedItem?.category || 'Other'}
              </Text>
              <Text style={styles.selectedMetaText}>
                Stock: {selectedItem?.currentStock ?? 0} {selectedItem?.unit || 'units'}
              </Text>
              {selectedItem?.isLowStock ? (
                <Text style={[styles.selectedMetaText, styles.lowStockInline]}>
                  Low stock
                </Text>
              ) : null}
            </View>
          ) : null}

          <Text style={[styles.sectionTitle, { marginTop: 14 }]}>Quantity</Text>
          <TextInput
            value={quantityText}
            onChangeText={(t) => setQuantityText(t.replace(/[^0-9.]/g, ''))}
            keyboardType="numeric"
            placeholder="1"
            style={styles.quantityInput}
          />

          <TouchableOpacity
            style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]}
            onPress={handleMarkPurchased}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Mark as purchased</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.helperText}>
            (Employee: {employeeId || '—'})
          </Text>
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>All items</Text>
          <Text style={styles.listHint}>{items.length} items</Text>
        </View>

        <FlatList
          data={items}
          keyExtractor={(it) => it._id || `${it.name}-${it.category}`}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.listItem}>
              <View style={styles.listItemTopRow}>
                <Text style={styles.listItemTitle} numberOfLines={1}>
                  {item?.name || 'Unnamed'}
                </Text>
                {item?.isLowStock ? (
                  <View style={styles.lowStockBadge}>
                    <Text style={styles.lowStockText}>Low</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.listItemMeta} numberOfLines={1}>
                {item?.category || 'Other'} • Stock: {item?.currentStock ?? 0} {item?.unit || 'units'}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No inventory items found.</Text>
            </View>
          }
        />
      </View>

      <Modal visible={pickerOpen} animationType="slide" transparent onRequestClose={() => setPickerOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select item</Text>
              <TouchableOpacity onPress={() => setPickerOpen(false)} style={styles.modalClose}>
                <MaterialCommunityIcons name="close" size={20} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchRow}>
              <MaterialCommunityIcons name="magnify" size={20} color="#64748B" />
              <TextInput
                value={pickerSearch}
                onChangeText={setPickerSearch}
                placeholder="Search soap, towels, polish..."
                style={styles.searchInput}
                autoCorrect={false}
                autoCapitalize="none"
              />
            </View>

            <FlatList
              data={filteredItems}
              keyExtractor={(it) => it._id || `${it.name}-${it.category}`}
              renderItem={renderPickerItem}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.pickerList}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No matches.</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = () =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F5F6F8',
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    centerContent: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: '800',
      color: '#0F172A',
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 13,
      color: '#64748B',
      marginBottom: 14,
    },
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      padding: 16,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: '#0F172A',
      marginBottom: 8,
    },
    selector: {
      borderWidth: 1,
      borderColor: '#E2E8F0',
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#F8FAFC',
    },
    selectorLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    selectorText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#0F172A',
      flex: 1,
    },
    selectedMeta: {
      marginTop: 10,
      gap: 4,
    },
    selectedMetaText: {
      fontSize: 12,
      color: '#475569',
      fontWeight: '600',
    },
    lowStockInline: {
      color: '#B45309',
    },
    quantityInput: {
      borderWidth: 1,
      borderColor: '#E2E8F0',
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 12,
      backgroundColor: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
      color: '#0F172A',
    },
    primaryButton: {
      marginTop: 14,
      backgroundColor: '#2F8CF4',
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontWeight: '800',
      fontSize: 14,
    },
    primaryButtonDisabled: {
      opacity: 0.65,
    },
    helperText: {
      marginTop: 10,
      fontSize: 11,
      color: '#94A3B8',
      fontWeight: '600',
      textAlign: 'center',
    },
    listHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    listHint: {
      fontSize: 12,
      color: '#64748B',
      fontWeight: '700',
    },
    listContent: {
      paddingBottom: 20,
      gap: 12,
    },
    listItem: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      padding: 14,
    },
    listItemTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
      gap: 10,
    },
    listItemTitle: {
      flex: 1,
      fontSize: 14,
      fontWeight: '800',
      color: '#0F172A',
    },
    listItemMeta: {
      fontSize: 12,
      color: '#64748B',
      fontWeight: '600',
    },
    lowStockBadge: {
      backgroundColor: '#FEF3C7',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: '#FDE68A',
    },
    lowStockText: {
      fontSize: 11,
      fontWeight: '900',
      color: '#B45309',
    },
    emptyContainer: {
      padding: 24,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 13,
      color: '#64748B',
      fontWeight: '600',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: '#64748B',
      fontWeight: '600',
    },
    errorCard: {
      backgroundColor: '#FFF7ED',
      borderWidth: 1,
      borderColor: '#FED7AA',
      borderRadius: 16,
      padding: 14,
      marginBottom: 14,
    },
    errorTitle: {
      fontSize: 14,
      fontWeight: '900',
      color: '#9A3412',
      marginBottom: 4,
    },
    errorText: {
      fontSize: 12,
      color: '#9A3412',
      fontWeight: '600',
      marginBottom: 10,
    },
    secondaryButton: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#FDBA74',
    },
    secondaryButtonText: {
      color: '#9A3412',
      fontWeight: '900',
      fontSize: 13,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.45)',
      justifyContent: 'flex-end',
    },
    modalCard: {
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 12,
      maxHeight: '85%',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: '900',
      color: '#0F172A',
    },
    modalClose: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: '#F1F5F9',
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: '#F8FAFC',
      marginBottom: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      fontWeight: '700',
      color: '#0F172A',
    },
    pickerList: {
      paddingBottom: 12,
    },
    pickerItem: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#F1F5F9',
    },
    pickerItemTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      marginBottom: 4,
    },
    pickerItemTitle: {
      flex: 1,
      fontSize: 14,
      fontWeight: '900',
      color: '#0F172A',
    },
    pickerItemMeta: {
      fontSize: 12,
      color: '#64748B',
      fontWeight: '600',
    },
  });

