import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { resolveAssetUrl } from '../config/api';
import { useTheme } from '../theme/ThemeContext';
import { wooshGreen } from '../theme/wooshGreen';
import AddOnServicesList from './AddOnServicesList';
import {
  applyWooshMembershipDiscount,
  scaleLineItemsToDiscountedGross,
} from '../utils/membershipPricing';

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
  monthlyMode = 'custom',
  hideOneTimeWash = false,
  hideAddServices = false,
  bookingServiceId,
  membershipDiscountPercent = 0,
}) {
  const resolvedServiceId = bookingServiceId || service?._id || serviceSummary?._id;
  const [imageError, setImageError] = useState(false);
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const service = serviceDetails || serviceSummary || {};
  const title = toTitleCase(serviceSummary?.name || service?.name);
  const durationLabel = normalizeDuration(service?.duration);
  const resolvedMainImage =
    resolveAssetUrl(service?.image || serviceSummary?.image || '') ||
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&auto=format';
  const imageUri = resolvedMainImage;

  const addOnServices =
    (service?.addOnServices || []).map((addon) => ({
      _id: addon._id,
      title: toTitleCase(addon.name),
      price: addon.basePrice,
      imageUri: resolveAssetUrl(addon.image || ''),
      imageSource: !addon.image ? fallbackImageSource : undefined,
    })) || [];

  const resolvedAddOns = (addOnServices.length > 0 ? addOnServices : fallbackAddOns).map(
    (addon) => ({
      ...addon,
      title: toTitleCase(addon.title || addon.name),
    })
  );

  const oneTimePrice = Number(service?.basePrice || serviceSummary?.basePrice || 0);
  const monthlyPackages = computeMonthlyPackages(oneTimePrice, service?.packages);
  const maxOff = Math.max(0, ...monthlyPackages.map((p) => Number(p.discount || 0)));
  const categoryLabel = service?.category || serviceSummary?.category;
  const expandedHeadingText =
    categoryLabel === 'BikeWash'
      ? 'Bike Wash & Care'
      : categoryLabel === 'CarWash'
        ? 'Car Wash & Care'
        : categoryLabel === 'AutoWash'
          ? 'Auto Wash & Care'
        : 'Package Details';

  const resolveSelectedAddOnsDetails = () => {
    return selectedAddOns
      .map((id) => resolvedAddOns.find((a) => a._id === id))
      .filter(Boolean);
  };

  // Calculate total add-on price
  const calculateAddOnsTotal = () => {
    return selectedAddOns.reduce((total, addOnId) => {
      const addOn = resolvedAddOns.find((a) => a._id === addOnId);
      return total + (Number(addOn?.price) || 0);
    }, 0);
  };

  const addOnsTotal = calculateAddOnsTotal();

  const memberPct = Math.min(100, Math.max(0, Number(membershipDiscountPercent) || 0));

  const handleBookOneTime = () => {
    if (!resolvedServiceId) return;
    const addOns = resolveSelectedAddOnsDetails();
    const gross = Math.round(oneTimePrice + addOns.reduce((t, a) => t + (Number(a.price) || 0), 0));
    const scaled = scaleLineItemsToDiscountedGross({
      basePrice: oneTimePrice,
      addOns,
      grossBeforeDiscount: gross,
      discountPercent: memberPct,
    });
    const item = {
      id: `oneTime_${Date.now()}`,
      serviceId: resolvedServiceId,
      serviceName: service?.name || serviceSummary?.name,
      title: `${service?.name || serviceSummary?.name} - 1 Time Wash`,
      image: imageUri,
      basePrice: scaled.basePrice,
      price: scaled.price,
      quantity: 1,
      addOns: scaled.addOns,
      packageType: 'OneTime',
    };
    navigation?.navigate('Cart', { addItem: item });
  };

  const handleBookMonthlyCustom = () => {
    if (!resolvedServiceId) return;
    navigation?.navigate('PackageDetails', {
      serviceId: resolvedServiceId,
      serviceName: service?.name || serviceSummary?.name,
      selectedAddOns: resolveSelectedAddOnsDetails(),
    });
  };

  const handleBookMonthlyStandard = (pkg) => {
    if (!resolvedServiceId) return;
    const addOns = resolveSelectedAddOnsDetails();
    const addOnsTotalForPackage = addOns.reduce((t, a) => t + (Number(a.price) || 0), 0) * pkg.times;
    const pkgP = Math.round(Number(pkg.price || 0));
    const gross = Math.round(pkgP + addOnsTotalForPackage);
    const discounted = applyWooshMembershipDiscount(gross, memberPct);
    const factor = gross > 0 ? discounted / gross : 1;
    const item = {
      id: `pkg_${pkg.id}_${Date.now()}`,
      serviceId: resolvedServiceId,
      serviceName: service?.name || serviceSummary?.name,
      title: `${service?.name || serviceSummary?.name} - Monthly (${pkg.times}x/month)`,
      image: imageUri,
      basePrice: Math.round(pkgP * factor),
      price: discounted,
      quantity: 1,
      addOns: addOns.map((a) => ({
        ...a,
        price: Math.round((Number(a.price) || 0) * factor),
      })),
      packageType: 'Monthly',
      packageTimes: pkg.times,
    };
    navigation?.navigate('Cart', { addItem: item });
  };

  // Hardcoded ratings for now
  const hardcodedRating = 3.9;
  const hardcodedRatingsCount = 2530;

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

            <View style={styles.cardBottomSection}>
              <View style={styles.ratingSection}>
                <MaterialCommunityIcons name="star" size={18} color="#FFD700" />
                <Text style={styles.ratingValue}>{hardcodedRating}</Text>
                <View style={styles.ratingDot} />
                <Text style={styles.ratingsCount}>{hardcodedRatingsCount.toLocaleString()} Ratings</Text>
              </View>
              <View style={styles.priceSection}>
                <Text style={styles.cardPriceLine} numberOfLines={1}>
                  <Text style={styles.cardPricePrefix}>Starting </Text>
                  {memberPct > 0 ? (
                    <>
                      <Text style={styles.cardPriceStrike}>₹{Math.round(oneTimePrice)}</Text>
                      <Text style={styles.cardPriceValue}>
                        {' '}
                        ₹{applyWooshMembershipDiscount(Math.round(oneTimePrice), memberPct)}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.cardPriceValue}>₹{Math.round(oneTimePrice)}</Text>
                  )}
                </Text>
                {memberPct > 0 ? (
                  <Text style={styles.memberPriceHint}>Woosh Green discount {memberPct}%</Text>
                ) : null}
              </View>
            </View>
          </>
        ) : null}
      </TouchableOpacity>

      {expanded ? (
        <View style={styles.expandedArea}>
          <View style={styles.expandedTopRow}>
            <Text style={styles.expandedHeading}>
              {expandedHeadingText}
            </Text>
            <TouchableOpacity style={styles.viewDetailsButton} onPress={onViewDetails} activeOpacity={0.85}>
              <Text style={styles.viewDetailsText}>View Details</Text>
              <MaterialCommunityIcons name="arrow-right" size={14} color="#0B0B0B" />
            </TouchableOpacity>
          </View>

          <View style={styles.sectionRule} />

          {isLoadingDetails ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={theme.accent} size="small" />
              <Text style={styles.loadingText}>Loading add-ons & packages...</Text>
            </View>
          ) : null}

          {!hideAddServices ? (
            <>
              <AddOnServicesList
                services={resolvedAddOns}
                maxVisible={5}
                selectedAddOns={selectedAddOns}
                onToggleAddOn={onToggleAddOn}
                buttonVariant="plus"
                containerStyle={styles.addOnsInline}
                fallbackImageSource={fallbackImageSource}
              />

              <View style={styles.sectionRule} />
            </>
          ) : null}

          <View style={styles.sectionDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Pricing</Text>
            <View style={styles.dividerLine} />
          </View>

          {memberPct > 0 ? (
            <Text style={styles.memberDiscountCaption}>Woosh Green discount {memberPct}%</Text>
          ) : null}

          {!hideOneTimeWash ? (
            <View style={styles.oneTimeCard}>
              <View style={styles.oneTimeContent}>
                <Text style={styles.oneTimeLabel}>1-Time Wash</Text>
                {memberPct > 0 ? (
                  <View>
                    <Text style={styles.oneTimePriceStrike}>
                      ₹{Math.round(oneTimePrice + addOnsTotal)}
                    </Text>
                    <Text style={styles.oneTimePrice}>
                      ₹{applyWooshMembershipDiscount(Math.round(oneTimePrice + addOnsTotal), memberPct)}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.oneTimePrice}>₹{Math.round(oneTimePrice + addOnsTotal)}</Text>
                )}
              </View>
              <TouchableOpacity style={styles.bookButtonPrimary} onPress={handleBookOneTime} activeOpacity={0.85}>
                <Text style={styles.bookTextPrimary}>Book</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.monthlySection}>
            <View style={styles.monthlyHeader}>
              <Text style={styles.monthlyTitle}>Monthly Packages</Text>
              {maxOff > 0 ? (
                <View style={styles.offPill}>
                  <Text style={styles.offPillText}>UP TO {maxOff}% OFF</Text>
                </View>
              ) : null}
            </View>

            {monthlyMode === 'custom' ? (
              <View style={styles.monthlyCard}>
                <View style={styles.monthlyContent}>
                  <Text style={styles.monthlyCustomSubtitle}>
                    Customizable monthly plan for interior, exterior, and daily cleaning.
                  </Text>
                </View>
                <TouchableOpacity style={styles.bookButtonSecondary} onPress={handleBookMonthlyCustom} activeOpacity={0.85}>
                  <Text style={styles.bookTextSecondary}>Book</Text>
                </TouchableOpacity>
              </View>
            ) : (
              monthlyPackages.map((pkg) => {
                const addOnsForPackage = addOnsTotal * pkg.times;
                const totalWithAddOns = pkg.price + addOnsForPackage;
                const perWashWithAddOns = (pkg.price + addOnsForPackage) / pkg.times;
                const discTotal = applyWooshMembershipDiscount(Math.round(totalWithAddOns), memberPct);
                const discPerWash = memberPct > 0 ? discTotal / pkg.times : perWashWithAddOns;
                return (
                  <View key={pkg.id} style={styles.monthlyCard}>
                    <View style={styles.monthlyContent}>
                      <Text style={styles.monthlyTimes}>{pkg.times}x Wash/Month</Text>
                      {memberPct > 0 ? (
                        <Text style={styles.monthlyTotalPrice}>
                          <Text style={styles.oneTimePriceStrike}>₹{Math.round(totalWithAddOns)} • </Text>
                          ₹{Math.round(discTotal)} • ₹{Math.round(discPerWash)}/wash
                        </Text>
                      ) : (
                        <Text style={styles.monthlyTotalPrice}>
                          ₹{Math.round(totalWithAddOns)} • ₹{Math.round(perWashWithAddOns)}/wash
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity style={styles.bookButtonSecondary} onPress={() => handleBookMonthlyStandard(pkg)} activeOpacity={0.85}>
                      <Text style={styles.bookTextSecondary}>Book</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
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
      paddingBottom: 12,
      backgroundColor: '#66abf1',
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    cardTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: '700',
      color: '#000000',
    },
    imageContainer: {
      position: 'relative',
      marginHorizontal: 0,
      marginBottom: 0,
      borderRadius: 0,
      overflow: 'hidden',
      height: 200,
      backgroundColor: '#f4f6f8',
      justifyContent: 'center',
      alignItems: 'center',
    },
    serviceImage: {
      width: '100%',
      height: '100%',
    },
    placeholderImage: {
      backgroundColor: theme.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardBottomSection: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 60,
    },
    ratingSection: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 16,
      height: '100%',
      gap: 6,
    },
    ratingValue: {
      fontSize: 16,
      fontWeight: '700',
      color: '#000000',
    },
    ratingDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#666666',
    },
    ratingsCount: {
      fontSize: 14,
      fontWeight: '500',
      color: '#000000',
    },
    priceSection: {
      flex: 1,
      backgroundColor: '#66abf1',
      paddingHorizontal: 16,
      height: '100%',
      justifyContent: 'center',
      alignItems: 'flex-end',
    },
    cardPriceLine: {
      fontSize: 15,
      fontWeight: '700',
      color: '#0B0B0B',
    },
    cardPricePrefix: {
      fontSize: 15,
      fontWeight: '700',
      color: '#0B0B0B',
    },
    cardPriceValue: {
      fontSize: 18,
      fontWeight: '900',
      color: '#0B0B0B',
    },
    cardPriceStrike: {
      fontSize: 15,
      fontWeight: '700',
      color: '#555555',
      textDecorationLine: 'line-through',
    },
    memberPriceHint: {
      marginTop: 4,
      fontSize: 11,
      fontWeight: '700',
      color: wooshGreen.medium,
      textAlign: 'right',
    },
    memberDiscountCaption: {
      fontSize: 11,
      fontWeight: '700',
      color: wooshGreen.medium,
      marginBottom: 10,
    },

    // Expanded section (enhanced design)
    expandedArea: {
      paddingHorizontal: 20,
      paddingBottom: 20,
      paddingTop: 20,
      backgroundColor: theme.cardBackground,
      marginTop: 0,
    },
    expandedTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    expandedHeading: {
      fontSize: 20,
      fontWeight: '800',
      color: theme.textPrimary,
      letterSpacing: 0.3,
    },
    viewDetailsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: '#000000',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 10,
      shadowColor: theme.accent,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    viewDetailsText: {
      fontSize: 13,
      fontWeight: '800',
      color: '#ffffff',
      letterSpacing: 0.2,
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 16,
      paddingHorizontal: 4,
    },
    loadingText: {
      color: theme.textSecondary,
      fontWeight: '600',
      fontSize: 13,
    },
    addOnsInline: {
      marginTop: 4,
      marginBottom: 20,
    },
    addServicesHeaderRow: {
      marginTop: 4,
      marginBottom: 8,
    },
    addServicesLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    sectionRule: {
      height: 1,
      backgroundColor: theme.cardBorder,
      opacity: 0.4,
      marginVertical: 10,
    },
    sectionDivider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 24,
      gap: 12,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.cardBorder,
      opacity: 0.3,
    },
    dividerText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    oneTimeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.accent + '15',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.accent + '40',
      paddingVertical: 14,
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    oneTimeContent: {
      flex: 1,
    },
    oneTimeLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.textPrimary,
      marginBottom: 4,
    },
    oneTimePrice: {
      fontSize: 20,
      fontWeight: '900',
      color: theme.textPrimary,
      letterSpacing: -0.3,
    },
    oneTimePriceStrike: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textSecondary,
      textDecorationLine: 'line-through',
      marginBottom: 2,
    },
    bookButtonPrimary: {
      backgroundColor: '#000000',
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 20,
    },
    bookTextPrimary: {
      fontSize: 14,
      fontWeight: '800',
      color: '#ffffff',
    },
    monthlySection: {
      marginTop: 8,
    },
    monthlyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    monthlyHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    monthlyTitle: {
      fontSize: 18,
      fontWeight: '900',
      color: theme.textPrimary,
      letterSpacing: 0.3,
    },
    offPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#2E7D32',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      shadowColor: '#2E7D32',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    },
    offPillText: {
      color: '#FFFFFF',
      fontWeight: '900',
      fontSize: 11,
      letterSpacing: 0.5,
    },
    monthlyCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      paddingVertical: 14,
      paddingHorizontal: 16,
      marginBottom: 10,
    },
    monthlyContent: {
      flex: 1,
    },
    monthlyTimes: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.textPrimary,
      marginBottom: 4,
    },
    monthlyTotalPrice: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.textPrimary,
      letterSpacing: -0.2,
    },
    monthlyCustomSubtitle: {
      fontSize: 13,
      lineHeight: 19,
      fontWeight: '600',
      color: theme.textSecondary,
      paddingRight: 12,
    },
    bookButtonSecondary: {
      backgroundColor: '#000000',
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 20,
    },
    bookTextSecondary: {
      fontSize: 14,
      fontWeight: '800',
      color: '#ffffff',
    },
    addOnsPriceText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.textSecondary,
      marginTop: 4,
    },
  });

