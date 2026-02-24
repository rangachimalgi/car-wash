import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import { useTheme } from '../theme/ThemeContext';
import { getOrderById } from '../services/orderApi';

const FALLBACK_COORDS = { latitude: 0, longitude: 0 };

const getGoogleMapsKey = () => (process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '').trim();

// Data URLs for marker icons (bike = employee, pin = customer address)
const BIKE_ICON_DATA =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%231976D2" stroke="%23fff" stroke-width="1"><path d="M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM5 12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm14 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-4.5 2.2l-1.4-2.2-2.9 1.2 1.4 2.2 2.9-1.2zm-5.5 0l-2.9-1.2-1.4 2.2 2.9 1.2 1.4-2.2z"/></svg>'
  );
const PIN_ICON_DATA =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23E53935" stroke="%23fff" stroke-width="1.2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>'
  );

function getGoogleMapHtmlForTracking(centerLat, centerLng, employeeLat, employeeLng, customerLat, customerLng, apiKey) {
  const key = apiKey.replace(/"/g, '&quot;');
  const hasCustomer = typeof customerLat === 'number' && typeof customerLng === 'number';
  const bikeIcon = BIKE_ICON_DATA.replace(/"/g, '&quot;');
  const pinIcon = PIN_ICON_DATA.replace(/"/g, '&quot;');
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <style>html, body, #map { height: 100%; margin: 0; padding: 0; }</style>
</head>
<body>
  <div id="map"></div>
  <script>
    var employeeMarker;
    var directionsRenderer;
    var directionsService;
    var map;
    var destLat = ${hasCustomer ? customerLat : 'null'};
    var destLng = ${hasCustomer ? customerLng : 'null'};

    function sendEta(minutes, text) {
      if (window.ReactNativeWebView && text)
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'eta', minutes: minutes, text: text }));
    }

    function drawRoute(originLat, originLng) {
      if (destLat == null || destLng == null) return;
      directionsService.route(
        {
          origin: { lat: originLat, lng: originLng },
          destination: { lat: destLat, lng: destLng },
          travelMode: google.maps.TravelMode.DRIVING
        },
        function(result, status) {
          if (status === 'OK') {
            directionsRenderer.setDirections(result);
            var leg = result.routes[0] && result.routes[0].legs[0];
            if (leg && leg.duration) {
              sendEta(leg.duration.value / 60, leg.duration.text);
            }
          }
        }
      );
    }

    function initMap() {
      map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: ${centerLat}, lng: ${centerLng} },
        zoom: 15,
        mapTypeId: 'roadmap',
        gestureHandling: 'greedy',
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true
      });

      directionsService = new google.maps.DirectionsService();
      directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true,
        polylineOptions: { strokeColor: '#5C9EED', strokeWeight: 6, strokeOpacity: 0.95 }
      });

      employeeMarker = new google.maps.Marker({
        position: { lat: ${employeeLat}, lng: ${employeeLng} },
        map: map,
        icon: { url: "${bikeIcon}", scaledSize: new google.maps.Size(40, 40), anchor: new google.maps.Point(20, 20) },
        title: 'On the way'
      });

      ${hasCustomer
        ? `
      new google.maps.Marker({
        position: { lat: ${customerLat}, lng: ${customerLng} },
        map: map,
        icon: { url: "${pinIcon}", scaledSize: new google.maps.Size(36, 36), anchor: new google.maps.Point(18, 36) },
        title: 'Your address'
      });
      drawRoute(${employeeLat}, ${employeeLng});
      var bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: ${employeeLat}, lng: ${employeeLng} });
      bounds.extend({ lat: ${customerLat}, lng: ${customerLng} });
      map.fitBounds(bounds, { top: 48, right: 24, bottom: 24, left: 24 });
      `
        : ''}

      window.updateMarker = function(lat, lng) {
        var pos = { lat: lat, lng: lng };
        employeeMarker.setPosition(pos);
        map.panTo(pos);
        if (destLat != null && destLng != null) drawRoute(lat, lng);
      };
    }
  </script>
  <script async defer src="https://maps.googleapis.com/maps/api/js?key=${key}&callback=initMap"></script>
</body>
</html>`;
}

export default function EmployeeLiveLocationScreen({ route }) {
  const orderId = route?.params?.orderId;
  const { theme, isLightMode } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [etaText, setEtaText] = useState(null);
  const webViewRef = useRef(null);

  const handleWebViewMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'eta' && data.text) setEtaText(data.text);
    } catch (_) {}
  }, []);

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
    const empLat = hasLocation ? latitude : centerLat;
    const empLng = hasLocation ? longitude : centerLng;
    const key = getGoogleMapsKey();
    if (key) {
      return getGoogleMapHtmlForTracking(
        centerLat,
        centerLng,
        empLat,
        empLng,
        hasCustomerLocation ? customerLat : undefined,
        hasCustomerLocation ? customerLng : undefined,
        key
      );
    }
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
  }, [hasLocation, latitude, longitude, hasCustomerLocation, customerLat, customerLng]);

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
        <View style={styles.headerRow}>
          <Text style={styles.subtitle}>{order?.status || 'In Progress'}</Text>
          {etaText ? <Text style={styles.etaText}>• {etaText}</Text> : null}
        </View>
        <Text style={styles.metaText}>
          {hasLocation
            ? `Route to your address${lastUpdated ? ` • Updated ${lastUpdated}` : ''}`
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
          onMessage={handleWebViewMessage}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  subtitle: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  etaText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.accent,
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
