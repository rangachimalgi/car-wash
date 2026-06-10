import React, { useMemo } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PHOTO_SLOTS } from '../utils/servicePhotoSlots';
import { resolveUploadUrl } from '../utils/resolveUploadUrl';

const BLUE = '#2563EB';

export default function ServicePhotoGrid({
  photos,
  uploadingSlot = null,
  onSlotPress,
  disabled = false,
}) {
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.grid}>
      {PHOTO_SLOTS.map((slot) => {
        const uri = photos?.[slot.key] || '';
        const isUploading = uploadingSlot === slot.key;

        return (
          <TouchableOpacity
            key={slot.key}
            style={styles.slot}
            onPress={() => onSlotPress?.(slot.key)}
            disabled={disabled || isUploading}
            activeOpacity={0.85}
          >
            {uri ? (
              <Image source={{ uri: resolveUploadUrl(uri) }} style={styles.image} resizeMode="cover" />
            ) : (
              <View style={styles.placeholder}>
                {isUploading ? (
                  <ActivityIndicator size="small" color={BLUE} />
                ) : (
                  <>
                    <MaterialCommunityIcons name="camera-plus-outline" size={20} color="#94A3B8" />
                    <Text style={styles.placeholderHint}>
                      {slot.required ? 'Required' : 'Add photo'}
                    </Text>
                  </>
                )}
              </View>
            )}
            <View style={styles.label}>
              <Text style={styles.labelText} numberOfLines={1}>
                {slot.label}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    slot: {
      width: '48%',
      aspectRatio: 1.15,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: '#E2E8F0',
      position: 'relative',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    placeholder: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      backgroundColor: '#F8FAFC',
      borderWidth: 1,
      borderColor: '#E2E8F0',
      borderStyle: 'dashed',
      borderRadius: 12,
      padding: 8,
    },
    placeholderHint: {
      fontSize: 9,
      color: '#94A3B8',
      fontWeight: '600',
      textAlign: 'center',
    },
    label: {
      position: 'absolute',
      bottom: 6,
      left: 6,
      right: 6,
      backgroundColor: 'rgba(15, 23, 42, 0.7)',
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 3,
    },
    labelText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '600',
      textAlign: 'center',
    },
  });
