import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BackHeader from '../components/BackHeader';
import { useTheme } from '../theme/ThemeContext';

function PaymentOption({ title, subtitle, icon, onPress, styles }) {
  return (
    <TouchableOpacity style={styles.optionRow} activeOpacity={0.85} onPress={onPress}>
      <View style={styles.optionLeft}>
        <View style={styles.optionIconWrap}>
          <MaterialCommunityIcons name={icon} size={22} color="#111111" />
        </View>
        <View style={styles.optionTextWrap}>
          <Text style={styles.optionTitle}>{title}</Text>
          <Text style={styles.optionSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color="#A1A1AA" />
    </TouchableOpacity>
  );
}

function PaymentSection({ title, children, styles }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionDivider} />
      {children}
    </View>
  );
}

export default function PaymentMethodsScreen({ navigation, route }) {
  const { theme, isLightMode } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const amount = route?.params?.amount || '';
  const serviceName = route?.params?.serviceName || 'Service';

  const onPaymentMethodPress = (method) => {
    Alert.alert('Coming soon', `${method} payment will be enabled soon for ${serviceName}.`);
  };

  return (
    <View style={styles.container}>
      <StatusBar style={isLightMode ? 'dark' : 'light'} />
      <BackHeader navigation={navigation} title="Payment Methods" />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Paying for</Text>
          <Text style={styles.summaryName}>{serviceName}</Text>
          {!!amount && <Text style={styles.summaryAmount}>{amount}</Text>}
        </View>

        <PaymentSection title="Payment methods" styles={styles}>
          <PaymentOption
            title="Pay Via UPI Autopay"
            subtitle="You need to have a valid upi id."
            icon="qrcode"
            styles={styles}
            onPress={() => onPaymentMethodPress('UPI Autopay')}
          />
        </PaymentSection>

        <PaymentSection title="UPI" styles={styles}>
          <PaymentOption
            title="Pay Via UPI"
            subtitle="You need to have a valid upi id."
            icon="qrcode-scan"
            styles={styles}
            onPress={() => onPaymentMethodPress('UPI')}
          />
        </PaymentSection>

        <PaymentSection title="Credit/Debit Cards" styles={styles}>
          <PaymentOption
            title="Pay Via Credit Card"
            subtitle="You need to have a valid credit card."
            icon="credit-card-outline"
            styles={styles}
            onPress={() => onPaymentMethodPress('Credit Card')}
          />
          <View style={styles.innerDivider} />
          <PaymentOption
            title="Pay Via Debit Card"
            subtitle="You need to have a valid debit card."
            icon="card-bulleted-outline"
            styles={styles}
            onPress={() => onPaymentMethodPress('Debit Card')}
          />
        </PaymentSection>
      </ScrollView>
    </View>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 28,
      gap: 14,
    },
    summaryCard: {
      backgroundColor: theme.cardBackground,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      padding: 14,
    },
    summaryLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      marginBottom: 4,
    },
    summaryName: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    summaryAmount: {
      marginTop: 6,
      fontSize: 16,
      fontWeight: '700',
      color: '#111111',
    },
    section: {
      backgroundColor: theme.cardBackground,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      overflow: 'hidden',
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#111111',
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
    },
    sectionDivider: {
      height: 1,
      backgroundColor: theme.cardBorder,
    },
    optionRow: {
      paddingHorizontal: 14,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    optionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    optionIconWrap: {
      width: 54,
      height: 54,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      backgroundColor: '#F8FAFC',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    optionTextWrap: {
      flex: 1,
    },
    optionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#111111',
      marginBottom: 2,
    },
    optionSubtitle: {
      fontSize: 12,
      color: '#6B7280',
    },
    innerDivider: {
      height: 1,
      marginLeft: 82,
      backgroundColor: theme.cardBorder,
    },
  });
