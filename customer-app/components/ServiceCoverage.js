import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

export default function ServiceCoverage({ included = [], notIncluded = [] }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const renderItem = (item, isIncluded) => (
    <View key={item} style={styles.itemRow}>
      <View style={[styles.iconContainer, isIncluded ? styles.includedIcon : styles.notIncludedIcon]}>
        {isIncluded ? (
          <MaterialCommunityIcons name="check" size={16} color={theme.accent} />
        ) : (
          <MaterialCommunityIcons name="information" size={16} color={theme.textPrimary} />
        )}
      </View>
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
        <View style={styles.column}>
          <View style={[styles.columnHeader, styles.includedHeader]}>
            <View style={[styles.headerIcon, styles.includedHeaderIcon]}>
              <MaterialCommunityIcons name="check" size={18} color="#000000" />
            </View>
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
        <View style={[styles.column, { borderRightWidth: 0 }]}>
          <View style={[styles.columnHeader, styles.notIncludedHeader]}>
            <View style={[styles.headerIcon, styles.notIncludedHeaderIcon]}>
              <MaterialCommunityIcons name="information" size={18} color={theme.textPrimary} />
            </View>
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

const createStyles = theme => StyleSheet.create({
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
    color: theme.accent,
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
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  includedHeader: {
    backgroundColor: theme.accent,
  },
  notIncludedHeader: {
    backgroundColor: theme.textSecondary,
  },
  headerIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  includedHeaderIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  notIncludedHeaderIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  columnHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  itemsContainer: {
    backgroundColor: theme.cardBackground,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.cardBorder,
  },
  iconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  includedIcon: {
    backgroundColor: theme.accentSoft,
  },
  notIncludedIcon: {
    backgroundColor: theme.cardBorder,
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
