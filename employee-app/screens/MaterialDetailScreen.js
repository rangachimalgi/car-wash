import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getInventoryById } from '../services/inventoryApi.js';
import {
  formatAmount,
  getCategoryIcon,
  getItemCapacity,
  getStockLabel,
} from '../utils/inventoryDisplay.js';

const ALERT_ORANGE = '#EA580C';

function ActionCard({ icon, title, subtitle, onPress, highlight }) {
  return (
    <TouchableOpacity
      style={[actionStyles.card, highlight && actionStyles.cardHighlight]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[actionStyles.iconWrap, highlight && actionStyles.iconWrapHighlight]}>
        <MaterialCommunityIcons
          name={icon}
          size={26}
          color={highlight ? ALERT_ORANGE : '#1A1A1A'}
        />
      </View>
      <View style={actionStyles.body}>
        <Text style={actionStyles.title}>{title}</Text>
        <Text style={actionStyles.subtitle}>{subtitle}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

export default function MaterialDetailScreen({ navigation, route, employeeId: employeeIdProp }) {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(), []);

  const employeeId = route?.params?.employeeId ?? employeeIdProp;
  const inventoryId = route?.params?.inventoryId;

  const [loading, setLoading] = useState(true);
  const [material, setMaterial] = useState(null);

  const loadMaterial = useCallback(async () => {
    if (!inventoryId) return;
    setLoading(true);
    try {
      const res = await getInventoryById(inventoryId);
      if (res?.success && res.data) {
        setMaterial(res.data);
      }
    } finally {
      setLoading(false);
    }
  }, [inventoryId]);

  useEffect(() => {
    loadMaterial();
  }, [loadMaterial]);

  const goUsage = () => {
    navigation.navigate('MaterialUsage', { inventoryId, employeeId });
  };

  const goRefill = () => {
    navigation.navigate('RequestRefill', { inventoryId, employeeId });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#1A1A1A" />
      </View>
    );
  }

  if (!material) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.emptyText}>Item not found.</Text>
      </View>
    );
  }

  const iconName = getCategoryIcon(material.category);
  const { percent, hasConfiguredMax } = getItemCapacity(material);
  const isLow = Boolean(material.isLowStock);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: 12 + insets.top }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Material</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 24 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.itemCard, isLow && styles.itemCardLow]}>
          <View style={[styles.itemIcon, isLow && styles.itemIconLow]}>
            <MaterialCommunityIcons name={iconName} size={36} color={isLow ? ALERT_ORANGE : '#1A1A1A'} />
          </View>
          <View style={styles.itemBody}>
            <View style={styles.nameRow}>
              <Text style={styles.itemName}>{material.name}</Text>
              {isLow ? (
                <View style={styles.lowBadge}>
                  <Text style={styles.lowBadgeText}>Low Stock</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.itemStock}>{getStockLabel(material)}</Text>
            {material.lowStockThreshold != null ? (
              <Text style={styles.thresholdLine}>
                Alert when at or below {formatAmount(material.lowStockThreshold)}{' '}
                {material.unit || 'units'}
              </Text>
            ) : null}
            {hasConfiguredMax ? (
              <View style={styles.progressRow}>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      isLow && styles.progressFillLow,
                      { width: `${percent}%` },
                    ]}
                  />
                </View>
                <Text style={[styles.percent, isLow && styles.percentLow]}>{percent}%</Text>
              </View>
            ) : null}
          </View>
        </View>

        <Text style={styles.sectionTitle}>What do you want to do?</Text>

        <ActionCard
          icon="clipboard-list-outline"
          title="Update usage"
          subtitle="Log how much you used on a job (reduces stock)"
          onPress={goUsage}
        />

        <ActionCard
          icon="package-variant-closed"
          title="Request refill"
          subtitle={
            isLow
              ? 'Ask admin to send more — stock is low'
              : 'Ask admin to restock this item'
          }
          onPress={goRefill}
          highlight={isLow}
        />
      </ScrollView>
    </View>
  );
}

const actionStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  cardHighlight: {
    borderColor: '#FDBA74',
    backgroundColor: '#FFF7ED',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapHighlight: {
    backgroundColor: '#FFEDD5',
  },
  body: { flex: 1 },
  title: { fontSize: 16, fontWeight: '800', color: '#1A1A1A', marginBottom: 4 },
  subtitle: { fontSize: 13, fontWeight: '600', color: '#6B7280', lineHeight: 18 },
});

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
      padding: 16,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      backgroundColor: '#F9FAFB',
      marginBottom: 24,
    },
    itemCardLow: {
      borderColor: '#FDBA74',
      backgroundColor: '#FFF7ED',
    },
    itemIcon: {
      width: 64,
      height: 64,
      borderRadius: 14,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E5E7EB',
      alignItems: 'center',
      justifyContent: 'center',
    },
    itemIconLow: {
      borderColor: '#FDBA74',
      backgroundColor: '#FFEDD5',
    },
    itemBody: { flex: 1 },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    itemName: { flex: 1, fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
    lowBadge: {
      backgroundColor: '#FEE2E2',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    lowBadgeText: { fontSize: 10, fontWeight: '800', color: '#DC2626' },
    itemStock: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 4 },
    thresholdLine: { fontSize: 12, fontWeight: '600', color: '#9A3412', marginBottom: 10 },
    progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    progressTrack: {
      flex: 1,
      height: 6,
      borderRadius: 999,
      backgroundColor: '#E5E7EB',
      overflow: 'hidden',
    },
    progressFill: { height: '100%', backgroundColor: '#1A1A1A', borderRadius: 999 },
    progressFillLow: { backgroundColor: ALERT_ORANGE },
    percent: { fontSize: 12, fontWeight: '700', color: '#1A1A1A' },
    percentLow: { color: ALERT_ORANGE },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: '#1A1A1A',
      marginBottom: 12,
    },
    emptyText: { fontSize: 14, color: '#6B7280' },
  });
