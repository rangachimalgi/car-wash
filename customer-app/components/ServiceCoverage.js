import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

const LIGHT_BLUE = '#85E4FC';
const SKY_BLUE_BG = '#E6F4FF';

export default function ServiceCoverage({ included = [], notIncluded = [] }) {
  const { theme, isLightMode } = useTheme();
  const styles = useMemo(() => createStyles(theme, isLightMode), [theme, isLightMode]);

  const renderItem = (item, isIncluded) => (
    <View key={item} style={[styles.itemRow, isIncluded && styles.includedItemRow]}>
      {isIncluded ? (
        <MaterialCommunityIcons name="check" size={18} color="#22C55E" style={styles.checkIcon} />
      ) : (
        <MaterialCommunityIcons name="information" size={18} color={theme.textSecondary} style={styles.infoIcon} />
      )}
      <Text style={styles.itemText}>{item}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Service Coverage</Text>
        <Text style={styles.seeAllText}>See all</Text>
      </View>
      
      <View style={styles.tableContainer}>
        {/* What's Included Column */}
        <View style={[styles.column, styles.includedColumn]}>
          <View style={[styles.columnHeader, styles.includedHeader]}>
            <MaterialCommunityIcons name="check" size={18} color="#22C55E" style={styles.headerCheckIcon} />
            <Text style={styles.columnHeaderText}>What's Included</Text>
          </View>
          <View style={styles.itemsContainer}>
            {included.length > 0 ? (
              included.map((item) => renderItem(item, true))
            ) : (
              <View style={styles.itemRow}>
                <Text style={styles.emptyText}>-</Text>
              </View>
            )}
          </View>
        </View>

        {/* Not Included Column */}
        <View style={[styles.column, styles.notIncludedColumn, { borderRightWidth: 0 }]}>
          <View style={[styles.columnHeader, styles.notIncludedHeader]}>
            <MaterialCommunityIcons name="information" size={18} color={theme.textSecondary} style={styles.headerInfoIcon} />
            <Text style={styles.columnHeaderText}>Not Included</Text>
          </View>
          <View style={styles.itemsContainer}>
            {notIncluded.length > 0 ? (
              notIncluded.map((item) => renderItem(item, false))
            ) : (
              <View style={styles.itemRow}>
                <Text style={styles.emptyText}>-</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const createStyles = (theme, isLightMode) => StyleSheet.create({
  container: {
    marginTop: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.textPrimary,
  },
  seeAllText: {
    fontSize: 14,
    color: theme.textPrimary,
    fontWeight: '600',
  },
  tableContainer: {
    flexDirection: 'row',
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  column: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: theme.cardBorder,
  },
  includedColumn: {
    backgroundColor: isLightMode ? SKY_BLUE_BG : theme.accentSoft,
  },
  notIncludedColumn: {
    backgroundColor: isLightMode ? '#F1F5F9' : theme.background,
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.cardBorder,
  },
  includedHeader: {
    backgroundColor: isLightMode ? SKY_BLUE_BG : theme.accentSoft,
  },
  notIncludedHeader: {
    backgroundColor: isLightMode ? '#F1F5F9' : theme.background,
  },
  headerCheckIcon: {
    marginRight: 8,
  },
  headerInfoIcon: {
    marginRight: 8,
  },
  checkIcon: {
    marginRight: 10,
  },
  infoIcon: {
    marginRight: 10,
  },
  columnHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  itemsContainer: {
    backgroundColor: theme.cardBackground,
  },
  notIncludedItemsContainer: {
    backgroundColor: isLightMode ? '#F1F5F9' : theme.background,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.cardBorder,
  },
  includedItemRow: {
    backgroundColor: isLightMode ? '#FFFFFF' : theme.cardBackground,
  },
  itemText: {
    flex: 1,
    fontSize: 14,
    color: theme.textPrimary,
  },
  emptyText: {
    fontSize: 14,
    color: theme.textSecondary,
    fontStyle: 'italic',
  },
});
