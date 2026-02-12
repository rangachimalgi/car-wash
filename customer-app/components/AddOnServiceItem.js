import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

const LIGHT_BLUE = '#85E4FC';

export default function AddOnServiceItem({ 
  title, 
  price, 
  addOnId,
  isSelected = false,
  onToggle,
  buttonVariant = 'text', // 'text' | 'plus'
}) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.container, isSelected && styles.containerSelected]}>
      <View style={styles.contentRow}>
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.price}>₹{price}</Text>
        </View>
        {buttonVariant === 'plus' ? (
          <TouchableOpacity 
            style={[styles.plusButton, isSelected && styles.plusButtonSelected]}
            onPress={onToggle}
            activeOpacity={0.8}
          >
            <Text style={[styles.plusButtonText, isSelected && styles.plusButtonTextSelected]}>
              {isSelected ? '−' : '+'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.addButton, isSelected && styles.addButtonSelected]}
            onPress={onToggle}
            activeOpacity={0.8}
          >
            <Text style={[styles.addButtonText, isSelected && styles.addButtonTextSelected]}>
              {isSelected ? 'Remove' : 'Add'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const createStyles = theme => StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    paddingVertical: 10,
    paddingHorizontal: 0,
    borderBottomWidth: 0,
  },
  containerSelected: {
    backgroundColor: 'transparent',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 2,
  },
  price: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000000',
  },
  addButton: {
    backgroundColor: '#000000',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonSelected: {
    backgroundColor: theme.danger,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  addButtonTextSelected: {
    color: '#FFFFFF',
  },
  plusButton: {
    width: 30,
    height: 30,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: theme.cardBorder,
    backgroundColor: theme.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -4,
  },
  plusButtonSelected: {
    borderColor: theme.accent,
    backgroundColor: theme.accent,
  },
  plusButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.textPrimary,
    lineHeight: 20,
  },
  plusButtonTextSelected: {
    color: '#FFFFFF',
  },
});
