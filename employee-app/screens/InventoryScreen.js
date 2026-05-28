import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
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
import { getInventory, updateInventoryStock } from '../services/inventoryApi.js';

const CATEGORY_ICONS = {
  Soap: 'bottle-tonic-outline',
  Towels: 'hanger',
  Polish: 'spray',
  Equipment: 'toolbox-outline',
  Other: 'package-variant',
};

function getItemCapacity(item) {
  const current = Number(item?.currentStock) || 0;
  const threshold = Number(item?.lowStockThreshold) || 1;
  const max =
    Number(item?.maxCapacity) > 0
      ? Number(item.maxCapacity)
      : Math.max(current, threshold * 2, 1);
  const percent = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0;
  return { current, max, percent };
}

function formatQty(value, unit = 'units') {
  const n = Number(value) || 0;
  const display = Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, '');
  return `${display} ${unit}`;
}

function getCategoryIcon(category) {
  return CATEGORY_ICONS[category] || CATEGORY_ICONS.Other;
}

function computeStats(items) {
  let lowStock = 0;
  let inUse = 0;
  let available = 0;

  for (const item of items) {
    if (item?.isLowStock) lowStock += 1;
    const { current, max } = getItemCapacity(item);
    if (current > 0 && current < max) inUse += 1;
    else if (current >= max) available += 1;
    else if (current > 0 && !item?.isLowStock) available += 1;
  }

  return {
    totalItems: items.length,
    lowStock,
    inUse,
    available,
  };
}

function SummaryCard({ label, value, hint, highlight, style }) {
  return (
    <View style={[summaryStyles.card, highlight && summaryStyles.cardHighlight, style]}>
      <Text style={summaryStyles.label}>{label}</Text>
      <Text style={[summaryStyles.value, highlight && summaryStyles.valueHighlight]}>{value}</Text>
      <Text style={[summaryStyles.hint, highlight && summaryStyles.hintHighlight]}>{hint}</Text>
    </View>
  );
}

