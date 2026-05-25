import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function JobBookingRow({
  booking,
  isLast = true,
  onPress,
  badgeText,
  showPrice = false,
}) {
  const badge = badgeText ?? booking.statusLabel ?? booking.dateLabel;

  return (
    <TouchableOpacity
      style={[styles.row, !isLast && styles.rowBorder]}
      onPress={onPress}
      activeOpacity={onPress ? 0.88 : 1}
      disabled={!onPress}
    >
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name={booking.icon} size={22} color="#FFFFFF" />
      </View>

      <View style={styles.body}>
        <Text style={styles.service} numberOfLines={1}>
          {booking.service}
        </Text>
        {booking.orderNumber ? (
          <Text style={styles.orderNo} numberOfLines={1}>
            {booking.orderNumber}
          </Text>
        ) : null}
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="clock-outline" size={14} color="#9CA3AF" />
          <Text style={styles.meta} numberOfLines={1}>
            {booking.time}
          </Text>
        </View>
        {booking.dateFormatted ? (
          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="calendar-outline" size={14} color="#9CA3AF" />
            <Text style={styles.meta} numberOfLines={1}>
              {booking.dateFormatted}
            </Text>
          </View>
        ) : null}
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={14} color="#9CA3AF" />
          <Text style={styles.meta} numberOfLines={2}>
            {booking.location}
          </Text>
        </View>
        {booking.customer || booking.vehicle ? (
          <Text style={styles.subMeta} numberOfLines={1}>
            {[booking.customer, booking.vehicle].filter(Boolean).join(' · ')}
          </Text>
        ) : null}
        {showPrice ? <Text style={styles.price}>{booking.price}</Text> : null}
      </View>

      {badge ? (
        <View style={styles.dateBadge}>
          <Text style={styles.dateBadgeText}>{badge}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

export const jobListStyles = StyleSheet.create({
  listGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  listEmpty: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 24,
    alignItems: 'center',
  },
  listEmptyText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    padding: 12,
    gap: 8,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  btnPrimary: {
    flexGrow: 1,
    minWidth: '30%',
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  btnOutline: {
    flexGrow: 1,
    minWidth: '30%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  btnOutlineText: {
    color: '#1A1A1A',
    fontWeight: '700',
    fontSize: 12,
  },
  btnMuted: {
    flexGrow: 1,
    minWidth: '30%',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  btnMutedText: {
    color: '#6B7280',
    fontWeight: '700',
    fontSize: 12,
  },
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 12,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
    paddingRight: 4,
  },
  service: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  orderNo: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  meta: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  subMeta: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  price: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  dateBadge: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  dateBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A1A1A',
  },
});
