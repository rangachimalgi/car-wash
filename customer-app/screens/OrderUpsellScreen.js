import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackHeader from '../components/BackHeader';
import { getOrderById, addUpsellAddOnsToOrder } from '../services/orderApi';
import api from '../config/api';
import { useTheme } from '../theme/ThemeContext';
import { normalizeOrderStatus } from '../utils/orderStatus';

function filterAddOnsForVehicle(addOns, vehicleCategory) {
  if (!vehicleCategory || !Array.isArray(addOns)) return addOns || [];
  return addOns.filter((a) => {
    const af = a.applicableFor;
    if (!af || !Array.isArray(af) || af.length === 0) return true;
    return af.includes(vehicleCategory);
  });
}

export default function OrderUpsellScreen({ navigation, route }) {
  const orderId = route?.params?.orderId;
  /** Only Bookings → Upcoming Wash → Book sets this; API also requires entrySource. */
  const fromUpcoming = route?.params?.fromUpcomingBookings === true;
  const insets = useSafeAreaInsets();
  const { theme, isLightMode } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [loading, setLoading] = useState(fromUpcoming);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState(null);
  const [addOns, setAddOns] = useState([]);
  const [selected, setSelected] = useState(() => new Set());

  const existingAddOnIds = useMemo(() => {
    const ids = order?.items?.[0]?.addOns || [];
    return new Set(ids.map((x) => String(x._id || x)));
  }, [order]);

  const load = useCallback(async () => {
    if (!orderId || !fromUpcoming) return;
    setLoading(true);
    try {
      const res = await getOrderById(orderId);
      if (!res.success || !res.data) {
        setOrder(null);
        return;
      }
      setOrder(res.data);
      const vc =
        res.data?.items?.[0]?.service?.category === 'BikeWash' ? 'BikeWash' : 'CarWash';
      const svcRes = await api.get('/services?category=AddOn&isActive=true');
      const raw = svcRes.data?.data ?? svcRes.data;
      const list = Array.isArray(raw) ? raw : [];
      setAddOns(filterAddOnsForVehicle(list, vc));
    } catch (e) {
      console.error(e);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderId, fromUpcoming]);

  useEffect(() => {
    if (!fromUpcoming) {
      setLoading(false);
      return;
    }
    if (!orderId) {
      setLoading(false);
      return;
    }
    load();
  }, [load, fromUpcoming, orderId]);

  const toggle = (id) => {
    const sid = String(id);
    if (existingAddOnIds.has(sid)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(sid)) next.delete(sid);
      else next.add(sid);
      return next;
    });
  };

  const selectedTotal = useMemo(() => {
    let sum = 0;
    selected.forEach((id) => {
      const a = addOns.find((x) => String(x._id) === id);
      if (a) sum += Number(a.basePrice || 0);
    });
    return sum;
  }, [selected, addOns]);

  const handleConfirm = async () => {
    if (selected.size === 0) {
      Alert.alert('Select add-ons', 'Choose at least one new add-on to add.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await addUpsellAddOnsToOrder(orderId, [...selected]);
      if (res.success) {
        Alert.alert(
          'Added',
          'Add-ons were added to your booking. Any balance due will show on your booking total.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Could not add', res.message || 'Try again.');
      }
    } catch (e) {
      const msg = e.response?.data?.message || e.message || 'Try again.';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const orderStatus = order ? normalizeOrderStatus(order.status) : '';
  const allowedStatuses = ['Paid', 'Scheduled', 'In Progress'];
  const hasAssignee = order && String(order.assignedEmployeeId || '').trim();
  const statusOk = order && allowedStatuses.includes(orderStatus);
  const isPending = orderStatus === 'Pending';
  const isCompleted = orderStatus === 'Completed';
  const isCancelled = orderStatus === 'Cancelled';

  const payServiceName =
    order?.items?.[0]?.serviceName || order?.items?.[0]?.service?.name || 'Service';
  const payAmountStr =
    order?.totalAmount != null ? `₹${Number(order.totalAmount).toFixed(2)}` : '';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style={isLightMode ? 'dark' : 'light'} />
      <BackHeader navigation={navigation} title="Add services" />

      {!fromUpcoming ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 32 + insets.bottom }]}
        >
          <Text style={styles.hint}>
            Add extras only from Bookings: open <Text style={styles.hintStrong}>Upcoming Wash</Text>, then tap{' '}
            <Text style={styles.hintStrong}>Book</Text> on that wash. That keeps add-ons on active bookings only.
          </Text>
          <TouchableOpacity
            style={styles.cta}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Bookings' })}
          >
            <Text style={styles.ctaText}>Go to Bookings</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.accent} />
        </View>
      ) : !order ? (
        <Text style={styles.errorText}>Booking not found.</Text>
      ) : isCompleted || isCancelled ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 32 + insets.bottom }]}
        >
          <Text style={styles.hint}>
            {isCancelled
              ? 'This booking was cancelled. Nothing else can be added to it.'
              : 'This wash is already marked complete in the app. Add-ons can only be added before that — not after.'}
          </Text>
          {!isCancelled ? (
            <Text style={styles.muted}>
              Next time: Bookings → Upcoming Wash → tap Book → choose add-ons → Confirm add-ons. Do that after you pay
              and before the specialist finishes the job. That flow talks to our servers and updates your order.
            </Text>
          ) : null}
          <TouchableOpacity
            style={[styles.cta, styles.ctaSecondary]}
            onPress={() => navigation.navigate('MainTabs')}
          >
            <Text style={[styles.ctaText, styles.ctaSecondaryText]}>Back to Home</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : isPending ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 32 + insets.bottom }]}
        >
          <Text style={styles.hint}>
            Pay for this booking first. After payment, open Bookings again, tap Book on this wash, then you’ll get the
            add-on list and Confirm will save to your order.
          </Text>
          <TouchableOpacity
            style={styles.cta}
            onPress={() =>
              navigation.navigate('PaymentMethods', {
                orderId,
                amount: payAmountStr,
                serviceName: payServiceName,
              })
            }
          >
            <Text style={styles.ctaText}>Pay now</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : !statusOk ? (
        <Text style={styles.errorText}>Add-ons cannot be added for this booking status.</Text>
      ) : !hasAssignee ? (
        <Text style={styles.errorText}>A specialist is not assigned yet. Try again shortly.</Text>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 32 + insets.bottom }]}
        >
          <Text style={styles.hint}>
            You’re in the right place. Pick add-ons below, then Confirm add-ons — we send them to the server and update
            this booking. (Your specialist gets upsell credit for these.)
          </Text>
          {addOns.length === 0 ? (
            <Text style={styles.muted}>No add-ons available.</Text>
          ) : (
            addOns.map((a) => {
              const id = String(a._id);
              const already = existingAddOnIds.has(id);
              const isSel = selected.has(id);
              return (
                <TouchableOpacity
                  key={id}
                  style={[styles.row, already && styles.rowDisabled, isSel && styles.rowSelected]}
                  onPress={() => toggle(a._id)}
                  disabled={already}
                  activeOpacity={0.85}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{a.name}</Text>
                    {already ? (
                      <Text style={styles.badge}>Already on booking</Text>
                    ) : null}
                  </View>
                  <Text style={styles.price}>₹{Number(a.basePrice || 0)}</Text>
                </TouchableOpacity>
              );
            })
          )}

          <View style={styles.footer}>
            <Text style={styles.totalLabel}>New add-ons total (pre-tax)</Text>
            <Text style={styles.total}>₹{selectedTotal}</Text>
            <TouchableOpacity
              style={[styles.cta, (submitting || selected.size === 0) && styles.ctaDisabled]}
              onPress={handleConfirm}
              disabled={submitting || selected.size === 0}
            >
              <Text style={styles.ctaText}>{submitting ? 'Adding…' : 'Confirm add-ons'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 20 },
    centered: { padding: 40, alignItems: 'center' },
    hint: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 16,
      lineHeight: 20,
    },
    hintStrong: { fontWeight: '800', color: theme.textPrimary },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      backgroundColor: theme.cardBackground,
      marginBottom: 10,
    },
    rowSelected: {
      borderColor: theme.accent,
      backgroundColor: theme.accentSoft,
    },
    rowDisabled: { opacity: 0.55 },
    rowTitle: { fontSize: 15, fontWeight: '600', color: theme.textPrimary },
    badge: { fontSize: 11, color: theme.accent, marginTop: 4, fontWeight: '600' },
    price: { fontSize: 16, fontWeight: '700', color: theme.textPrimary },
    footer: { marginTop: 20 },
    totalLabel: { fontSize: 12, color: theme.textSecondary },
    total: { fontSize: 22, fontWeight: '800', color: theme.textPrimary, marginBottom: 12 },
    cta: {
      backgroundColor: '#111111',
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    ctaDisabled: { opacity: 0.5 },
    ctaSecondary: {
      backgroundColor: '#EEF2FF',
      marginTop: 16,
    },
    ctaSecondaryText: {
      color: '#2F5CF4',
    },
    ctaText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
    errorText: { padding: 20, color: '#B91C1C', fontSize: 15 },
    muted: { color: theme.textSecondary, fontSize: 14 },
  });
