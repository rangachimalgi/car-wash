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
import { getRefillRequests } from '../services/inventoryApi.js';
import { formatAmount, getCategoryIcon } from '../utils/inventoryDisplay.js';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
];

const STATUS_META = {
  pending: { label: 'Pending', bg: '#FFF7ED', text: '#C2410C', border: '#FDBA74' },
  approved: { label: 'Approved', bg: '#ECFDF5', text: '#047857', border: '#6EE7B7' },
  fulfilled: { label: 'Approved', bg: '#ECFDF5', text: '#047857', border: '#6EE7B7' },
  rejected: { label: 'Rejected', bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' },
};

function formatRequestDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getStatusMeta(status) {
  return STATUS_META[status] || STATUS_META.pending;
}

function RequestRow({ request, onPress }) {
  const item = request.inventoryId;
  const category = item?.category || 'Other';
  const iconName = getCategoryIcon(category);
  const meta = getStatusMeta(request.status);
  const unit = request.unit || item?.unit || 'units';
  const rejectionNote =
    request.status === 'rejected' && request.adminNote ? request.adminNote : null;

  return (
    <TouchableOpacity style={rowStyles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={rowStyles.thumb}>
        <MaterialCommunityIcons name={iconName} size={28} color="#1A1A1A" />
      </View>

      <View style={rowStyles.body}>
        <View style={rowStyles.topRow}>
          <Text style={rowStyles.name} numberOfLines={1}>
            {request.itemName || item?.name || 'Unknown item'}
          </Text>
          <View style={[rowStyles.badge, { backgroundColor: meta.bg, borderColor: meta.border }]}>
            <Text style={[rowStyles.badgeText, { color: meta.text }]}>{meta.label}</Text>
          </View>
        </View>
        <Text style={rowStyles.qty}>
          {formatAmount(request.quantity)} {unit}
        </Text>
        <Text style={rowStyles.date}>
          Requested on {formatRequestDate(request.createdAt)}
        </Text>
        {rejectionNote ? (
          <Text style={rowStyles.reason} numberOfLines={2}>
            Reason: {rejectionNote}
          </Text>
        ) : null}
      </View>

      <MaterialCommunityIcons name="chevron-right" size={22} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

export default function MyRequestsScreen({ navigation, route, employeeId: employeeIdProp }) {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(), []);

  const employeeId = route?.params?.employeeId ?? employeeIdProp;
  const [activeTab, setActiveTab] = useState('all');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);

  const fetchRequests = useCallback(async () => {
    if (!employeeId) {
      setError('Employee session missing.');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setError('');
      const params = { employeeId };
      if (activeTab !== 'all') params.status = activeTab;

      const res = await getRefillRequests(params);
      if (res?.success) {
        setRequests(res.data || []);
      } else {
        setRequests([]);
        setError(res?.message || 'Failed to load requests');
      }
    } catch (e) {
      setRequests([]);
      setError(e?.message || 'Failed to load requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [employeeId, activeTab]);

  useEffect(() => {
    setLoading(true);
    fetchRequests();
  }, [fetchRequests]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRequests();
  }, [fetchRequests]);

  const closeDetail = () => setSelectedRequest(null);

  const detailMeta = selectedRequest ? getStatusMeta(selectedRequest.status) : null;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: 12 + insets.top }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Requests</Text>
        <View style={styles.headerBtn} />
      </View>

      <View style={styles.tabs}>
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabBtn}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
              {active ? <View style={styles.tabIndicator} /> : null}
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1A1A1A" />
          <Text style={styles.loadingText}>Loading requests...</Text>
        </View>
      ) : (
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
              <Text style={styles.errorTitle}>Couldn&apos;t load requests</Text>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={fetchRequests}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {!error && requests.length === 0 ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No requests yet</Text>
              <Text style={styles.emptyText}>
                {activeTab === 'all'
                  ? 'Refill requests you submit will appear here.'
                  : `No ${activeTab} requests right now.`}
              </Text>
            </View>
          ) : null}

          {requests.map((req) => (
            <RequestRow
              key={req._id}
              request={req}
              onPress={() => setSelectedRequest(req)}
            />
          ))}
        </ScrollView>
      )}

      <Modal visible={!!selectedRequest} animationType="slide" transparent onRequestClose={closeDetail}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            {selectedRequest ? (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {selectedRequest.itemName || selectedRequest.inventoryId?.name || 'Request'}
                  </Text>
                  <TouchableOpacity onPress={closeDetail} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <View
                  style={[
                    styles.modalBadge,
                    {
                      backgroundColor: detailMeta.bg,
                      borderColor: detailMeta.border,
                    },
                  ]}
                >
                  <Text style={[styles.modalBadgeText, { color: detailMeta.text }]}>
                    {detailMeta.label}
                  </Text>
                </View>

                <View style={styles.detailBlock}>
                  <Text style={styles.detailLabel}>Quantity</Text>
                  <Text style={styles.detailValue}>
                    {formatAmount(selectedRequest.quantity)}{' '}
                    {selectedRequest.unit || selectedRequest.inventoryId?.unit || 'units'}
                  </Text>
                </View>
                <View style={styles.detailBlock}>
                  <Text style={styles.detailLabel}>Reason</Text>
                  <Text style={styles.detailValue}>{selectedRequest.reason || '—'}</Text>
                </View>
                {selectedRequest.notes ? (
                  <View style={styles.detailBlock}>
                    <Text style={styles.detailLabel}>Your notes</Text>
                    <Text style={styles.detailValue}>{selectedRequest.notes}</Text>
                  </View>
                ) : null}
                <View style={styles.detailBlock}>
                  <Text style={styles.detailLabel}>Requested</Text>
                  <Text style={styles.detailValue}>
                    {formatRequestDate(selectedRequest.createdAt)}
                  </Text>
                </View>
                {selectedRequest.reviewedAt ? (
                  <View style={styles.detailBlock}>
                    <Text style={styles.detailLabel}>Reviewed</Text>
                    <Text style={styles.detailValue}>
                      {formatRequestDate(selectedRequest.reviewedAt)}
                    </Text>
                  </View>
                ) : null}
                {selectedRequest.adminNote ? (
                  <View style={styles.detailBlock}>
                    <Text style={styles.detailLabel}>
                      {selectedRequest.status === 'rejected' ? 'Rejection reason' : 'Admin note'}
                    </Text>
                    <Text style={styles.detailValue}>{selectedRequest.adminNote}</Text>
                  </View>
                ) : null}
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    gap: 12,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  qty: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 2,
  },
  date: {
    fontSize: 13,
    color: '#6B7280',
  },
  reason: {
    marginTop: 6,
    fontSize: 13,
    color: '#B91C1C',
    fontWeight: '500',
  },
});