function MaterialRow({ item, onPress }) {
  const { current, max, percent } = getItemCapacity(item);
  const unit = item?.unit || 'units';
  const iconName = getCategoryIcon(item?.category);

  return (
    <TouchableOpacity style={materialStyles.row} onPress={onPress} activeOpacity={0.85}>
      <View style={materialStyles.thumb}>
        <MaterialCommunityIcons name={iconName} size={28} color="#1A1A1A" />
      </View>

      <View style={materialStyles.body}>
        <Text style={materialStyles.name} numberOfLines={1}>
          {item?.name || 'Unnamed'}
        </Text>
        <Text style={materialStyles.stockLine} numberOfLines={1}>
          {formatQty(current, unit)} Left / {formatQty(max, unit)}
        </Text>

        <View style={materialStyles.progressRow}>
          <View style={materialStyles.progressTrack}>
            <View style={[materialStyles.progressFill, { width: `${percent}%` }]} />
          </View>
          <Text style={materialStyles.percent}>{percent}%</Text>
        </View>
      </View>

      <MaterialCommunityIcons name="chevron-right" size={22} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

export default function InventoryScreen({ employeeId }) {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(), []);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);

  const [detailItem, setDetailItem] = useState(null);
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

  const stats = useMemo(() => computeStats(items), [items]);

  const displayedItems = useMemo(() => {
    if (filter === 'lowStock') return items.filter((it) => it?.isLowStock);
    if (filter === 'inUse') {
      return items.filter((it) => {
        const { current, max } = getItemCapacity(it);
        return current > 0 && current < max;
      });
    }
    if (filter === 'available') {
      return items.filter((it) => {
        const { current, max } = getItemCapacity(it);
        return current >= max || (current > 0 && !it?.isLowStock);
      });
    }
    return items;
  }, [items, filter]);

  const filterLabel = {
    all: 'All items',
    lowStock: 'Low stock',
    inUse: 'In use',
    available: 'Available',
  }[filter];

  const parseQuantity = () => {
    const n = Number(quantityText);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
  };

  const updateItemInList = (updated) => {
    if (!updated?._id) return;
    setItems((prev) => prev.map((it) => (it._id === updated._id ? updated : it)));
    setDetailItem((prev) => (prev?._id === updated._id ? updated : prev));
  };

  const openDetail = (item) => {
    setDetailItem(item);
    setQuantityText('1');
  };

  const closeDetail = () => {
    setDetailItem(null);
    setQuantityText('1');
  };

  const handleMarkPurchased = async () => {
    if (!detailItem?._id) return;

    const qty = parseQuantity();
    if (!qty) {
      Alert.alert('Invalid quantity', 'Enter a quantity greater than 0.');
      return;
    }

    const name = detailItem?.name || 'this item';
    const unit = detailItem?.unit || 'units';

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
              const res = await updateInventoryStock(detailItem._id, {
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

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: 24 + insets.top }]}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#1A1A1A" />
        <Text style={styles.loadingText}>Loading inventory...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: 12 + insets.top }]}>
        <TouchableOpacity style={styles.headerBtn} activeOpacity={0.7}>
          <MaterialCommunityIcons name="menu" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inventory</Text>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => setFilterOpen(true)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="filter-variant" size={24} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 24 + insets.bottom + 88 },
        ]}
      >
        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Couldn’t load inventory</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchInventory}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <SummaryCard
              style={styles.statCardHalf}
              label="Total Items"
              value={String(stats.totalItems)}
              hint="All Items"
            />
            <SummaryCard
              style={styles.statCardHalf}
              label="Low Stock"
              value={String(stats.lowStock)}
              hint="Needs refill"
              highlight={stats.lowStock > 0}
            />
          </View>
          <View style={styles.statsRow}>
            <SummaryCard
              style={styles.statCardHalf}
              label="In Use"
              value={String(stats.inUse)}
              hint="Items"
            />
            <SummaryCard
              style={styles.statCardHalf}
              label="Available"
              value={String(stats.available)}
              hint="Items"
            />
          </View>
        </View>

        <View style={styles.listSectionHeader}>
          <Text style={styles.listSectionTitle}>Material List</Text>
          {filter !== 'all' ? (
            <Text style={styles.filterBadge}>{filterLabel}</Text>
          ) : null}
        </View>

        {displayedItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No materials found.</Text>
          </View>
        ) : (
          displayedItems.map((item) => (
            <MaterialRow
              key={item._id || `${item.name}-${item.category}`}
              item={item}
              onPress={() => openDetail(item)}
            />
          ))
        )}
      </ScrollView>

      <Modal visible={filterOpen} animationType="fade" transparent onRequestClose={() => setFilterOpen(false)}>
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalBackdropTap}
            activeOpacity={1}
            onPress={() => setFilterOpen(false)}
          />
          <View style={styles.filterSheet}>
            <Text style={styles.filterSheetTitle}>Filter</Text>
            {[
              { id: 'all', label: 'All items' },
              { id: 'lowStock', label: 'Low stock' },
              { id: 'inUse', label: 'In use' },
              { id: 'available', label: 'Available' },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[styles.filterOption, filter === opt.id && styles.filterOptionActive]}
                onPress={() => {
                  setFilter(opt.id);
                  setFilterOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    filter === opt.id && styles.filterOptionTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
                {filter === opt.id ? (
                  <MaterialCommunityIcons name="check" size={20} color="#1A1A1A" />
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <Modal visible={Boolean(detailItem)} animationType="slide" transparent onRequestClose={closeDetail}>
        <View style={styles.modalBackdrop}>
          <View style={styles.detailSheet}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle} numberOfLines={1}>
                {detailItem?.name || 'Item'}
              </Text>
              <TouchableOpacity onPress={closeDetail} style={styles.detailClose}>
                <MaterialCommunityIcons name="close" size={20} color="#1A1A1A" />
              </TouchableOpacity>
            </View>

            {detailItem ? (
              <>
                <View style={styles.detailMeta}>
                  <Text style={styles.detailMetaText}>
                    {formatQty(getItemCapacity(detailItem).current, detailItem.unit)} left of{' '}
                    {formatQty(getItemCapacity(detailItem).max, detailItem.unit)}
                  </Text>
                  <Text style={styles.detailMetaText}>
                    Category: {detailItem.category || 'Other'}
                  </Text>
                  {detailItem.isLowStock ? (
                    <Text style={styles.detailLow}>Low stock — needs refill</Text>
                  ) : null}
                </View>

                <Text style={styles.detailLabel}>Quantity used / purchased</Text>
                <TextInput
                  value={quantityText}
                  onChangeText={(t) => setQuantityText(t.replace(/[^0-9.]/g, ''))}
                  keyboardType="numeric"
                  placeholder="1"
                  style={styles.quantityInput}
                  placeholderTextColor="#9CA3AF"
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
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const summaryStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
  },
  cardHighlight: {
    borderColor: '#1A1A1A',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  value: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  valueHighlight: {
    color: '#000000',
  },
  hint: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  hintHighlight: {
    color: '#4B5563',
  },
});

const materialStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  stockLine: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#1A1A1A',
  },
  percent: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1A1A',
    minWidth: 36,
    textAlign: 'right',
  },
});

