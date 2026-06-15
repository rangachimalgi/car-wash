import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getInventory } from '../services/inventoryApi.js';

const CATEGORY_ICONS = {
  Soap: 'bottle-tonic-outline',
  Towels: 'hanger',
  Polish: 'spray',
  Equipment: 'toolbox-outline',
  Other: 'package-variant',
};

function readMaxCapacity(item) {
  const raw = item?.maxCapacity ?? item?.max_capacity;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function getItemCapacity(item) {
  const current = Number(item?.currentStock) || 0;
  const max = readMaxCapacity(item);
  const percent =
    max != null && max > 0 ? Math.min(100, Math.round((current / max) * 100)) : null;
  return { current, max, percent, hasConfiguredMax: max != null };
}

function formatAmount(value) {
  const n = Number(value) || 0;
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, '');
}

function getStockLabel(item) {
  const { current, max, hasConfiguredMax } = getItemCapacity(item);
  const unit = item?.unit || 'units';
  if (hasConfiguredMax) {
    return `${formatAmount(current)} left / ${formatAmount(max)} ${unit}`;
  }
  return `${formatAmount(current)} ${unit} in stock`;
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
    const { current, max, hasConfiguredMax } = getItemCapacity(item);
    if (!hasConfiguredMax) continue;
    if (current > 0 && current < max) inUse += 1;
    else if (current >= max) available += 1;
  }

  return {
    totalItems: items.length,
    lowStock,
    inUse,
    available,
  };
}

const ALERT_ORANGE = '#EA580C';
const ALERT_ORANGE_LIGHT = '#FFF7ED';
const ALERT_ORANGE_BORDER = '#FDBA74';

