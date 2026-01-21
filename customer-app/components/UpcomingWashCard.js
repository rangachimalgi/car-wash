import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

export default function UpcomingWashCard({ wash, onDelivered, onPress }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: wash.image }}
              style={styles.image}
              resizeMode="cover"
            />
            <View style={styles.dateBadge}>
              <Text style={styles.dateDay}>{wash.date}</Text>
            </View>
          </View>
        </View>

        <View style={styles.rightSection}>
          <View style={styles.header}>
            <View style={styles.serviceTypeBadge}>
              <Text style={styles.serviceTypeText}>{wash.serviceType}</Text>
            </View>
            <View style={styles.statusBadge}>
              <MaterialCommunityIcons name="clock-outline" size={14} color={theme.accent} />
              <Text style={styles.statusText}>Upcoming</Text>
            </View>
          </View>

          <Text style={styles.serviceName}>{wash.serviceName}</Text>

          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="clock-time-four" size={16} color={theme.textPrimary} />
              <Text style={styles.detailText}>{wash.time}</Text>
            </View>
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="map-marker" size={16} color={theme.textPrimary} />
              <Text style={styles.detailText} numberOfLines={1}>{wash.address}</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Total</Text>
              <Text style={styles.priceText}>{wash.price}</Text>
            </View>
            <TouchableOpacity 
              style={styles.deliveredButton}
              onPress={(e) => {
                e.stopPropagation();
                onDelivered?.(wash);
              }}
            >
              <MaterialCommunityIcons name="check-circle" size={18} color="#4CAF50" />
              <Text style={styles.deliveredButtonText}>Delivered</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = theme => StyleSheet.create({
  card: {
    backgroundColor: theme.cardBackground,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    padding: 16,
  },
  leftSection: {
    marginRight: 16,
  },
  imageContainer: {
    position: 'relative',
    width: 100,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.accentSoft,
  },
  dateBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  dateDay: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  rightSection: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceTypeBadge: {
    backgroundColor: theme.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  serviceTypeText: {
    fontSize: 11,
    color: theme.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    color: theme.accent,
    fontWeight: '600',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.textPrimary,
    marginBottom: 12,
  },
  detailsContainer: {
    marginBottom: 12,
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: theme.textSecondary,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.cardBorder,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  priceLabel: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  priceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.accent,
  },
  deliveredButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  deliveredButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4CAF50',
  },
});
