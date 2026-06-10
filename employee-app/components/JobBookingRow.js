import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function JobBookingRow({
  booking,
  isLast = true,
  onPress,
  badgeText,
  showPrice = false,
  theme,
}) {
  const badge = badgeText ?? booking.statusLabel ?? booking.dateLabel;
  const accent = theme?.accent || '#2563EB';

  return (
    <TouchableOpacity
      style={[styles.row, !isLast && styles.rowBorder]}
      onPress={onPress}
      activeOpacity={onPress ? 0.88 : 1}
      disabled={!onPress}
    >
      <View style={[styles.iconWrap, { backgroundColor: theme?.pillBg || '#EFF6FF' }]}>
        <MaterialCommunityIcons name={booking.icon} size={16} color={accent} />
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
          <MaterialCommunityIcons name="clock-outline" size={12} color="#94A3B8" />
          <Text style={styles.meta} numberOfLines={1}>
            {booking.time}
          </Text>
        </View>
        {booking.dateFormatted ? (
          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="calendar-outline" size={12} color="#94A3B8" />
            <Text style={styles.meta} numberOfLines={1}>
              {booking.dateFormatted}
            </Text>
          </View>
        ) : null}
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={12} color="#94A3B8" />
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
        <View
          style={[
            styles.dateBadge,
            {
              backgroundColor: theme?.badgeBg || '#EFF6FF',
              borderColor: theme?.badgeBorder || '#BFDBFE',
            },
          ]}
        >
          <Text style={[styles.dateBadgeText, { color: theme?.badgeText || '#1D4ED8' }]}>
            {badge}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

export const jobListStyles = StyleSheet.create({
  listGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  listEmpty: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    alignItems: 'center',
  },
  listEmptyText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  actionBtn: {
    flexGrow: 1,
    minWidth: '30%',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  actionBtnText: {
    fontWeight: '600',
    fontSize: 11,
  },
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    gap: 10,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
    paddingRight: 4,
  },
  service: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 1,
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
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  subMeta: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  price: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  dateBadge: {
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  dateBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
