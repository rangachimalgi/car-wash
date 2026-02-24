import React, { useEffect, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import api, { API_BASE_URL } from '../services/api';

export default function DocumentUploadScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [aadharUri, setAadharUri] = useState(null);
  const [panUri, setPanUri] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/employees/me/documents');
        if (mounted && res.data?.data?.documentsUploaded) {
          navigation.replace('MainTabs');
          return;
        }
      } catch (err) {
        if (mounted) console.warn('Document status check failed:', err?.message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [navigation]);

  const pickImage = async (type) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to photos to upload documents.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });
    if (result.canceled) return;
    const uri = result.assets?.[0]?.uri;
    if (uri) {
      if (type === 'aadhar') setAadharUri(uri);
      else setPanUri(uri);
    }
  };

  const handleContinue = async () => {
    if (!aadharUri || !panUri) {
      Alert.alert('Required', 'Please upload both Aadhaar and PAN card.');
      return;
    }
    setUploading(true);
    try {
      const token = await AsyncStorage.getItem('employeeAuthToken');
      if (!token) {
        Alert.alert('Session expired', 'Please log in again.');
        setUploading(false);
        return;
      }
      const formData = new FormData();
      formData.append('aadhar', {
        uri: aadharUri,
        name: 'aadhar.jpg',
        type: 'image/jpeg',
      });
      formData.append('pan', {
        uri: panUri,
        name: 'pan.jpg',
        type: 'image/jpeg',
      });
      // Use fetch so we never set Content-Type; React Native sets multipart/form-data with boundary
      const res = await fetch(`${API_BASE_URL}/employees/me/documents`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || `Upload failed (${res.status})`);
      }
      if (!data.success) {
        throw new Error(data.message || 'Upload failed');
      }
      navigation.replace('MainTabs');
    } catch (err) {
      console.error('Upload failed:', err);
      Alert.alert(
        'Upload failed',
        err.message || 'Could not upload documents. Please try again.'
      );
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: 24 + insets.top }]}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#2F8CF4" />
        <Text style={styles.loadingText}>Checking documents…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: 24 + insets.top }]}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Upload Documents</Text>
      <Text style={styles.subtitle}>Please upload your Aadhaar and PAN card (one-time)</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Aadhaar Card</Text>
        <Text style={styles.cardHint}>Front and back (if applicable)</Text>
        {aadharUri ? (
          <View style={styles.previewWrap}>
            <Image source={{ uri: aadharUri }} style={styles.preview} resizeMode="cover" />
            <TouchableOpacity style={styles.changeBtn} onPress={() => pickImage('aadhar')}>
              <Text style={styles.changeBtnText}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => pickImage('aadhar')}
          >
            <Text style={styles.uploadButtonText}>Upload Aadhaar</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>PAN Card</Text>
        <Text style={styles.cardHint}>Clear, readable photo</Text>
        {panUri ? (
          <View style={styles.previewWrap}>
            <Image source={{ uri: panUri }} style={styles.preview} resizeMode="cover" />
            <TouchableOpacity style={styles.changeBtn} onPress={() => pickImage('pan')}>
              <Text style={styles.changeBtnText}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => pickImage('pan')}
          >
            <Text style={styles.uploadButtonText}>Upload PAN</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, (!aadharUri || !panUri || uploading) && styles.primaryButtonDisabled]}
        onPress={handleContinue}
        disabled={!aadharUri || !panUri || uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryButtonText}>Continue</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
    paddingHorizontal: 20,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  cardHint: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  uploadButton: {
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#2F5CF4',
    fontWeight: '600',
  },
  previewWrap: {
    marginTop: 4,
  },
  preview: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  changeBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  changeBtnText: {
    color: '#2F5CF4',
    fontWeight: '600',
    fontSize: 14,
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: '#2F8CF4',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
