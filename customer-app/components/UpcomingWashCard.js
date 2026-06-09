import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

const UPCOMING_BOOK_STATUSES = ['Pending', 'Paid', 'Scheduled', 'In Progress'];

export default function UpcomingWashCard({ wash, onPress, onViewLocation, onPayNow, onBook }) {
  const { theme, isLightMode } = useTheme();
  const styles = useMemo(() => createStyles(theme, isLightMode), [theme, isLightMode]);
  const [imageError, setImageError] = useState(false);
  useEffect(() => {
    setImageError(false);
  }, [wash.id, wash.image]);
  const status = String(wash.status || '').trim();
  const hasLiveLocation =
    typeof wash.employeeLocation?.latitude === 'number' &&
    typeof wash.employeeLocation?.longitude === 'number';
  const isOngoing = status === 'In Progress';
  const isOnTheWay = hasLiveLocation && !isOngoing && status !== 'Completed';
  const statusLabel = isOngoing
    ? 'Ongoing'
    : isOnTheWay
      ? 'On the way'
      : (status || 'Upcoming');
  const showBook = onBook && UPCOMING_BOOK_STATUSES.includes(status);
  const showTrackLocation = (isOngoing || isOnTheWay) && onViewLocation;

  return (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <View style={styles.imageContainer}>
            <View style={styles.imageClip}>
              {wash.image && !imageError ? (
                <Image
                  source={{ uri: wash.image }}
                  style={styles.imageFill}
                  resizeMode="contain"
                  onError={() => setImageError(true)}
                />
              ) : (
                <View style={[styles.imageFill, styles.imagePlaceholder]}>
                  <MaterialCommunityIcons name="car-wash" size={36} color={theme.textSecondary} />
                </View>
              )}
            </View>
            <View style={styles.dateBadge}>
              <Text style={styles.dateDay} numberOfLines={1}>
                {wash.date}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.rightSection}>
          <View style={styles.header}>
            <View style={styles.serviceTypeBadge}>
              <Text style={styles.serviceTypeText}>{wash.serviceType}</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                isOnTheWay && styles.statusBadgeOnTheWay,
                isOngoing && styles.statusBadgeOngoing,
              ]}
            >
              <MaterialCommunityIcons
                name={isOnTheWay ? 'map-marker-path' : isOngoing ? 'progress-clock' : 'clock-outline'}
                size={14}
                color={
                  status === 'Pending'
                    ? '#000000'
                    : isOnTheWay
                      ? '#2563EB'
                      : theme.accent
                }
              />
              <Text
                style={[
                  styles.statusText,
                  status === 'Pending' && styles.statusTextPending,
                  isOnTheWay && styles.statusTextOnTheWay,
                ]}
              >
                {statusLabel}
              </Text>
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
            {wash.startCode ? (
              <View style={styles.codeWrap}>
                <Text style={styles.codeLabel}>Start code for employee</Text>
                <Text style={styles.codeValue}>{wash.startCode}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.footer}>
            <View style={styles.footerTop}>
              <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>Total</Text>
                <Text style={styles.priceText}>{wash.price}</Text>
              </View>
            </View>
            <View style={styles.actionsRow}>
              {status === 'Pending' && (
                <TouchableOpacity
                  style={styles.payNowButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    onPayNow?.(wash);
                  }}
                >
                  <MaterialCommunityIcons name="credit-card-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.payNowText}>Pay Now</Text>
                </TouchableOpacity>
              )}
              {showBook && (
                <TouchableOpacity
                  style={styles.bookButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    onBook(wash);
                  }}
                >
                  <MaterialCommunityIcons name="book-plus-outline" size={16} color="#2F5CF4" />
                  <Text style={styles.bookButtonText}>Book</Text>
                </TouchableOpacity>
              )}
              {showTrackLocation && (
                <TouchableOpacity
                  style={styles.viewLocationButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    onViewLocation?.(wash);
                  }}
                >
                  <MaterialCommunityIcons name="map-marker-radius" size={18} color="#2563EB" />
                  <Text style={styles.viewLocationText}>
                    {isOnTheWay ? 'Track employee' : 'View location'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (theme, isLightMode) => StyleSheet.create({
  card: {
    backgroundColor: theme.cardBackground,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
  },
  content: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
  },
  leftSection: {
    width: 100,
    marginRight: 14,
  },
  imageContainer: {
    width: 100,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: isLightMode ? '#F1F5F9' : theme.accentSoft,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  imageClip: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  imageFill: {
    width: '100%',
    height: '100%',
    backgroundColor: isLightMode ? '#F8FAFC' : theme.background,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
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
  statusTextPending: {
    color: theme.textPrimary,
  },
  statusBadgeOnTheWay: {
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
  },
  statusBadgeOngoing: {
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
  },
  statusTextOnTheWay: {
    color: '#2563EB',
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
  codeWrap: {
    marginTop: 10,
    backgroundColor: theme.accentSoft,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  codeLabel: {
    fontSize: 11,
    color: theme.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  codeValue: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.textPrimary,
    letterSpacing: 4,
  },
  footer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.cardBorder,
    gap: 12,
  },
  footerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    color: theme.textPrimary,
  },
  viewLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  viewLocationText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  payNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  payNowText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(47, 92, 244, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  bookButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2F5CF4',
  },
});
