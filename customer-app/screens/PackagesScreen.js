import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MinimalBackHeader from '../components/MinimalBackHeader';
import PackageAccordionCard from '../components/PackageAccordionCard';
import ServiceDetailsBottomSheet from '../components/ServiceDetailsBottomSheet';
import AddOnServicesList from '../components/AddOnServicesList';
import ServiceCoverage from '../components/ServiceCoverage';
import { resolveAssetUrl } from '../config/api';
import { getPackagePricing } from '../services/packagePricingApi';
import { getServicesByCategory } from '../services/serviceApi';
import { useTheme } from '../theme/ThemeContext';

const FALLBACK_CAR_IMAGE = require('../assets/carpicseven.png');
const FALLBACK_PACKAGE_IMAGE = FALLBACK_CAR_IMAGE;

const FALLBACK_ADDON_IMAGE = require('../assets/carwash.png');

const mapAddOnsById = (addOnServices = []) =>
  addOnServices.reduce((acc, addOn) => {
    if (addOn?._id) acc[addOn._id] = addOn;
    return acc;
  }, {});

const buildPackageCards = (pricingConfig, addOnsById = {}) => {
  const durationDays = Number(pricingConfig?.durationDays || 30);
  const cards = Array.isArray(pricingConfig?.packageCards) ? pricingConfig.packageCards : [];

  return cards
    .map((card, index) => {
      const times = Number(card?.times || 0);
      const basePrice = Number(card?.price || 0);
      const perWash = times > 0 ? basePrice / times : basePrice;
      return {
        _id: `pkg_${index}_${times}`,
        name: String(card?.name || '').trim(),
        description: String(card?.description || '').trim(),
        image: String(card?.image || '').trim(),
        panelImage: String(card?.panelImage || '').trim(),
        category: 'Package',
        duration: `${durationDays} days`,
        basePrice,
        addOnServices: (Array.isArray(card?.addOnServiceIds) ? card.addOnServiceIds : [])
          .map((id) => addOnsById[id])
          .filter(Boolean),
        specifications: {
          coverage: Array.isArray(card?.coverageIncluded) ? card.coverageIncluded : [],
          notIncluded: Array.isArray(card?.coverageNotIncluded) ? card.coverageNotIncluded : [],
        },
        packages: { monthly: [{ times, discount: 0, price: basePrice, perWash }] },
      };
    })
    .filter((item) => item.name && Number(item.basePrice) > 0 && item.packages.monthly[0].times > 0);
};

