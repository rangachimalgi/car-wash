import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import MinimalBackHeader from '../components/MinimalBackHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { getAddressKeys } from '../services/addressStorage';
import { useTheme } from '../theme/ThemeContext';
import { searchAddress, reverseGeocode } from '../services/geocoding';

const DEFAULT_REGION = { latitude: 12.9716, longitude: 77.5946, latitudeDelta: 0.02, longitudeDelta: 0.02 };
const SEARCH_DEBOUNCE_MS = 400;

const getGoogleMapsKey = () => (process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '').trim();

function getGoogleMapHtml(centerLat, centerLng, apiKey) {
  const key = apiKey.replace(/"/g, '&quot;');
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <style>html, body, #map { height: 100%; margin: 0; padding: 0; }
  .center-pin { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 10; pointer-events: none; }
  .center-pin svg { width: 48px; height: 48px; margin-top: -24px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); }</style>
</head>
<body>
  <div id="map"></div>
  <div class="center-pin"><svg viewBox="0 0 24 24" fill="#E53935"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg></div>
  <script>
    function sendCenter(center) {
      if (window.ReactNativeWebView && center) window.ReactNativeWebView.postMessage(JSON.stringify({ latitude: center.lat(), longitude: center.lng() }));
    }
    function initMap() {
      var map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: ${centerLat}, lng: ${centerLng} },
        zoom: 15,
        mapTypeId: 'roadmap',
        gestureHandling: 'greedy',
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true
      });
      window.__map = map;
      map.addListener('idle', function() { sendCenter(map.getCenter()); });
      setTimeout(function() { sendCenter(map.getCenter()); }, 600);
    }
  </script>
  <script async defer src="https://maps.googleapis.com/maps/api/js?key=${key}&callback=initMap"></script>
</body>
</html>`;
}

function getOSMMapHtml(centerLat, centerLng) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; }
    .center-pin { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 1000; pointer-events: none; }
    .center-pin svg { width: 48px; height: 48px; margin-top: -24px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); }
  </style>
</head>
<body>
  <div id="map"></div>
  <div class="center-pin">
    <svg viewBox="0 0 24 24" fill="#E53935"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
  </div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
  <script>
    var map = L.map('map').setView([${centerLat}, ${centerLng}], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    window.__map = map;
    function sendCenter() {
      var c = map.getCenter();
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({ latitude: c.lat, longitude: c.lng }));
    }
    map.on('moveend', sendCenter);
    setTimeout(sendCenter, 500);
  </script>
</body>
</html>`;
}