function SummaryCard({ label, value, hint, variant, onPress, style }) {
  const isAlert = variant === 'alert';
  const isInfo = variant === 'info';
  const isSuccess = variant === 'success';

  const content = (
    <View
      style={[
        summaryStyles.card,
        isAlert && summaryStyles.cardAlert,
        isInfo && summaryStyles.cardInfo,
        isSuccess && summaryStyles.cardSuccess,
        style,
      ]}
    >
      <Text style={[summaryStyles.label, isAlert && summaryStyles.labelAlert]}>{label}</Text>
      <Text
        style={[
          summaryStyles.value,
          isAlert && summaryStyles.valueAlert,
          isInfo && summaryStyles.valueInfo,
          isSuccess && summaryStyles.valueSuccess,
        ]}
      >
        {value}
      </Text>
      <Text style={[summaryStyles.hint, isAlert && summaryStyles.hintAlert]}>{hint}</Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={style}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

function MaterialRow({ item, onPress, variant = 'default' }) {
  const { percent, hasConfiguredMax } = getItemCapacity(item);
  const iconName = getCategoryIcon(item?.category);
  const isAlert = variant === 'alert';

  return (
    <TouchableOpacity
      style={[materialStyles.row, isAlert && materialStyles.rowAlert]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[materialStyles.thumb, isAlert && materialStyles.thumbAlert]}>
        <MaterialCommunityIcons name={iconName} size={28} color={isAlert ? ALERT_ORANGE : '#1A1A1A'} />
      </View>

      <View style={materialStyles.body}>
        <View style={materialStyles.nameRow}>
          <Text style={materialStyles.name} numberOfLines={1}>
            {item?.name || 'Unnamed'}
          </Text>
          {isAlert ? (
            <View style={materialStyles.lowBadge}>
              <Text style={materialStyles.lowBadgeText}>Low Stock</Text>
            </View>
          ) : null}
        </View>
        <Text style={materialStyles.stockLine}>{getStockLabel(item)}</Text>
        {/* {isAlert && item?.lowStockThreshold != null ? (
          <Text style={materialStyles.thresholdHint}>
            Alert at {formatAmount(item.lowStockThreshold)} {item?.unit || 'units'} or below
          </Text>
        ) : null} */}

        {hasConfiguredMax ? (
          <View style={materialStyles.progressRow}>
            <View style={materialStyles.progressTrack}>
              <View
                style={[
                  materialStyles.progressFill,
                  isAlert && materialStyles.progressFillAlert,
                  { width: `${percent}%` },
                ]}
              />
            </View>
            <Text style={[materialStyles.percent, isAlert && materialStyles.percentAlert]}>
              {percent}%
            </Text>
          </View>
        ) : null}
      </View>

      <MaterialCommunityIcons name="chevron-right" size={22} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

export default function InventoryScreen({ navigation, employeeId }) {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(), []);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);

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

  const lowStockItems = useMemo(
    () => items.filter((it) => it?.isLowStock),
    [items]
  );

  const displayedItems = useMemo(() => {
    if (filter === 'lowStock') return lowStockItems;
    if (filter === 'inUse') {
      return items.filter((it) => {
        const { current, max, hasConfiguredMax } = getItemCapacity(it);
        return hasConfiguredMax && current > 0 && current < max;
      });
    }
    if (filter === 'available') {
      return items.filter((it) => {
        const { current, max, hasConfiguredMax } = getItemCapacity(it);
        return hasConfiguredMax && current >= max;
      });
    }
    // All: material list excludes low-stock rows (shown in alert section above)
    return items.filter((it) => !it?.isLowStock);
  }, [items, filter, lowStockItems]);

  const filterLabel = {
    all: 'All items',
    lowStock: 'Low stock',
    inUse: 'In use',
    available: 'Available',
  }[filter];

  const openInventoryItem = (item) => {
    const rootNav = navigation.getParent?.() || navigation;
    rootNav.navigate('MaterialDetail', {
      inventoryId: item._id,
      employeeId,
    });
  };

  const openMyRequests = () => {
    const rootNav = navigation.getParent?.() || navigation;
    rootNav.navigate('MyRequests', { employeeId });
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
        <TouchableOpacity style={styles.headerBtn} onPress={openMyRequests} activeOpacity={0.7}>
          <MaterialCommunityIcons name="clipboard-text-outline" size={24} color="#1A1A1A" />
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

        <TouchableOpacity style={styles.myRequestsBanner} onPress={openMyRequests} activeOpacity={0.85}>
          <View style={styles.myRequestsLeft}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={22} color="#2563EB" />
            <View>
              <Text style={styles.myRequestsTitle}>My Requests</Text>
              <Text style={styles.myRequestsHint}>Track pending, approved & rejected refills</Text>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color="#9CA3AF" />
        </TouchableOpacity>

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
              variant={stats.lowStock > 0 ? 'alert' : undefined}
              onPress={stats.lowStock > 0 ? () => setFilter('lowStock') : undefined}
            />
          </View>
          <View style={styles.statsRow}>
            <SummaryCard
              style={styles.statCardHalf}
              label="In Use"
              value={String(stats.inUse)}
              hint="Items"
              variant="info"
            />
            <SummaryCard
              style={styles.statCardHalf}
              label="Available"
              value={String(stats.available)}
              hint="Items"
              variant="success"
            />
          </View>
        </View>

        {filter === 'all' && lowStockItems.length > 0 ? (
          <View style={styles.lowStockSection}>
            <Text style={styles.lowStockSectionTitle}>Low Stock Items</Text>
            <View style={styles.lowStockContainer}>
              {lowStockItems.map((item, index) => (
                <View
                  key={item._id || `${item.name}-${item.category}`}
                  style={index < lowStockItems.length - 1 ? materialStyles.alertDivider : null}
                >
                  <MaterialRow
                    item={item}
                    variant="alert"
                    onPress={() => openInventoryItem(item)}
                  />
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {filter === 'lowStock' && lowStockItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No low stock items right now.</Text>
          </View>
        ) : null}

        {filter === 'lowStock' && lowStockItems.length > 0 ? (
          <View style={styles.lowStockSection}>
            <Text style={styles.lowStockSectionTitle}>Low Stock Items</Text>
            <View style={styles.lowStockContainer}>
              {lowStockItems.map((item, index) => (
                <View
                  key={item._id || `${item.name}-${item.category}`}
                  style={index < lowStockItems.length - 1 ? materialStyles.alertDivider : null}
                >
                  <MaterialRow
                    item={item}
                    variant="alert"
                    onPress={() => openInventoryItem(item)}
                  />
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {filter !== 'lowStock' ? (
          <>
            <View style={styles.listSectionHeader}>
              <Text style={styles.listSectionTitle}>Material List</Text>
              {filter !== 'all' ? (
                <Text style={styles.filterBadge}>{filterLabel}</Text>
              ) : null}
            </View>

            {displayedItems.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {items.length === 0
                    ? 'No materials found.'
                    : lowStockItems.length === items.length
                      ? 'All items are low on stock — see above.'
                      : 'No other materials to show.'}
                </Text>
              </View>
            ) : (
              displayedItems.map((item) => (
                <MaterialRow
                  key={item._id || `${item.name}-${item.category}`}
                  item={item}
                  onPress={() => openInventoryItem(item)}
                />
              ))
            )}
          </>
        ) : null}
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
  cardAlert: {
    borderColor: ALERT_ORANGE_BORDER,
    backgroundColor: ALERT_ORANGE_LIGHT,
  },
  cardInfo: {
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
  },
  cardSuccess: {
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
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
  labelAlert: {
    color: ALERT_ORANGE,
    fontWeight: '700',
  },
  valueAlert: {
    color: ALERT_ORANGE,
  },
  valueInfo: {
    color: '#2563EB',
  },
  valueSuccess: {
    color: '#16A34A',
  },
  hint: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  hintAlert: {
    color: '#9A3412',
    fontWeight: '600',
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
  rowAlert: {
    marginBottom: 0,
    borderWidth: 0,
    borderRadius: 0,
    backgroundColor: 'transparent',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  alertDivider: {
    borderBottomWidth: 1,
    borderBottomColor: ALERT_ORANGE_BORDER,
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
  thumbAlert: {
    backgroundColor: '#FFEDD5',
    borderColor: ALERT_ORANGE_BORDER,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  lowBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  lowBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
  },
  stockLine: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  thresholdHint: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9A3412',
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
  progressFillAlert: {
    backgroundColor: ALERT_ORANGE,
  },
  percent: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1A1A',
    minWidth: 36,
    textAlign: 'right',
  },
  percentAlert: {
    color: ALERT_ORANGE,
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
    myRequestsBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#EFF6FF',
      borderWidth: 1,
      borderColor: '#BFDBFE',
      borderRadius: 12,
      padding: 14,
      marginBottom: 16,
    },
    myRequestsLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    myRequestsTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: '#1E40AF',
    },
    myRequestsHint: {
      fontSize: 12,
      color: '#3B82F6',
      marginTop: 2,
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
    lowStockSection: {
      marginBottom: 20,
    },
    lowStockSectionTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: '#1A1A1A',
      marginBottom: 10,
    },
    lowStockContainer: {
      borderWidth: 1,
      borderColor: ALERT_ORANGE_BORDER,
      borderRadius: 14,
      backgroundColor: ALERT_ORANGE_LIGHT,
      paddingHorizontal: 10,
      paddingVertical: 4,
      overflow: 'hidden',
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