export default function PackagesScreen({ navigation }) {
  const { theme, isLightMode } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [packageCards, setPackageCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedServiceId, setExpandedServiceId] = useState(null);
  const [selectedAddOnsByServiceId, setSelectedAddOnsByServiceId] = useState({});
  const [bookingServiceId, setBookingServiceId] = useState(null);
  const [sheetService, setSheetService] = useState(null);
  const bottomSheetRef = useRef(null);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const [pricingResp, servicesResp, addOnResp] = await Promise.all([
        getPackagePricing({ app: 'customer', vehicleType: 'car' }),
        getServicesByCategory('CarWash'),
        getServicesByCategory('AddOn'),
      ]);
      const fallbackServiceId = servicesResp?.success && servicesResp?.data?.length > 0
        ? servicesResp.data[0]?._id
        : null;
      setBookingServiceId(fallbackServiceId || null);
      if (pricingResp?.success && pricingResp?.data) {
        const addOnsLookup = mapAddOnsById(addOnResp?.success ? (addOnResp.data || []) : []);
        setPackageCards(buildPackageCards(pricingResp.data, addOnsLookup));
      } else {
        setPackageCards([]);
      }
    } catch (_) {
      setPackageCards([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const toggleService = async (service) => {
    const id = service?._id;
    if (!id) return;
    setExpandedServiceId((prev) => (prev === id ? null : id));
  };

  const toggleAddOn = (serviceId, addOnId) => {
    if (!serviceId || !addOnId) return;
    setSelectedAddOnsByServiceId((prev) => {
      const current = prev[serviceId] || [];
      const next = current.includes(addOnId)
        ? current.filter((id) => id !== addOnId)
        : [...current, addOnId];
      return { ...prev, [serviceId]: next };
    });
  };

  const openServiceBottomSheet = (service) => {
    if (!service) return;
    setSheetService(service);
    setTimeout(() => {
      bottomSheetRef.current?.expand?.();
    }, 0);
  };

  const handleCloseSheet = () => {
    setSheetService(null);
  };

  const renderServiceList = (items, fallbackImageSource) =>
    items.map((service) => (
      <PackageAccordionCard
        key={service._id}
        serviceSummary={service}
        serviceDetails={service}
        expanded={expandedServiceId === service._id}
        isLoadingDetails={false}
        onToggle={() => toggleService(service)}
        onViewDetails={() => openServiceBottomSheet(service)}
        selectedAddOns={selectedAddOnsByServiceId[service._id] || []}
        onToggleAddOn={(addOnId) => toggleAddOn(service._id, addOnId)}
        navigation={navigation}
        fallbackImageSource={fallbackImageSource}
        fallbackAddOns={[]}
        monthlyMode="standard"
        bookingServiceId={bookingServiceId}
      />
    ));

  return (
    <View style={styles.container}>
      <StatusBar style={isLightMode ? 'dark' : 'light'} />
      <MinimalBackHeader navigation={navigation} title="Monthly Packages" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchPackages} tintColor={theme.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={styles.loadingText}>Loading packages...</Text>
          </View>
        ) : (
          <>
            {packageCards.length > 0 ? (
              renderServiceList(packageCards, FALLBACK_PACKAGE_IMAGE)
            ) : (
              <View style={styles.loadingWrap}>
                <Text style={styles.loadingText}>No packages available right now.</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {sheetService ? (
        <>
          <View style={styles.sheetBackdrop} />
          <View style={styles.closeSheetButtonContainer}>
            <TouchableOpacity onPress={handleCloseSheet} style={styles.closeSheetButton} activeOpacity={0.8}>
              <MaterialCommunityIcons name="close" size={20} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>
          <ServiceDetailsBottomSheet ref={bottomSheetRef}>
            <BottomSheetScrollView contentContainerStyle={styles.bottomSheetContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.categoryText}>PACKAGE DETAILS</Text>
              <Text style={styles.sheetTitle}>{sheetService.name}</Text>
              {sheetService.description ? (
                <Text style={styles.sheetDescription}>{sheetService.description}</Text>
              ) : null}

              <ServiceCoverage
                included={sheetService?.specifications?.coverage || []}
                notIncluded={sheetService?.specifications?.notIncluded || []}
              />

              <AddOnServicesList
                services={(sheetService?.addOnServices || []).map((addon) => ({
                  _id: addon._id,
                  title: addon.name,
                  price: addon.basePrice,
                  imageUri: resolveAssetUrl(addon.image || ''),
                  imageSource: !addon.image ? FALLBACK_ADDON_IMAGE : undefined,
                }))}
                maxVisible={5}
                selectedAddOns={selectedAddOnsByServiceId[sheetService._id] || []}
                onToggleAddOn={(addOnId) => toggleAddOn(sheetService._id, addOnId)}
                fallbackImageSource={FALLBACK_ADDON_IMAGE}
                serviceImageUri={
                  resolveAssetUrl(sheetService?.panelImage || '') || null
                }
                serviceImageSource={
                  !sheetService?.panelImage ? FALLBACK_PACKAGE_IMAGE : null
                }
              />
            </BottomSheetScrollView>
          </ServiceDetailsBottomSheet>
        </>
      ) : null}
    </View>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingTop: 12,
      paddingBottom: 100,
    },
    loadingWrap: {
      paddingTop: 80,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: theme.textSecondary,
      fontWeight: '600',
    },
    sheetBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.25)',
    },
    closeSheetButtonContainer: {
      position: 'absolute',
      top: '24%',
      right: 24,
      zIndex: 30,
      elevation: 30,
    },
    closeSheetButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.cardBackground,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    bottomSheetContent: {
      padding: 20,
      paddingBottom: 40,
    },
    categoryText: {
      fontSize: 12,
      color: theme.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 8,
    },
    sheetTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.textPrimary,
      marginBottom: 8,
    },
    sheetDescription: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 8,
      lineHeight: 20,
    },
  });