export default function AddressesScreen({ navigation, route }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchDebounceRef = useRef(null);
  const { theme, isLightMode } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isPicking, setIsPicking] = useState(false);
  const [mapRegion, setMapRegion] = useState(DEFAULT_REGION);
  const [initialMapRegion, setInitialMapRegion] = useState(DEFAULT_REGION);
  const [pickedCoords, setPickedCoords] = useState(null);
  const [pickedAddress, setPickedAddress] = useState('');
  const [pickedAddressTitle, setPickedAddressTitle] = useState('');
  const [resolvingAddress, setResolvingAddress] = useState(false);
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [mapSearchSuggestions, setMapSearchSuggestions] = useState([]);
  const [mapSearchLoading, setMapSearchLoading] = useState(false);
  const mapSearchDebounceRef = useRef(null);
  const mapWebViewRef = useRef(null);
  const [mapModalReady, setMapModalReady] = useState(false);
  const [isDetailStep, setIsDetailStep] = useState(false);
  const [pendingLocation, setPendingLocation] = useState(null);
  const [detailForm, setDetailForm] = useState({
    residenceType: 'Apartment',
    residenceTypeCustom: '',
    buildingName: '',
    flatNumber: '',
    towerBlock: '',
    landmark: '',
    label: 'Home',
    labelCustom: '',
    receiverName: '',
    receiverPhone: '+91',
  });
  const mapMessageDebounceRef = useRef(null);
  const mapMessagePendingRef = useRef(null);
  const mapModalShowTimeoutRef = useRef(null);
  const lastResolvedCenterRef = useRef(null);

  useEffect(() => {
    if (!isPicking) {
      setMapModalReady(false);
      lastResolvedCenterRef.current = null;
      if (mapModalShowTimeoutRef.current) {
        clearTimeout(mapModalShowTimeoutRef.current);
        mapModalShowTimeoutRef.current = null;
      }
    }
  }, [isPicking]);

  const mapSource = useMemo(
    () => ({
      html: getGoogleMapsKey()
        ? getGoogleMapHtml(initialMapRegion.latitude, initialMapRegion.longitude, getGoogleMapsKey())
        : getOSMMapHtml(initialMapRegion.latitude, initialMapRegion.longitude),
    }),
    [initialMapRegion.latitude, initialMapRegion.longitude]
  );
  const [form, setForm] = useState({
    type: 'Home',
    address: '',
    area: '',
    city: '',
    pincode: '',
  });

  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const keys = await getAddressKeys();
        const stored = await AsyncStorage.getItem(keys.savedAddresses);
        if (stored) {
          setSavedAddresses(JSON.parse(stored));
        }
      } catch (error) {
        console.warn('Failed to load addresses:', error);
      }
    };
    loadAddresses();
  }, []);

  // Debounced address search (Google Geocoding)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchSuggestions([]);
      return;
    }
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      const results = await searchAddress(searchQuery);
      setSearchSuggestions(results);
      setSearchLoading(false);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery]);

  useEffect(() => {
    if (!isPicking || !mapSearchQuery.trim()) {
      setMapSearchSuggestions([]);
      return;
    }
    if (mapSearchDebounceRef.current) clearTimeout(mapSearchDebounceRef.current);
    mapSearchDebounceRef.current = setTimeout(async () => {
      setMapSearchLoading(true);
      const results = await searchAddress(mapSearchQuery);
      setMapSearchSuggestions(results);
      setMapSearchLoading(false);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (mapSearchDebounceRef.current) clearTimeout(mapSearchDebounceRef.current);
    };
  }, [isPicking, mapSearchQuery]);

  const persistAddresses = async (addresses) => {
    setSavedAddresses(addresses);
    const keys = await getAddressKeys();
    await AsyncStorage.setItem(keys.savedAddresses, JSON.stringify(addresses));
  };

  const handleUseCurrentLocation = async () => {
    // Open the map picker immediately for responsiveness
    setIsPicking(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      const [place] = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      const parts = [
        place?.name,
        place?.street,
        place?.subLocality,
        place?.city,
        place?.region,
        place?.postalCode,
      ].filter(Boolean);
      const addressText = parts.join(', ') || `${position.coords.latitude}, ${position.coords.longitude}`;

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      setPickedCoords({ latitude: lat, longitude: lng });
      setPickedAddress(addressText);
      setPickedAddressTitle(parts[0] || addressText);

      // Smoothly move the existing map to current location without reloading
      if (getGoogleMapsKey()) {
        mapWebViewRef.current?.injectJavaScript(
          `if(window.__map){window.__map.panTo({lat:${lat},lng:${lng}});window.__map.setZoom(15);} true;`
        );
      } else {
        mapWebViewRef.current?.injectJavaScript(
          `if(window.__map){window.__map.panTo([${lat},${lng}]);window.__map.setZoom(15);} true;`
        );
      }
    } catch (error) {
      console.error('Use current location error:', error);
      Alert.alert('Location error', 'Unable to get current location.');
    }
  };

  const handleSelectAddress = async (address) => {
    // If address is selected from route params, pass it back
    if (route?.params?.onSelectAddress) {
      route.params.onSelectAddress(address);
      navigation.goBack();
    }
    const fullAddress = [address.address, address.area, address.city, address.pincode]
      .filter(Boolean)
      .join(', ');
    try {
      const keys = await getAddressKeys();
      await AsyncStorage.setItem(keys.currentAddress, fullAddress);
      const hasCoords = typeof address.latitude === 'number' && typeof address.longitude === 'number';
      if (hasCoords) {
        await AsyncStorage.setItem(keys.currentLat, String(address.latitude));
        await AsyncStorage.setItem(keys.currentLng, String(address.longitude));
      } else {
        await AsyncStorage.removeItem(keys.currentLat);
        await AsyncStorage.removeItem(keys.currentLng);
      }
    } catch (error) {
      console.warn('Failed to store current address:', error);
    }
    navigation.goBack();
  };

  const handleAddNewAddress = () => {
    setIsAdding(true);
  };

  const handleDeleteAddress = (id) => {
    const updated = savedAddresses.filter(addr => addr.id !== id);
    persistAddresses(updated).catch(error => console.warn('Delete address failed:', error));
  };

  const handleSetDefault = (id) => {
    const updated = savedAddresses.map(addr => ({
        ...addr,
        isDefault: addr.id === id,
      }));
    persistAddresses(updated).catch(error => console.warn('Set default failed:', error));
  };

  const handleSaveAddress = async () => {
    if (!form.address.trim()) {
      Alert.alert('Missing address', 'Please enter an address.');
      return;
    }
    const newAddress = {
      id: String(Date.now()),
      type: form.type,
      address: form.address.trim(),
      area: form.area.trim(),
      city: form.city.trim(),
      pincode: form.pincode.trim(),
      isDefault: savedAddresses.length === 0,
    };
    const updated = [newAddress, ...savedAddresses];
    await persistAddresses(updated);
    setIsAdding(false);
    setForm({ type: 'Home', address: '', area: '', city: '', pincode: '' });
  };

  const handleOpenMapPicker = () => {
    setPickedAddress('');
    setPickedAddressTitle('');
    setMapSearchQuery('');
    setMapSearchSuggestions([]);
    // Show the picker immediately for better responsiveness
    setIsPicking(true);

    (async () => {
      let initialRegion = DEFAULT_REGION;
      try {
        const { status: existing } = await Location.getForegroundPermissionsAsync();
        const status =
          existing === 'granted'
            ? existing
            : (await Location.requestForegroundPermissionsAsync()).status;
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({});
          initialRegion = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          };
        }
      } catch (_) {}

      setInitialMapRegion(initialRegion);
      setMapRegion(initialRegion);
      setPickedCoords({ latitude: initialRegion.latitude, longitude: initialRegion.longitude });
      resolvePickedAddress({ latitude: initialRegion.latitude, longitude: initialRegion.longitude });
    })();
  };

  const resolvePickedAddress = useCallback(async (coords) => {
    const fallback = `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`;
    try {
      setResolvingAddress(true);
      const result = await reverseGeocode(coords.latitude, coords.longitude);
      if (result?.address) {
        setPickedAddress(result.address);
        const parts = result.address.split(',').map((s) => s.trim()).filter(Boolean);
        setPickedAddressTitle(parts[0] || result.address);
        return;
      }
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        const [place] = await Location.reverseGeocodeAsync(coords);
        const parts = [
          place?.name,
          place?.street,
          place?.subLocality,
          place?.city,
          place?.region,
          place?.postalCode,
        ].filter(Boolean);
        const addressText = parts.length ? parts.join(', ') : fallback;
        setPickedAddress(addressText);
        setPickedAddressTitle(parts[0] || addressText);
      } else {
        setPickedAddress(fallback);
        setPickedAddressTitle('Selected location');
      }
    } catch (error) {
      console.warn('Reverse geocode failed:', error);
      setPickedAddress(fallback);
      setPickedAddressTitle('Selected location');
    } finally {
      setResolvingAddress(false);
    }
  }, []);

  const handleWebViewMapMessage = useCallback((event) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data);
      if (typeof payload.latitude !== 'number' || typeof payload.longitude !== 'number') return;
      const center = { latitude: payload.latitude, longitude: payload.longitude };
      mapMessagePendingRef.current = center;
      if (mapMessageDebounceRef.current) clearTimeout(mapMessageDebounceRef.current);
      mapMessageDebounceRef.current = setTimeout(() => {
        mapMessageDebounceRef.current = null;
        const c = mapMessagePendingRef.current;
        if (!c) return;
        const last = lastResolvedCenterRef.current;
        const same =
          last &&
          Math.abs(last.latitude - c.latitude) < 1e-5 &&
          Math.abs(last.longitude - c.longitude) < 1e-5;
        if (same) {
          setPickedCoords(c);
          return;
        }
        lastResolvedCenterRef.current = c;
        setPickedCoords(c);
        resolvePickedAddress(c);
      }, 500);
    } catch (_) {}
  }, [resolvePickedAddress]);

  const handleMapSearchSelect = useCallback((item) => {
    setMapSearchQuery('');
    setMapSearchSuggestions([]);
    setPickedCoords({ latitude: item.latitude, longitude: item.longitude });
    setPickedAddress(item.address);
    const parts = item.address.split(',').map((s) => s.trim()).filter(Boolean);
    setPickedAddressTitle(parts[0] || item.address);
    const lat = item.latitude;
    const lng = item.longitude;
    if (getGoogleMapsKey()) {
      mapWebViewRef.current?.injectJavaScript(
        `if(window.__map){window.__map.panTo({lat:${lat},lng:${lng}});window.__map.setZoom(15);} true;`
      );
    } else {
      mapWebViewRef.current?.injectJavaScript(
        `if(window.__map){window.__map.panTo([${lat},${lng}]);window.__map.setZoom(15);} true;`
      );
    }
  }, []);

  const handleSelectSuggestion = useCallback(async (item) => {
    setSearchQuery('');
    setSearchSuggestions([]);
    const newAddress = {
      id: String(Date.now()),
      type: 'Search',
      address: item.address,
      area: '',
      city: '',
      pincode: '',
      latitude: item.latitude,
      longitude: item.longitude,
      isDefault: savedAddresses.length === 0,
    };
    const updated = [newAddress, ...savedAddresses];
    await persistAddresses(updated);
    handleSelectAddress(newAddress);
  }, [savedAddresses]);

  const handleConfirmPickedAddress = async () => {
    if (!pickedCoords) {
      Alert.alert('Pick a location', 'Move the map to place the pin on your exact location.');
      return;
    }
    setIsPicking(false);
    setPendingLocation({
      latitude: pickedCoords.latitude,
      longitude: pickedCoords.longitude,
      baseAddress: pickedAddress || `${pickedCoords.latitude}, ${pickedCoords.longitude}`,
    });
    setDetailForm({
      residenceType: 'Apartment',
      residenceTypeCustom: '',
      buildingName: '',
      flatNumber: '',
      towerBlock: '',
      landmark: '',
      label: 'Home',
      labelCustom: '',
      receiverName: '',
      receiverPhone: '+91',
    });
    setIsDetailStep(true);
  };

  const handleSaveDetailedAddress = async () => {
    if (!pendingLocation) {
      setIsDetailStep(false);
      return;
    }
    const fullAddressParts = [
      detailForm.buildingName,
      detailForm.flatNumber ? `Flat ${detailForm.flatNumber}` : '',
      detailForm.towerBlock,
      detailForm.landmark,
      pendingLocation.baseAddress,
    ].filter(Boolean);
    const fullAddress = fullAddressParts.join(', ');

    if (!fullAddress.trim()) {
      Alert.alert('Missing address', 'Please fill in at least house/building details.');
      return;
    }

    const newAddress = {
      id: String(Date.now()),
      type: detailForm.label || 'Home',
      residenceType:
        detailForm.residenceType === 'Other'
          ? (detailForm.residenceTypeCustom.trim() || 'Other')
          : (detailForm.residenceType || 'Apartment'),
      address: fullAddress,
      area: '',
      city: '',
      pincode: '',
      latitude: pendingLocation.latitude,
      longitude: pendingLocation.longitude,
      receiverName: detailForm.receiverName.trim(),
      receiverPhone: detailForm.receiverPhone.trim(),
      isDefault: savedAddresses.length === 0,
    };
    const updated = [newAddress, ...savedAddresses];
    await persistAddresses(updated);
    setIsDetailStep(false);
    setPendingLocation(null);
    setDetailForm({
      residenceType: 'Apartment',
      residenceTypeCustom: '',
      buildingName: '',
      flatNumber: '',
      towerBlock: '',
      landmark: '',
      label: 'Home',
      labelCustom: '',
      receiverName: '',
      receiverPhone: '+91',
    });
    handleSelectAddress(newAddress);
  };

  return (
    <View style={styles.container}>
      <StatusBar style={isLightMode ? 'dark' : 'light'} />
      <MinimalBackHeader navigation={navigation} />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isDetailStep ? (
          <View style={styles.addForm}>
            <Text style={styles.addFormTitle}>Add Address Details</Text>
            <Text style={styles.fieldLabel}>Residence Type*</Text>
            <View style={styles.residenceTypeRow}>
              {[
                { value: 'Individual House', icon: 'home-city-outline', label: 'Individual House' },
                { value: 'Apartment', icon: 'office-building-outline', label: 'Apartment' },
                { value: 'Villa', icon: 'home-outline', label: 'Villas' },
                { value: 'Other', icon: 'briefcase-outline', label: 'Other' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.residenceChip,
                    detailForm.residenceType === item.value && styles.residenceChipActive,
                  ]}
                  onPress={() => setDetailForm(prev => ({ ...prev, residenceType: item.value }))}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={14}
                    color={detailForm.residenceType === item.value ? '#FFFFFF' : theme.textPrimary}
                  />
                  <Text
                    style={[
                      styles.residenceChipText,
                      detailForm.residenceType === item.value && styles.residenceChipTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Building Name*</Text>
            <TextInput
              style={styles.input}
              value={detailForm.buildingName}
              onChangeText={(text) => setDetailForm(prev => ({ ...prev, buildingName: text }))}
            />
            <Text style={styles.fieldLabel}>Flat Number*</Text>
            <TextInput
              style={styles.input}
              value={detailForm.flatNumber}
              onChangeText={(text) => setDetailForm(prev => ({ ...prev, flatNumber: text }))}
            />
            <Text style={styles.fieldLabel}>Tower/Block</Text>
            <TextInput
              style={styles.input}
              value={detailForm.towerBlock}
              onChangeText={(text) => setDetailForm(prev => ({ ...prev, towerBlock: text }))}
            />
            <Text style={styles.fieldLabel}>Landmark</Text>
            <TextInput
              style={styles.input}
              value={detailForm.landmark}
              onChangeText={(text) => setDetailForm(prev => ({ ...prev, landmark: text }))}
            />
            {detailForm.residenceType === 'Other' && (
              <>
                <Text style={styles.fieldLabel}>Custom Residence Type*</Text>
                <TextInput
                  style={styles.input}
                  value={detailForm.residenceTypeCustom}
                  onChangeText={(text) => setDetailForm(prev => ({ ...prev, residenceTypeCustom: text }))}
                />
              </>
            )}

            <Text style={styles.fieldLabel}>Save as*</Text>
            <View style={styles.typeRow}>
              {[
                { value: 'Home', icon: 'home-outline' },
                { value: 'Work', icon: 'briefcase-outline' },
                { value: 'Other', icon: 'map-marker-outline' },
              ].map(item => (
                <TouchableOpacity
                  key={item.value}
                  style={[styles.typeChip, detailForm.label === item.value && styles.typeChipActive]}
                  onPress={() => setDetailForm(prev => ({ ...prev, label: item.value }))}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={14}
                    color={detailForm.label === item.value ? '#FFFFFF' : theme.textPrimary}
                  />
                  <Text style={[styles.typeChipText, detailForm.label === item.value && styles.typeChipTextActive]}>
                    {item.value}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Phone Number*</Text>
            <TextInput
              style={styles.input}
              value={detailForm.receiverPhone}
              onChangeText={(text) => setDetailForm(prev => ({ ...prev, receiverPhone: text }))}
              keyboardType="phone-pad"
            />
            <View style={styles.formActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setIsDetailStep(false)}>
                <Text style={styles.cancelButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveDetailedAddress}>
                <Text style={styles.saveButtonText}>Save Address</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {/* Current Location Option */}
            <TouchableOpacity 
              style={styles.currentLocationCard}
              onPress={handleUseCurrentLocation}
              activeOpacity={0.8}
            >
              <View style={styles.currentLocationIconContainer}>
                <MaterialCommunityIcons name="crosshairs-gps" size={24} color={theme.accent} />
              </View>
              <View style={styles.currentLocationContent}>
                <Text style={styles.currentLocationTitle}>Use Current Location</Text>
                <Text style={styles.currentLocationSubtitle}>Get your current location automatically</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={theme.textSecondary} />
            </TouchableOpacity>

            {/* Map Picker Option */}
            <TouchableOpacity
              style={styles.currentLocationCard}
              onPress={handleOpenMapPicker}
              activeOpacity={0.8}
            >
              <View style={styles.currentLocationIconContainer}>
                <MaterialCommunityIcons name="map-marker-radius" size={24} color={theme.accent} />
              </View>
              <View style={styles.currentLocationContent}>
                <Text style={styles.currentLocationTitle}>Add Address</Text>
                <Text style={styles.currentLocationSubtitle}>Add a new address using the map</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={theme.textSecondary} />
            </TouchableOpacity>

            {isAdding && (
              <View style={styles.addForm}>
                <Text style={styles.addFormTitle}>Add Address</Text>
                <View style={styles.typeRow}>
                  {['Home', 'Work', 'Other'].map(type => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.typeChip, form.type === type && styles.typeChipActive]}
                      onPress={() => setForm(prev => ({ ...prev, type }))}
                    >
                      <Text style={[styles.typeChipText, form.type === type && styles.typeChipTextActive]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Address"
                  placeholderTextColor={theme.textSecondary}
                  value={form.address}
                  onChangeText={(text) => setForm(prev => ({ ...prev, address: text }))}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Area"
                  placeholderTextColor={theme.textSecondary}
                  value={form.area}
                  onChangeText={(text) => setForm(prev => ({ ...prev, area: text }))}
                />
                <View style={styles.formRow}>
                  <TextInput
                    style={[styles.input, styles.halfInput]}
                    placeholder="City"
                    placeholderTextColor={theme.textSecondary}
                    value={form.city}
                    onChangeText={(text) => setForm(prev => ({ ...prev, city: text }))}
                  />
                  <TextInput
                    style={[styles.input, styles.halfInput]}
                    placeholder="Pincode"
                    placeholderTextColor={theme.textSecondary}
                    value={form.pincode}
                    onChangeText={(text) => setForm(prev => ({ ...prev, pincode: text }))}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.formActions}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setIsAdding(false)}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton} onPress={handleSaveAddress}>
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Saved Addresses Section */}
            <View style={styles.savedAddressesSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Saved Addresses</Text>
                <TouchableOpacity onPress={handleAddNewAddress}>
                  <MaterialCommunityIcons name="plus-circle" size={24} color={theme.accent} />
                </TouchableOpacity>
              </View>

              {savedAddresses.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons name="map-marker-off" size={64} color={theme.textSecondary} />
                  <Text style={styles.emptyStateText}>No saved addresses</Text>
                  <Text style={styles.emptyStateSubtext}>Add an address to get started</Text>
                  <TouchableOpacity 
                    style={styles.addAddressButton}
                    onPress={handleAddNewAddress}
                  >
                    <Text style={styles.addAddressButtonText}>Add Address</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                savedAddresses.map((address) => (
                  <TouchableOpacity
                    key={address.id}
                    style={styles.addressCard}
                    onPress={() => handleSelectAddress(address)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.addressCardContent}>
                      <View style={styles.addressHeader}>
                        <View style={styles.addressTypeContainer}>
                          <MaterialCommunityIcons 
                            name={address.type === 'Home' ? 'home' : address.type === 'Work' ? 'briefcase' : 'map-marker'} 
                            size={20} 
                            color={theme.accent} 
                          />
                          <Text style={styles.addressType}>{address.type}</Text>
                          {address.isDefault && (
                            <View style={styles.defaultBadge}>
                              <Text style={styles.defaultBadgeText}>Default</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.addressActions}>
                          <TouchableOpacity
                            onPress={() => handleSetDefault(address.id)}
                            style={styles.actionButton}
                          >
                            <MaterialCommunityIcons 
                              name={address.isDefault ? 'star' : 'star-outline'} 
                              size={20} 
                              color={address.isDefault ? "#FFD700" : theme.textSecondary} 
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeleteAddress(address.id)}
                            style={styles.actionButton}
                          >
                            <MaterialCommunityIcons name="delete-outline" size={20} color="#FF3B30" />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <Text style={styles.addressText}>{address.address}</Text>
                      <Text style={styles.addressDetails}>
                        {address.area}, {address.city} - {address.pincode}
                      </Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={24} color={theme.textSecondary} />
                  </TouchableOpacity>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      <Modal
        visible={isPicking}
        animationType="slide"
        onRequestClose={() => setIsPicking(false)}
        onShow={() => {
          if (mapModalShowTimeoutRef.current) clearTimeout(mapModalShowTimeoutRef.current);
          mapModalShowTimeoutRef.current = setTimeout(() => {
            mapModalShowTimeoutRef.current = null;
            setMapModalReady(true);
          }, 300);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsPicking(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Your Location</Text>
            <View style={styles.modalHeaderRight} />
          </View>

          <View style={styles.mapSearchBar}>
            <MaterialCommunityIcons name="magnify" size={20} color={theme.textSecondary} style={styles.mapSearchIcon} />
            <TextInput
              style={styles.mapSearchInput}
              placeholder="Search for apartment, street name..."
              placeholderTextColor={theme.textSecondary}
              value={mapSearchQuery}
              onChangeText={setMapSearchQuery}
            />
            {mapSearchLoading && <ActivityIndicator size="small" color={theme.accent} />}
            {mapSearchQuery.length > 0 && !mapSearchLoading && (
              <TouchableOpacity onPress={() => setMapSearchQuery('')}>
                <MaterialCommunityIcons name="close-circle" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          {mapSearchSuggestions.length > 0 ? (
            <View style={styles.mapSuggestionsList}>
              <FlatList
                data={mapSearchSuggestions.slice(0, 4)}
                keyExtractor={(item) => item.placeId || item.address}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.mapSuggestionRow}
                    onPress={() => handleMapSearchSelect(item)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="map-marker" size={18} color={theme.textSecondary} />
                    <Text style={styles.mapSuggestionText} numberOfLines={2}>{item.address}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          ) : mapSearchQuery.trim().length > 0 && !mapSearchLoading ? (
            <View style={styles.mapSuggestionsList}>
              <View style={styles.mapSuggestionRow}>
                <MaterialCommunityIcons name="alert-circle-outline" size={18} color={theme.textSecondary} />
                <Text style={styles.mapSuggestionText} numberOfLines={2}>
                  No results. Check your address or API key.
                </Text>
              </View>
            </View>
          ) : null}

          <View style={styles.mapWrapper}>
            {mapModalReady ? (
              <WebView
                ref={mapWebViewRef}
                key="map-picker"
                style={styles.map}
                source={mapSource}
                javaScriptEnabled
                domStorageEnabled
                onMessage={handleWebViewMapMessage}
                scrollEnabled={false}
              />
            ) : (
              <View style={[styles.map, styles.mapPlaceholder]}>
                <ActivityIndicator size="large" color={theme.accent} />
              </View>
            )}
            <View style={styles.centerPinOverlay} pointerEvents="none">
              <View style={styles.tooltipBubble}>
                <Text style={styles.tooltipTitle}>Order will be delivered here</Text>
                <Text style={styles.tooltipSub}>Move the map to set your location</Text>
              </View>
              <View style={styles.centerPin}>
                <MaterialCommunityIcons name="map-marker" size={48} color="#E53935" />
              </View>
            </View>
          </View>

          <View style={styles.mapFooter}>
            <View style={styles.mapFooterCard}>
              {resolvingAddress ? (
                <View style={styles.resolvingRow}>
                  <ActivityIndicator size="small" color={theme.textSecondary} />
                  <Text style={styles.mapFooterAddress}>Finding address…</Text>
                </View>
              ) : (
                <>
                  {pickedAddressTitle ? (
                    <Text style={styles.mapFooterTitle} numberOfLines={1}>{pickedAddressTitle}</Text>
                  ) : null}
                  <Text style={styles.mapFooterAddress} numberOfLines={2}>
                    {pickedAddress || 'Move the map to set your location'}
                  </Text>
                </>
              )}
              <TouchableOpacity style={styles.confirmLocationButton} onPress={handleConfirmPickedAddress} activeOpacity={0.9}>
                <Text style={styles.confirmLocationButtonText}>Confirm Location</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = theme => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.textPrimary,
    paddingVertical: 16,
  },
  clearButton: {
    padding: 4,
  },
  searchSpinner: {
    marginLeft: 8,
  },
  suggestionsList: {
    marginTop: 8,
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    maxHeight: 220,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.cardBorder,
    gap: 10,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: theme.textPrimary,
  },
  currentLocationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  currentLocationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  currentLocationContent: {
    flex: 1,
  },
  currentLocationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 4,
  },
  currentLocationSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  savedAddressesSection: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.textPrimary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  addAddressButton: {
    backgroundColor: theme.accent,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  addAddressButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  addressCardContent: {
    flex: 1,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressType: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.accent,
  },
  defaultBadge: {
    backgroundColor: theme.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.accent,
  },
  addressActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
  addressText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 4,
  },
  addressDetails: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  addForm: {
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  addFormTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 8,
    marginTop: 6,
  },
  residenceTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  residenceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    backgroundColor: theme.cardBackground,
  },
  residenceChipActive: {
    backgroundColor: '#111111',
    borderColor: '#111111',
  },
  residenceChipText: {
    fontSize: 12,
    color: theme.textPrimary,
    fontWeight: '600',
  },
  residenceChipTextActive: {
    color: '#FFFFFF',
  },
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 8,
    marginTop: 12,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    backgroundColor: theme.cardBackground,
  },
  typeChipActive: {
    backgroundColor: '#111111',
    borderColor: '#111111',
  },
  typeChipText: {
    fontSize: 12,
    color: theme.textPrimary,
    fontWeight: '600',
  },
  typeChipTextActive: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: theme.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: theme.textPrimary,
    marginBottom: 10,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 4,
  },
  cancelButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  cancelButtonText: {
    color: theme.textSecondary,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: theme.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  saveButtonText: {
    color: theme.onAccent,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.cardBorder,
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
    textAlign: 'center',
  },
  modalHeaderRight: {
    width: 40,
  },
  mapSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.cardBackground,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    minHeight: 48,
  },
  mapSearchIcon: {
    marginRight: 10,
  },
  mapSearchInput: {
    flex: 1,
    fontSize: 15,
    color: theme.textPrimary,
    paddingVertical: 12,
  },
  mapSuggestionsList: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    maxHeight: 200,
  },
  mapSuggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.cardBorder,
    gap: 10,
  },
  mapSuggestionText: {
    flex: 1,
    fontSize: 14,
    color: theme.textPrimary,
  },
  mapWrapper: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  centerPinOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tooltipBubble: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 4,
    maxWidth: 260,
    alignItems: 'center',
  },
  tooltipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  tooltipSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
  },
  centerPin: {
    marginTop: -4,
  },
  mapFooter: {
    padding: 16,
    paddingBottom: 24,
    backgroundColor: theme.background,
    borderTopWidth: 1,
    borderTopColor: theme.cardBorder,
  },
  mapFooterCard: {
    backgroundColor: theme.cardBackground,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  mapFooterTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 4,
  },
  mapFooterAddress: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 14,
    lineHeight: 20,
  },
  resolvingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  confirmLocationButton: {
    backgroundColor: '#E91E63',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmLocationButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