const createStyles = () =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    centerContent: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
    },
    headerBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: '#1A1A1A',
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    statsGrid: {
      gap: 12,
      marginBottom: 24,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 12,
    },
    statCardHalf: {
      flex: 1,
    },
    listSectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    listSectionTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: '#1A1A1A',
    },
    filterBadge: {
      fontSize: 12,
      fontWeight: '700',
      color: '#6B7280',
      backgroundColor: '#F3F4F6',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },
    emptyContainer: {
      paddingVertical: 32,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 14,
      color: '#6B7280',
      fontWeight: '600',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: '#6B7280',
      fontWeight: '600',
    },
    errorCard: {
      backgroundColor: '#F9FAFB',
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: 14,
      padding: 14,
      marginBottom: 16,
    },
    errorTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: '#1A1A1A',
      marginBottom: 4,
    },
    errorText: {
      fontSize: 12,
      color: '#6B7280',
      fontWeight: '600',
      marginBottom: 10,
    },
    retryBtn: {
      borderWidth: 1,
      borderColor: '#1A1A1A',
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: 'center',
    },
    retryBtnText: {
      fontSize: 13,
      fontWeight: '800',
      color: '#1A1A1A',
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      justifyContent: 'flex-end',
    },
    modalBackdropTap: {
      ...StyleSheet.absoluteFillObject,
    },
    filterSheet: {
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      padding: 20,
      paddingBottom: 32,
    },
    filterSheetTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: '#1A1A1A',
      marginBottom: 12,
    },
    filterOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
    },
    filterOptionActive: {},
    filterOptionText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#6B7280',
    },
    filterOptionTextActive: {
      color: '#1A1A1A',
      fontWeight: '800',
    },
    detailSheet: {
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      padding: 20,
      paddingBottom: 32,
    },
    detailHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    detailTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: '800',
      color: '#1A1A1A',
      marginRight: 12,
    },
    detailClose: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: '#F3F4F6',
      alignItems: 'center',
      justifyContent: 'center',
    },
    detailMeta: {
      gap: 4,
      marginBottom: 16,
    },
    detailMetaText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#6B7280',
    },
    detailLow: {
      fontSize: 13,
      fontWeight: '700',
      color: '#1A1A1A',
      marginTop: 4,
    },
    detailLabel: {
      fontSize: 13,
      fontWeight: '800',
      color: '#1A1A1A',
      marginBottom: 8,
    },
    quantityInput: {
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      fontWeight: '700',
      color: '#1A1A1A',
      marginBottom: 14,
    },
    primaryButton: {
      backgroundColor: '#1A1A1A',
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
      opacity: 0.6,
    },
  });
