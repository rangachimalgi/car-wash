import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
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
  fulfilled: { label: 'Delivered', bg: '#EFF6FF', text: '#1D4ED8', border: '#93C5FD' },
  rejected: { label: 'Rejected', bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' },
};

const THUMB_TINT = {
  Soap: '#E0F2FE',
  Towels: '#FCE7F3',
  Polish: '#FEF3C7',
  Equipment: '#E0E7FF',
  Other: '#F3F4F6',
};

function formatRequestDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getStatusMeta(status) {
  return STATUS_META[status] || STATUS_META.pending;
}

function formatQtyLine(request) {
  const unit = request.unit || request.inventoryId?.unit || 'units';
  const qty = formatAmount(request.quantity);
  const u = String(unit).toLowerCase();
  if (u === 'l' || u.includes('liter')) return `${qty} L`;
  if (u === 'ml') return `${qty} ml`;
  if (u === 'pcs' || u === 'pc' || u === 'pieces') return `${qty} pcs`;
  return `${qty} ${unit}`;
}

function filterRequestsForTab(requests, tabId) {
  if (tabId === 'all') return requests;
  if (tabId === 'pending') return requests.filter((r) => r.status === 'pending');
  if (tabId === 'approved') return requests.filter((r) => r.status === 'approved');
  if (tabId === 'rejected') return requests.filter((r) => r.status === 'rejected');
  return requests;
}

function RequestRow({ request, onPress }) {
  const item = request.inventoryId;
  const category = item?.category || 'Other';
  const iconName = getCategoryIcon(category);
  const meta = getStatusMeta(request.status);
  const rejectionNote =
    request.status === 'rejected' && request.adminNote ? request.adminNote : null;
  const awaitingReceive = request.status === 'approved';

  return (
    <TouchableOpacity style={rowStyles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={[rowStyles.thumb, { backgroundColor: THUMB_TINT[category] || THUMB_TINT.Other }]}>
        <MaterialCommunityIcons name={iconName} size={26} color="#374151" />
      </View>

      <View style={rowStyles.body}>
        <View style={rowStyles.titleRow}>
          <Text style={rowStyles.name} numberOfLines={1}>
            {request.itemName || item?.name || 'Unknown item'}
          </Text>
          <View style={[rowStyles.badge, { backgroundColor: meta.bg, borderColor: meta.border }]}>
            <Text style={[rowStyles.badgeText, { color: meta.text }]}>{meta.label}</Text>
          </View>
        </View>
        <Text style={rowStyles.qty}>{formatQtyLine(request)}</Text>
        <Text style={rowStyles.date}>Requested on {formatRequestDate(request.createdAt)}</Text>
        {awaitingReceive ? (
          <Text style={rowStyles.receiveHint}>Tap to confirm receipt</Text>
        ) : null}
        {rejectionNote ? (
          <Text style={rowStyles.reason} numberOfLines={2}>
            Reason: {rejectionNote}
          </Text>
        ) : null}
      </View>

      <MaterialCommunityIcons name="chevron-right" size={22} color="#9CA3AF" style={rowStyles.chevron} />
    </TouchableOpacity>
  );
}

function RequestList({
  tabId,
  requests,
  loading,
  refreshing,
  error,
  pageWidth,
  bottomInset,
  onRefresh,
  onRetry,
  onSelectRequest,
}) {
  const styles = useMemo(() => createStyles(), []);
  const filtered = useMemo(() => filterRequestsForTab(requests, tabId), [requests, tabId]);

  if (loading && requests.length === 0) {
    return (
      <View style={[styles.centered, { width: pageWidth }]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading requests...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.list, { width: pageWidth }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
      }
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: 24 + bottomInset + 88, flexGrow: 1 },
      ]}
    >
      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Couldn&apos;t load requests</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!error && filtered.length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="clipboard-text-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No requests yet</Text>
          <Text style={styles.emptyText}>
            {tabId === 'all'
              ? 'Refill requests you submit will appear here with their status.'
              : tabId === 'approved'
                ? 'No approved items waiting for receipt.'
                : `No ${tabId} requests right now.`}
          </Text>
        </View>
      ) : null}

      {filtered.map((req) => (
        <RequestRow key={req._id} request={req} onPress={() => onSelectRequest(req)} />
      ))}
    </ScrollView>
  );
}

