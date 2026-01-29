import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import { useTheme } from '../theme/ThemeContext';
import { getOrderById } from '../services/orderApi';

const FALLBACK_COORDS = { latitude: 0, longitude: 0 };

export default function EmployeeLiveLocationScreen({ route }) {
  const orderId = route?.params?.orderId;
  const { theme, isLightMode } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const webViewRef = useRef(null);

  const fetchOrder = useCallback(async (showLoading = false) => {
    if (!orderId) return;
    if (showLoading) setLoading(true);
    try {
      const response = await getOrderById(orderId);
      if (response?.success) {
        setOrder(response.data);
        setError('');
      } else {
        setError('Unable to load tracking data.');
      }
    } catch (err) {
      setError('Unable to load tracking data.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [orderId]);

  useFocusEffect(
    useCallback(() => {
      let intervalId;
      fetchOrder(true);
      intervalId = setInterval(() => fetchOrder(false), 8000);
      return () => {
        if (intervalId) clearInterval(intervalId);
      };
    }, [fetchOrder])
  );

  const location = order?.employeeLocation;
  const latitude = location?.latitude;
  const longitude = location?.longitude;
  const hasLocation = typeof latitude === 'number' && typeof longitude === 'number';
  const customerLat = order?.customer?.latitude;
  const customerLng = order?.customer?.longitude;
  const hasCustomerLocation = typeof customerLat === 'number' && typeof customerLng === 'number';
  const hasFallbackCustomer = false;
  const lastUpdated = location?.updatedAt ? new Date(location.updatedAt).toLocaleTimeString() : '';
  const mapHtml = useMemo(() => {
    const centerLat = hasLocation
      ? latitude
      : (hasCustomerLocation ? customerLat : FALLBACK_COORDS.latitude);
    const centerLng = hasLocation
      ? longitude
      : (hasCustomerLocation ? customerLng : FALLBACK_COORDS.longitude);
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no" />
          <link
            rel="stylesheet"
            href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
            integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
            crossorigin=""
          />
          <style>
            html, body, #map { height: 100%; margin: 0; padding: 0; }
            .bike-icon {
              font-size: 28px;
              line-height: 28px;
              text-align: center;
              filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.35));
            }
            .pin-icon {
              font-size: 30px;
              line-height: 30px;
              text-align: center;
              filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.45));
            }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script
            src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
            integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
            crossorigin=""
          ></script>
          <script>
            const map = L.map('map').setView([${centerLat}, ${centerLng}], 15);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
            }).addTo(map);
            const bikeIcon = L.divIcon({
              className: 'bike-icon',
              html: '🚗',
              iconSize: [32, 32],
              iconAnchor: [16, 16],
            });
            const marker = L.marker([${centerLat}, ${centerLng}], { icon: bikeIcon }).addTo(map);
            ${hasCustomerLocation
              ? `const customerIcon = L.divIcon({ className: 'pin-icon', html: '📍', iconSize: [32, 32], iconAnchor: [16, 28] });
                 L.marker([${customerLat}, ${customerLng}], { icon: customerIcon }).addTo(map);`
              : ''}
            window.updateMarker = (lat, lng) => {
              marker.setLatLng([lat, lng]);
              map.setView([lat, lng], map.getZoom());
            };
          </script>
        </body>
      </html>
    `;
  }, [hasLocation, latitude, longitude]);

  useEffect(() => {
    if (!hasLocation || !webViewRef.current) return;
    const script = `window.updateMarker && window.updateMarker(${latitude}, ${longitude}); true;`;
    webViewRef.current.injectJavaScript(script);
  }, [hasLocation, latitude, longitude]);

  return (
    <View style={styles.container}>
      <StatusBar style={isLightMode ? 'dark' : 'light'} />
      <View style={styles.header}>
        <Text style={styles.title}>Live Location</Text>
        <Text style={styles.subtitle}>{order?.status || 'In Progress'}</Text>
        <Text style={styles.metaText}>
          {hasLocation
            ? `Emp: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}${lastUpdated ? ` • ${lastUpdated}` : ''}`
            : 'Employee location not received yet'}
        </Text>
      </View>

      {loading && !order ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={styles.loadingText}>Loading location…</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : !hasLocation ? (
        <View style={styles.centerContent}>
          <Text style={styles.waitingText}>Waiting for employee location…</Text>
          <Text style={styles.waitingSubText}>This updates every few seconds.</Text>
        </View>
      ) : (
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: mapHtml }}
          javaScriptEnabled
          domStorageEnabled
          style={styles.map}
        />
      )}
    </View>
  );
}

const createStyles = theme => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  metaText: {
    marginTop: 6,
    fontSize: 12,
    color: theme.textSecondary,
  },
  map: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: theme.textSecondary,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
  },
  waitingText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
    textAlign: 'center',
  },
  waitingSubText: {
    marginTop: 6,
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
  },
});
