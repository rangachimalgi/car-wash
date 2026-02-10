import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import AddOnServicesList from './AddOnServicesList';

function toTitleCase(value) {
  const s = String(value || '').trim();
  if (!s) return '';
  return s
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function normalizeDuration(d) {
  if (!d) return '';
  const s = String(d).trim();
  const m = s.match(/^(\d+)\s*min(s)?$/i);
  if (m) return `${m[1]} mins`;
  return s;
}

function computeMonthlyPackages(oneTimePrice, packages) {
  const fromApi = packages?.monthly?.map((pkg, index) => ({ id: `m${index + 1}`, ...pkg }));
  if (fromApi && fromApi.length > 0) return fromApi;
  const p = Number(oneTimePrice || 0);
  return [
    { id: 'm1', times: 2, discount: 5, price: p * 2 * 0.95, perWash: (p * 2 * 0.95) / 2 },
    { id: 'm2', times: 4, discount: 10, price: p * 4 * 0.90, perWash: (p * 4 * 0.90) / 4 },
  ];
}

export default function ServiceAccordionCard({
  serviceSummary,
  serviceDetails,
  expanded = false,
  isLoadingDetails = false,
  onToggle,
  onViewDetails,
  selectedAddOns = [],
  onToggleAddOn,
  navigation,
  fallbackImageSource,
  fallbackAddOns = [],
}) {
  const [imageError, setImageError] = useState(false);
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const service = serviceDetails || serviceSummary || {};
  const title = toTitleCase(serviceSummary?.name || service?.name);
  const durationLabel = normalizeDuration(service?.duration);
  const imageUri =
    service?.image ||
    serviceSummary?.image ||
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&auto=format';

  const addOnServices =
    (service?.addOnServices || []).map((addon) => ({
      _id: addon._id,
      title: addon.name,
      price: addon.basePrice,
      imageUri: addon.image,
      imageSource: !addon.image ? fallbackImageSource : undefined,
    })) || [];

  const resolvedAddOns = addOnServices.length > 0 ? addOnServices : fallbackAddOns;

  const oneTimePrice = Number(service?.basePrice || serviceSummary?.basePrice || 0);
  const monthlyPackages = computeMonthlyPackages(oneTimePrice, service?.packages);
  const maxOff = Math.max(0, ...monthlyPackages.map((p) => Number(p.discount || 0)));

  const resolveSelectedAddOnsDetails = () => {
    return selectedAddOns
      .map((id) => resolvedAddOns.find((a) => a._id === id))
      .filter(Boolean);
  };

  const handleBookOneTime = () => {
    const addOns = resolveSelectedAddOnsDetails();
    const item = {
      id: `oneTime_${Date.now()}`,
      serviceId: service?._id || serviceSummary?._id,
      serviceName: service?.name || serviceSummary?.name,
      title: `${service?.name || serviceSummary?.name} - 1 Time Wash`,
      image: imageUri,
      basePrice: Math.round(oneTimePrice),
      price: Math.round(oneTimePrice + addOns.reduce((t, a) => t + (Number(a.price) || 0), 0)),
      quantity: 1,
      addOns,
      packageType: 'OneTime',
    };
    navigation?.navigate('Cart', { addItem: item });
  };

  const handleBookMonthly = (pkg) => {
    const addOns = resolveSelectedAddOnsDetails();
    const item = {
      id: `pkg_${pkg.id}_${Date.now()}`,
      serviceId: service?._id || serviceSummary?._id,
      serviceName: service?.name || serviceSummary?.name,
      title: `${service?.name || serviceSummary?.name} - Monthly (${pkg.times}x/month)`,
      image: imageUri,
      basePrice: Math.round(Number(pkg.price || 0)),
      price: Math.round(Number(pkg.price || 0)),
      quantity: 1,
      addOns,
      packageType: 'Monthly',
      packageTimes: pkg.times,
    };
    navigation?.navigate('Cart', { addItem: item });
  };

  return (
    <View style={styles.serviceCard}>
      <TouchableOpacity onPress={onToggle} activeOpacity={0.9}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {title}
            </Text>
            <MaterialCommunityIcons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={22}
              color="#0B0B0B"
            />
          </View>
        </View>

        {!expanded ? (
          <>
            <View style={styles.imageContainer}>
              {!imageError ? (
                <Image
                  source={
                    fallbackImageSource && !service?.image && !serviceSummary?.image
                      ? fallbackImageSource
                      : { uri: imageUri }
                  }
                  style={styles.serviceImage}
                  resizeMode="cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <View style={[styles.serviceImage, styles.placeholderImage]}>
                  <MaterialCommunityIcons name="image-outline" size={48} color={theme.accent} />
                </View>
              )}
            </View>

            <View style={styles.cardContent}>
              <View style={styles.cardInfoRow}>
                <Text style={styles.cardPriceLine} numberOfLines={1}>
                  <Text style={styles.cardPricePrefix}>Starting </Text>
                  <Text style={styles.cardPriceValue}>₹{Math.round(oneTimePrice)}</Text>
                </Text>
                {!!durationLabel ? (
                  <View style={styles.durationRowInline}>
                    <MaterialCommunityIcons name="clock-outline" size={16} color={theme.textSecondary} />
                    <Text style={styles.durationText}>{durationLabel}</Text>
                  </View>
                ) : (
                  <View />
                )}
              </View>
            </View>
          </>
        ) : null}
      </TouchableOpacity>

      {expanded ? (
        <View style={styles.expandedArea}>
          <View style={styles.expandedTopRow}>
            <Text style={styles.expandedHeading}>Car Wash & Care</Text>
            <TouchableOpacity style={styles.viewDetailsButton} onPress={onViewDetails} activeOpacity={0.85}>
              <Text style={styles.viewDetailsText}>View Details</Text>
            </TouchableOpacity>
          </View>

          {isLoadingDetails ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={theme.accent} />
              <Text style={styles.loadingText}>Loading add-ons & packages...</Text>
            </View>
          ) : null}

          <AddOnServicesList
            services={resolvedAddOns}
            maxVisible={4}
            selectedAddOns={selectedAddOns}
            onToggleAddOn={onToggleAddOn}
            buttonVariant="plus"
            containerStyle={styles.addOnsInline}
          />

          <View style={styles.divider} />

          <View style={styles.oneTimeRow}>
            <View style={styles.oneTimeLeft}>
              <Text style={styles.oneTimeLabel}>1 - Time Wash</Text>
              <View style={styles.priceRow}>
                <Text style={styles.oneTimePrice}>₹{Math.round(oneTimePrice)}</Text>
                {oneTimePrice < oneTimePrice * 2 ? (
                  <Text style={styles.strikethroughPrice}>₹{Math.round(oneTimePrice * 2)}</Text>
                ) : null}
              </View>
            </View>
            <TouchableOpacity style={styles.bookButton} onPress={handleBookOneTime} activeOpacity={0.85}>
              <Text style={styles.bookText}>Book</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.monthlyHeader}>
            <Text style={styles.monthlyTitle}>Monthly Packages</Text>
            {maxOff > 0 ? (
              <View style={styles.offPill}>
                <Text style={styles.offPillText}>{maxOff}% OFF</Text>
              </View>
            ) : null}
          </View>

          {monthlyPackages.map((pkg) => {
            const originalPrice = oneTimePrice * pkg.times;
            return (
              <View key={pkg.id} style={styles.monthlyItem}>
                <View style={styles.monthlyLeft}>
                  <View style={styles.totalPill}>
                    <Text style={styles.totalPillText}>Total ₹{Math.round(pkg.price)}</Text>
                  </View>
                  <Text style={styles.monthlyTimes}>{pkg.times} Wash/Month</Text>
                </View>
                <View style={styles.monthlyRight}>
                  <View style={styles.priceRow}>
                    <Text style={styles.perWashText}>₹{Math.round(pkg.perWash)}/wash</Text>
                    <Text style={styles.strikethroughPrice}>₹{Math.round(originalPrice / pkg.times)}/Wash</Text>
                  </View>
                  <TouchableOpacity style={styles.bookButton} onPress={() => handleBookMonthly(pkg)} activeOpacity={0.85}>
                    <Text style={styles.bookText}>Book</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    // Match ServiceCard look & feel
    serviceCard: {
      backgroundColor: theme.cardBackground,
      borderRadius: 16,
      marginHorizontal: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    },
    cardHeader: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 10,
      backgroundColor: '#CBD5E1',
      borderBottomWidth: 1,
      borderBottomColor: theme.cardBorder,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    cardTitle: {
      flex: 1,
      fontSize: 20,
      fontWeight: '700',
      color: '#0B0B0B',
    },
    imageContainer: {
      position: 'relative',
      marginHorizontal: 0,
      marginBottom: 12,
      borderRadius: 0,
      overflow: 'hidden',
    },
    serviceImage: {
      width: '100%',
      height: 165,
      borderRadius: 0,
    },
    placeholderImage: {
      backgroundColor: theme.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardContent: {
      padding: 16,
      paddingTop: 0,
    },
    cardInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
      gap: 12,
    },
    cardPriceLine: {
      fontSize: 15,
      fontWeight: '700',
      color: '#0B0B0B',
    },
    cardPricePrefix: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.textSecondary,
    },
    cardPriceValue: {
      fontSize: 22,
      fontWeight: '900',
      color: '#0B0B0B',
    },
    durationRowInline: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    durationText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.textSecondary,
    },

    // Expanded section (inline)
    expandedArea: {
      paddingHorizontal: 16,
      paddingBottom: 16,
      paddingTop: 12,
      backgroundColor: theme.cardBackground, // White background
      marginTop: 0,
      borderTopWidth: 1,
      borderTopColor: theme.cardBorder,
      borderStyle: 'dashed',
    },
    expandedTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 4,
      paddingBottom: 6,
    },
    expandedHeading: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.textSecondary,
    },
    viewDetailsButton: {
      backgroundColor: theme.accent,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
    },
    viewDetailsText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#0B0B0B',
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
    },
    loadingText: {
      color: theme.textSecondary,
      fontWeight: '600',
      fontSize: 12,
    },
    addOnsInline: {
      marginTop: 8,
      marginBottom: 8,
    },
    divider: {
      height: 1,
      borderStyle: 'dashed',
      borderWidth: 1,
      borderColor: theme.cardBorder,
      marginVertical: 12,
      opacity: 0.5,
    },
    oneTimeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      backgroundColor: theme.cardBackground,
      marginBottom: 10,
    },
    oneTimeLeft: {
      flex: 1,
    },
    oneTimeLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.textPrimary,
      marginBottom: 4,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    oneTimePrice: {
      fontSize: 18,
      fontWeight: '900',
      color: theme.textPrimary,
    },
    strikethroughPrice: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textSecondary,
      textDecorationLine: 'line-through',
    },
    bookButton: {
      backgroundColor: theme.accent,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 70,
    },
    bookText: {
      fontSize: 13,
      fontWeight: '900',
      color: '#0B0B0B',
    },
    monthlyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    monthlyTitle: {
      fontSize: 16,
      fontWeight: '900',
      color: theme.textPrimary,
    },
    offPill: {
      backgroundColor: '#2E7D32',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    offPillText: {
      color: '#FFFFFF',
      fontWeight: '900',
      fontSize: 11,
    },
    monthlyItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: theme.cardBorder,
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      padding: 12,
      marginBottom: 10,
      gap: 10,
    },
    monthlyLeft: {
      flex: 1,
    },
    totalPill: {
      alignSelf: 'flex-start',
      backgroundColor: 'transparent',
      paddingHorizontal: 0,
      paddingVertical: 0,
      borderRadius: 0,
      marginBottom: 6,
    },
    totalPillText: {
      color: theme.textPrimary,
      fontWeight: '900',
      fontSize: 14,
    },
    monthlyTimes: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    monthlyRight: {
      alignItems: 'flex-end',
      gap: 6,
    },
    perWashText: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.textPrimary,
    },
  });