export default function MyRequestsScreen({ navigation, route, employeeId: employeeIdProp }) {
  const insets = useSafeAreaInsets();
  const { width: pageWidth } = useWindowDimensions();
  const styles = useMemo(() => createStyles(), []);
  const pagerRef = useRef(null);
  const initialLoad = useRef(true);
  const tabScrollRef = useRef(null);

  const employeeId = route?.params?.employeeId ?? employeeIdProp;
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);

  const fetchRequests = useCallback(
    async ({ silent = false } = {}) => {
      if (!employeeId) {
        setError('Employee session missing.');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        if (!silent) setError('');
        const res = await getRefillRequests({ employeeId });
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
        initialLoad.current = false;
      }
    },
    [employeeId]
  );

  useEffect(() => {
    if (initialLoad.current) setLoading(true);
    fetchRequests({ silent: !initialLoad.current });
  }, [fetchRequests]);

  useFocusEffect(
    useCallback(() => {
      if (!initialLoad.current) fetchRequests({ silent: true });
    }, [fetchRequests])
  );

  const goToTabIndex = useCallback(
    (index, { animated = true } = {}) => {
      const safeIndex = Math.max(0, Math.min(index, TABS.length - 1));
      setActiveTabIndex(safeIndex);
      pagerRef.current?.scrollToIndex({ index: safeIndex, animated });
      tabScrollRef.current?.scrollTo({
        x: Math.max(0, safeIndex * 72 - pageWidth / 2 + 36),
        animated,
      });
    },
    [pageWidth]
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRequests({ silent: true });
  }, [fetchRequests]);

  const onPagerScrollEnd = useCallback(
    (event) => {
      const index = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
      if (index !== activeTabIndex && index >= 0 && index < TABS.length) {
        setActiveTabIndex(index);
        tabScrollRef.current?.scrollTo({
          x: Math.max(0, index * 72 - pageWidth / 2 + 36),
          animated: true,
        });
      }
    },
    [activeTabIndex, pageWidth]
  );

  const closeDetail = () => setSelectedRequest(null);
  const detailMeta = selectedRequest ? getStatusMeta(selectedRequest.status) : null;

  const handleSelectRequest = useCallback(
    (req) => {
      if (req.status === 'approved') {
        navigation.navigate('ReceiveItems', {
          requestId: req._id,
          employeeId,
        });
        return;
      }
      setSelectedRequest(req);
    },
    [navigation, employeeId]
  );

  const renderPagerPage = useCallback(
    ({ item: tab }) => (
      <RequestList
        tabId={tab.id}
        requests={requests}
        loading={loading}
        refreshing={refreshing}
        error={error}
        pageWidth={pageWidth}
        bottomInset={insets.bottom}
        onRefresh={onRefresh}
        onRetry={fetchRequests}
        onSelectRequest={handleSelectRequest}
      />
    ),
    [requests, loading, refreshing, error, pageWidth, insets.bottom, onRefresh, fetchRequests, handleSelectRequest]
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: 12 + insets.top }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Requests</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        ref={tabScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabsScrollContent}
      >
        {TABS.map((tab, index) => {
          const active = activeTabIndex === index;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabBtn}
              onPress={() => goToTabIndex(index)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
              {active ? <View style={styles.tabIndicator} /> : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={styles.tabsBorder} />


      <FlatList
        ref={pagerRef}
        data={TABS}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={renderPagerPage}
        onMomentumScrollEnd={onPagerScrollEnd}
        getItemLayout={(_, index) => ({
          length: pageWidth,
          offset: pageWidth * index,
          index,
        })}
        initialNumToRender={1}
        maxToRenderPerBatch={1}
        windowSize={3}
        style={styles.pager}
      />

      <Modal visible={!!selectedRequest} animationType="slide" transparent onRequestClose={closeDetail}>
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={styles.modalDismiss} activeOpacity={1} onPress={closeDetail} />
          <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            {selectedRequest ? (
              <>
                <View style={styles.modalHandle} />
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
                    { backgroundColor: detailMeta.bg, borderColor: detailMeta.border },
                  ]}
                >
                  <Text style={[styles.modalBadgeText, { color: detailMeta.text }]}>
                    {detailMeta.label}
                  </Text>
                </View>

                <View style={styles.detailBlock}>
                  <Text style={styles.detailLabel}>Quantity</Text>
                  <Text style={styles.detailValue}>{formatQtyLine(selectedRequest)}</Text>
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
                {selectedRequest.receivedAt ? (
                  <View style={styles.detailBlock}>
                    <Text style={styles.detailLabel}>Received</Text>
                    <Text style={styles.detailValue}>
                      {formatRequestDate(selectedRequest.receivedAt)}
                    </Text>
                  </View>
                ) : null}
                {selectedRequest.receivedQuantity != null ? (
                  <View style={styles.detailBlock}>
                    <Text style={styles.detailLabel}>Received qty</Text>
                    <Text style={styles.detailValue}>
                      {formatQtyLine({ ...selectedRequest, quantity: selectedRequest.receivedQuantity })}
                    </Text>
                  </View>
                ) : null}
                {selectedRequest.receivedCondition ? (
                  <View style={styles.detailBlock}>
                    <Text style={styles.detailLabel}>Condition</Text>
                    <Text style={styles.detailValue}>{selectedRequest.receivedCondition}</Text>
                  </View>
                ) : null}
                {selectedRequest.receiveNotes ? (
                  <View style={styles.detailBlock}>
                    <Text style={styles.detailLabel}>Receive notes</Text>
                    <Text style={styles.detailValue}>{selectedRequest.receiveNotes}</Text>
                  </View>
                ) : null}
                {selectedRequest.reviewedAt ? (
                  <View style={styles.detailBlock}>
                    <Text style={styles.detailLabel}>
                      {selectedRequest.status === 'fulfilled' ? 'Delivered' : 'Reviewed'}
                    </Text>
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
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
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
  receiveHint: {
    marginTop: 6,
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '600',
  },
  chevron: {
    marginLeft: -4,
  },
});

const createStyles = () =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: '#F3F4F6' },
    loadingText: { fontSize: 14, color: '#6B7280' },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 12,
      backgroundColor: '#FFFFFF',
    },
    headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    tabsScroll: {
      backgroundColor: '#FFFFFF',
      flexGrow: 0,
    },
    tabsScrollContent: {
      flexDirection: 'row',
      paddingHorizontal: 8,
    },
    tabsBorder: {
      height: 1,
      backgroundColor: '#E5E7EB',
    },
    tabBtn: {
      minWidth: 88,
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 12,
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
      left: '18%',
      right: '18%',
      height: 2,
      backgroundColor: '#2563EB',
      borderRadius: 1,
    },
    swipeHint: {
      fontSize: 11,
      color: '#9CA3AF',
      textAlign: 'center',
      paddingVertical: 6,
      backgroundColor: '#F3F4F6',
    },
    pager: {
      flex: 1,
      backgroundColor: '#F3F4F6',
    },
    list: {
      flex: 1,
      backgroundColor: '#F3F4F6',
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 8,
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
      backgroundColor: '#2563EB',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
    },
    retryBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
    empty: {
      alignItems: 'center',
      paddingVertical: 56,
      paddingHorizontal: 24,
    },
    emptyTitle: {
      marginTop: 16,
      fontSize: 17,
      fontWeight: '700',
      color: '#111827',
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
    modalDismiss: {
      flex: 1,
    },
    modalSheet: {
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 20,
      paddingTop: 8,
    },
    modalHandle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#E5E7EB',
      marginBottom: 16,
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
      color: '#111827',
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
    detailValue: { fontSize: 15, color: '#111827', lineHeight: 22 },
  });
