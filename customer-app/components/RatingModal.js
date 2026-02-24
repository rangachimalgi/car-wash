import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

const STAR_COUNT = 5;

export default function RatingModal({ visible, onClose, onSubmit, serviceName }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating < 1 || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({ rating, review: review.trim() });
      setRating(0);
      setReview('');
      onClose();
    } catch (err) {
      // Caller may show alert
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setRating(0);
      setReview('');
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.centered}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.card}>
              <Text style={styles.title}>How was your service?</Text>
              {serviceName ? (
                <Text style={styles.subtitle} numberOfLines={1}>{serviceName}</Text>
              ) : null}

              <View style={styles.starsRow}>
                {Array.from({ length: STAR_COUNT }, (_, i) => i + 1).map((value) => (
                  <TouchableOpacity
                    key={value}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={() => setRating(value)}
                    style={styles.starButton}
                  >
                    <MaterialCommunityIcons
                      name={value <= rating ? 'star' : 'star-outline'}
                      size={40}
                      color={value <= rating ? '#FFC107' : theme.textSecondary}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Add a comment (optional)"
                placeholderTextColor={theme.textSecondary}
                value={review}
                onChangeText={setReview}
                multiline
                maxLength={500}
                editable={!submitting}
              />

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleClose}
                  disabled={submitting}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitButton, rating < 1 && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={rating < 1 || submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <Text style={styles.submitButtonText}>Submit</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    centered: {
      width: '100%',
      maxWidth: 360,
    },
    card: {
      backgroundColor: theme.cardBackground,
      borderRadius: 20,
      padding: 24,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.textPrimary,
      textAlign: 'center',
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
    },
    starsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      marginBottom: 20,
    },
    starButton: {
      padding: 4,
    },
    input: {
      backgroundColor: theme.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: theme.textPrimary,
      minHeight: 80,
      textAlignVertical: 'top',
      marginBottom: 20,
    },
    actions: {
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'flex-end',
    },
    cancelButton: {
      paddingVertical: 12,
      paddingHorizontal: 20,
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    submitButton: {
      backgroundColor: theme.accent,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 12,
      minWidth: 100,
      alignItems: 'center',
      justifyContent: 'center',
    },
    submitButtonDisabled: {
      opacity: 0.5,
    },
    submitButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#000',
    },
  });
