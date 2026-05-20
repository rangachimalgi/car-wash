import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.36;

export default function AddOnCard({
  title,
  price,
  isSelected = false,
  onToggle,
}) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={onToggle}
      activeOpacity={0.88}
    >
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.price}>₹{price}</Text>
      </View>
      <TouchableOpacity
        style={[styles.addButton, isSelected && styles.addButtonSelected]}
        onPress={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        activeOpacity={0.8}
      >
        <Text style={[styles.addButtonText, isSelected && styles.addButtonTextSelected]}>
          {isSelected ? 'Remove' : 'Add'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    card: {
      width: CARD_WIDTH,
      height: 148,
      borderRadius: 12,
      marginRight: 12,
      backgroundColor: theme.cardBackground,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      padding: 12,
      justifyContent: 'space-between',
    },
    cardSelected: {
      borderColor: theme.accent,
      backgroundColor: theme.accentSoft,
    },
    body: {
      flex: 1,
      justifyContent: 'flex-start',
    },
    title: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.textPrimary,
      lineHeight: 18,
      marginBottom: 6,
    },
    price: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.textPrimary,
    },
    addButton: {
      alignSelf: 'stretch',
      backgroundColor: theme.accent,
      paddingVertical: 8,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addButtonSelected: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: theme.danger,
    },
    addButtonText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.onAccent,
    },
    addButtonTextSelected: {
      color: theme.danger,
    },
  });
