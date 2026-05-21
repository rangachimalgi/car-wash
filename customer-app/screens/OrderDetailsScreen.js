import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import MinimalBackHeader from '../components/MinimalBackHeader';
import { getOrderById } from '../services/orderApi';
import { useTheme } from '../theme/ThemeContext';
import {
  buildBillRows,
  getDisplayOrderId,
  formatOrderPlacedAt,
  getOrderAddOnNames,
  getPaymentLabel,
} from '../utils/orderDetails';
import { openSupportWhatsApp } from '../utils/supportWhatsApp';

function BillRow({ row, styles }) {
  const valueStyle = [
    styles.billValue,
    row.discount && styles.billValueDiscount,
    row.charge && styles.billValueCharge,
    row.bold && styles.billValueBold,
  ];
  return (
    <View style={styles.billRow}>
      <Text style={[styles.billLabel, row.bold && styles.billLabelBold]}>{row.label}</Text>
      <Text style={valueStyle}>{row.display}</Text>
    </View>
  );
}

function DetailField({ label, value, onCopy, styles, theme }) {
  return (
    <View style={styles.detailField}>
      <Text style={styles.detailLabel}>{label}</Text>
      <View style={styles.detailValueRow}>
        <Text style={styles.detailValue}>{value}</Text>
        {onCopy ? (
          <TouchableOpacity onPress={onCopy} hitSlop={10} style={styles.copyBtn}>
            <MaterialCommunityIcons name="content-copy" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

export default function OrderDetailsScreen({ navigation, route }) {
  const orderId = route?.params?.orderId;
  const insets = useSafeAreaInsets();
  const { theme, isLightMode } = useTheme();
  const styles = useMemo(() => createStyles(theme, isLightMode), [theme, isLightMode]);
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);

  const loadOrder = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const res = await getOrderById(orderId);
      if (res.success && res.data) {
        setOrder(res.data);
      } else {
        setOrder(null);
      }
    } catch (e) {
      console.error(e);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useFocusEffect(
    useCallback(() => {
      loadOrder();
    }, [loadOrder])
  );

  const item = order?.items?.[0];
  const serviceName = item?.serviceName || item?.service?.name || 'Order details';
  const displayOrderId = getDisplayOrderId(order);
  const placedAt = formatOrderPlacedAt(order?.createdAt);
  const address = order?.customer?.address?.trim() || 'Address not available';
  const paymentLabel = order ? getPaymentLabel(order) : '';
  const { rows, billTotal } = order ? buildBillRows(order) : { rows: [], billTotal: '₹0' };
  const addOnNames = order ? getOrderAddOnNames(order) : [];

  const copyOrderId = async () => {
    if (!displayOrderId) return;
    await Clipboard.setStringAsync(displayOrderId);
    Alert.alert('Copied', 'Order ID copied to clipboard');
  };

  const handleOrderHelp = () => {
    const lines = [
      'Hi Woosh team, I need help with my order.',
      displayOrderId ? `Order ID: ${displayOrderId}` : '',
      serviceName ? `Service: ${serviceName}` : '',
    ].filter(Boolean);
    openSupportWhatsApp(lines.join('\n'));
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <StatusBar style={isLightMode ? 'dark' : 'light'} />
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.container}>
        <StatusBar style={isLightMode ? 'dark' : 'light'} />
        <MinimalBackHeader navigation={navigation} title="Order details" />
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Order not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style={isLightMode ? 'dark' : 'light'} />
      <MinimalBackHeader navigation={navigation} title="Order details" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 24 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Bill details</Text>
          <View style={styles.sectionDivider} />
          {rows.map((row) => (
            <BillRow key={row.key} row={row} styles={styles} />
          ))}
          {addOnNames.length > 0 ? (
            <View style={styles.addOnsBlock}>
              <Text style={styles.addOnsHeading}>Add-ons</Text>
              {addOnNames.map((name, index) => (
                <Text key={`${name}-${index}`} style={styles.addOnName}>
                  {name}
                </Text>
              ))}
            </View>
          ) : null}
          <View style={styles.billTotalRow}>
            <Text style={styles.billTotalLabel}>Bill total</Text>
            <Text style={styles.billTotalValue}>{billTotal}</Text>
          </View>
        </View>

        <View style={styles.sectionGap} />

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Order details</Text>
          <View style={styles.sectionDivider} />
          <DetailField
            label="Order id"
            value={displayOrderId}
            onCopy={copyOrderId}
            styles={styles}
            theme={theme}
          />
          <DetailField label="Payment" value={paymentLabel} styles={styles} theme={theme} />
          <DetailField label="Deliver to" value={address} styles={styles} theme={theme} />
          <DetailField label="Order placed" value={placedAt} styles={styles} theme={theme} />
        </View>

        <View style={styles.sectionGap} />

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Need help with your order?</Text>
          <View style={styles.sectionDivider} />
          <TouchableOpacity style={styles.helpRow} activeOpacity={0.8} onPress={handleOrderHelp}>
            <View style={styles.helpIconWrap}>
              <MaterialCommunityIcons name="message-text-outline" size={22} color={theme.textSecondary} />
            </View>
            <View style={styles.helpTextCol}>
              <Text style={styles.helpTitle}>Chat with us</Text>
              <Text style={styles.helpSubtitle}>About any issues related to your order</Text>
            </View>
            <View style={styles.helpChevronWrap}>
              <MaterialCommunityIcons name="chevron-right" size={22} color={theme.textPrimary} />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (theme, isLightMode) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isLightMode ? '#F5F6F8' : theme.background,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: theme.textSecondary,
    },
    scroll: {
      flex: 1,
    },
    sectionCard: {
      backgroundColor: theme.cardBackground,
      paddingHorizontal: 16,
      paddingTop: 18,
      paddingBottom: 16,
    },
    sectionGap: {
      height: 10,
      backgroundColor: isLightMode ? '#EBEEF2' : theme.divider,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: theme.textPrimary,
      marginBottom: 12,
    },
    sectionDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.cardBorder,
      marginBottom: 14,
    },
    billRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    billLabel: {
      fontSize: 14,
      color: theme.textPrimary,
    },
    billLabelBold: {
      fontWeight: '700',
    },
    billValue: {
      fontSize: 14,
      color: theme.textPrimary,
      fontWeight: '500',
    },
    billValueBold: {
      fontWeight: '700',
    },
    billValueDiscount: {
      color: '#2B78E4',
      fontWeight: '600',
    },
    billValueCharge: {
      fontWeight: '500',
    },
    billTotalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 4,
      paddingTop: 14,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.cardBorder,
    },
    billTotalLabel: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.textPrimary,
    },
    billTotalValue: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.textPrimary,
    },
    addOnsBlock: {
      marginBottom: 12,
      paddingTop: 4,
    },
    addOnsHeading: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textSecondary,
      marginBottom: 6,
    },
    addOnName: {
      fontSize: 14,
      color: theme.textPrimary,
      lineHeight: 22,
      marginBottom: 2,
    },
    detailField: {
      marginBottom: 18,
    },
    detailLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      marginBottom: 6,
    },
    detailValueRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
    },
    detailValue: {
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
      color: theme.textPrimary,
      lineHeight: 22,
    },
    copyBtn: {
      paddingTop: 2,
    },
    helpRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    helpIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: isLightMode ? '#F0F2F5' : theme.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    helpTextCol: {
      flex: 1,
    },
    helpTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.textPrimary,
      marginBottom: 4,
    },
    helpSubtitle: {
      fontSize: 13,
      color: theme.textSecondary,
      lineHeight: 18,
    },
    helpChevronWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      backgroundColor: theme.cardBackground,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
