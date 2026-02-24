/**
 * Google Geocoding API helpers. Uses EXPO_PUBLIC_GOOGLE_MAPS_API_KEY.
 * Enable "Geocoding API" for this key in Google Cloud Console.
 */

import { Alert } from 'react-native';

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';
const GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const AUTOCOMPLETE_URL = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';

// Bias Places results around Bangalore, India
const BANGALORE_LOCATION = '12.9716,77.5946';
const BANGALORE_RADIUS_METERS = 40000; // ~40km around city center

export async function searchAddress(query) {
  if (!query?.trim() || !API_KEY) return [];
  try {
    // First hit Places Autocomplete to get smart predictions
    const autoRes = await fetch(
      `${AUTOCOMPLETE_URL}?input=${encodeURIComponent(
        query.trim()
      )}&key=${API_KEY}&components=country:IN&location=${BANGALORE_LOCATION}&radius=${BANGALORE_RADIUS_METERS}`
    );
    const autoData = await autoRes.json();

    if (autoData.status !== 'OK' && autoData.status !== 'ZERO_RESULTS') {
      Alert.alert(
        'Address search error',
        `Places status: ${autoData.status || 'UNKNOWN'}`
      );
      return [];
    }

    const predictions = (autoData.predictions || []).slice(0, 6);
    if (!predictions.length) return [];

    // For each prediction, resolve to lat/lng via Geocoding with place_id
    const detailed = await Promise.all(
      predictions.map(async (p) => {
        try {
          const geoRes = await fetch(
            `${GEOCODE_URL}?place_id=${encodeURIComponent(p.place_id)}&key=${API_KEY}`
          );
          const geoData = await geoRes.json();
          if (geoData.status !== 'OK' || !geoData.results?.[0]) return null;
          const r = geoData.results[0];
          return {
            address: p.description,
            latitude: r.geometry?.location?.lat,
            longitude: r.geometry?.location?.lng,
            placeId: p.place_id,
          };
        } catch {
          return null;
        }
      })
    );

    return detailed.filter(Boolean);
  } catch (e) {
    console.warn('Places search error:', e);
    return [];
  }
}

export async function reverseGeocode(latitude, longitude) {
  if (typeof latitude !== 'number' || typeof longitude !== 'number' || !API_KEY) {
    return null;
  }
  try {
    const res = await fetch(
      `${GEOCODE_URL}?latlng=${latitude},${longitude}&key=${API_KEY}`
    );
    const data = await res.json();
    if (data.status !== 'OK' || !data.results?.[0]) return null;
    const r = data.results[0];
    return {
      address: r.formatted_address,
      latitude: r.geometry?.location?.lat,
      longitude: r.geometry?.location?.lng,
    };
  } catch (e) {
    console.warn('Reverse geocode error:', e);
    return null;
  }
}
