import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DocumentUploadScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const handleUpload = label => {
    Alert.alert('Upload', `${label} upload clicked (no upload yet).`);
  };

  return (
    <View style={[styles.container, { paddingTop: 24 + insets.top }]}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Upload Documents</Text>
      <Text style={styles.subtitle}>Please upload your Aadhaar and PAN card</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Aadhaar Card</Text>
        <Text style={styles.cardHint}>Front and back (if applicable)</Text>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => handleUpload('Aadhaar')}
        >
          <Text style={styles.uploadButtonText}>Upload Aadhaar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>PAN Card</Text>
        <Text style={styles.cardHint}>Clear, readable photo</Text>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => handleUpload('PAN')}
        >
          <Text style={styles.uploadButtonText}>Upload PAN</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => navigation.navigate('MainTabs')}
      >
        <Text style={styles.primaryButtonText}>Continue</Text>
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
  primaryButton: {
    marginTop: 8,
    backgroundColor: '#2F8CF4',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
