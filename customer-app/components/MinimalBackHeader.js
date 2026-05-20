import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';

export default function MinimalBackHeader({ navigation }) {
  const insets = useSafeAreaInsets();
  const { theme, isLightMode } = useTheme();
  const styles = useMemo(() => createStyles(theme, isLightMode), [theme, isLightMode]);

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 10 }]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.82}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <MaterialCommunityIcons name="arrow-left" size={22} color={theme.textPrimary} />
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (theme, isLightMode) =>
  StyleSheet.create({
    wrap: {
      paddingHorizontal: 16,
      paddingBottom: 6,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.cardBackground,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isLightMode ? 0.1 : 0.35,
      shadowRadius: 6,
      elevation: 4,
    },
  });
