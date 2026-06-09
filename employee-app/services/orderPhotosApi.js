import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

/**
 * Upload before/after photos via fetch (not axios).
 * React Native must set multipart/form-data + boundary itself.
 */
export async function uploadOrderPhotos({ orderId, employeeId, type, assets }) {
  if (!orderId || !type || !assets?.length) {
    throw new Error('Missing upload data');
  }

  const token = await AsyncStorage.getItem('employeeAuthToken');
  const formData = new FormData();
  formData.append('type', type);
  assets.forEach((asset, i) => {
    formData.append('photos', {
      uri: asset.uri,
      name: `${type}-${i}.jpg`,
      type: asset.mimeType || 'image/jpeg',
    });
  });

  const url = employeeId
    ? `${API_BASE_URL}/orders/${orderId}/photos?employeeId=${encodeURIComponent(employeeId)}`
    : `${API_BASE_URL}/orders/${orderId}/photos`;

  const res = await fetch(url, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.message || `Upload failed (${res.status})`);
  }
  return data;
}