const createStyles = () =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
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
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
    tabs: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
      paddingHorizontal: 8,
    },
    tabBtn: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 14,
      position: 'relative',
    },
    tabLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: '#6B7280',
    },
    tabLabelActive: {
      color: '#2563EB',
      fontWeight: '700',
    },
    tabIndicator: {
      position: 'absolute',
      bottom: 0,
      left: '15%',
      right: '15%',
      height: 2,
      backgroundColor: '#2563EB',
      borderRadius: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    errorCard: {
      backgroundColor: '#FEF2F2',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: '#FECACA',
    },
    errorTitle: { fontSize: 15, fontWeight: '700', color: '#991B1B', marginBottom: 4 },
    errorText: { fontSize: 14, color: '#B91C1C', marginBottom: 12 },
    retryBtn: {
      alignSelf: 'flex-start',
      backgroundColor: '#1A1A1A',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
    },
    retryBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
    empty: {
      alignItems: 'center',
      paddingVertical: 48,
      paddingHorizontal: 24,
    },
    emptyTitle: {
      marginTop: 16,
      fontSize: 17,
      fontWeight: '700',
      color: '#1A1A1A',
    },
    emptyText: {
      marginTop: 8,
      fontSize: 14,
      color: '#6B7280',
      textAlign: 'center',
      lineHeight: 20,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    modalTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: '700',
      color: '#1A1A1A',
      marginRight: 12,
    },
    modalBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      borderWidth: 1,
      marginBottom: 16,
    },
    modalBadgeText: { fontSize: 12, fontWeight: '700' },
    detailBlock: { marginBottom: 14 },
    detailLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: '#6B7280',
      marginBottom: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    detailValue: { fontSize: 15, color: '#1A1A1A', lineHeight: 22 },
  });
