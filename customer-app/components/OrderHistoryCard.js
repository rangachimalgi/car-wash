import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { wooshGreen } from '../theme/wooshGreen';

export default function OrderHistoryCard({ order, onPress, onReorder, onRate }) {
  const { theme, isLightMode } = useTheme();
  const styles = useMemo(() => createStyles(theme, isLightMode), [theme, isLightMode]);
  const isCompleted = order.status === 'Completed';
  const hasRating = typeof order.rating === 'number' && order.rating >= 1 && order.rating <= 5;
  const accent = isLightMode ? wooshGreen.primary : theme.accent;

  const handleMenu = () => {
    Alert.alert(
      order.serviceName,
      `${order.serviceType}${order.time ? `\n${order.time}` : ''}\n${order.dateTimeLine}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity activeOpacity={0.92} onPress={() => onPress?.(order)}>
        <View style={styles.topRow}>
          <View style={styles.topTextCol}>
            <Text style={styles.title} numberOfLines={2}>
              {order.serviceName}
            </Text>
            <Text style={styles.metaLine} numberOfLines={1}>
              {order.dateTimeLine}
            </Text>
          </View>
          <TouchableOpacity style={styles.menuBtn} onPress={handleMenu} hitSlop={8}>
            <MaterialCommunityIcons name="dots-vertical" size={22} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onReorder?.(order)} activeOpacity={0.7}>
          <Text style={[styles.actionText, { color: accent }]}>Reorder</Text>
        </TouchableOpacity>
        <View style={styles.actionDivider} />
        {isCompleted && !hasRating ? (
          <TouchableOpacity style={styles.actionBtn} onPress={() => onRate?.(order)} activeOpacity={0.7}>
            <Text style={[styles.actionText, { color: accent }]}>Rate order</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.actionBtn}>
            <Text style={[styles.actionTextMuted, hasRating && styles.ratedText]}>
              {hasRating ? `Rated ${order.rating} ★` : '—'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const createStyles = (theme, isLightMode) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.cardBackground,
      borderRadius: 16,
      marginBottom: 14,
      padding: 14,
      borderWidth: isLightMode ? 0 : 1,
      borderColor: theme.cardBorder,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isLightMode ? 0.06 : 0.2,
      shadowRadius: 8,
      elevation: isLightMode ? 2 : 4,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    topTextCol: {
      flex: 1,
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.textPrimary,
      marginBottom: 4,
    },
    metaLine: {
      fontSize: 13,
      color: theme.textSecondary,
    },
    menuBtn: {
      padding: 4,
      marginLeft: 8,
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: theme.divider,
      paddingTop: 12,
    },
    actionBtn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 4,
    },
    actionDivider: {
      width: 1,
      height: 22,
      backgroundColor: theme.divider,
    },
    actionText: {
      fontSize: 15,
      fontWeight: '700',
    },
    actionTextMuted: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    ratedText: {
      color: theme.textPrimary,
    },
  });
