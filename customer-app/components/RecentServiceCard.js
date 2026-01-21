import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function RecentServiceCard({ service, onReBook, onPress }) {
  return (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View style={styles.content}>
        <View style={styles.imageSection}>
          <Image 
            source={{ uri: service.image }}
            style={styles.image}
            resizeMode="cover"
          />
          <View style={styles.completedBadge}>
            <MaterialCommunityIcons name="check-circle" size={16} color="#4CAF50" />
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.headerRow}>
            <View style={styles.serviceTypeContainer}>
              <Text style={styles.serviceTypeText}>{service.serviceType}</Text>
            </View>
            <Text style={styles.statusText}>{service.status}</Text>
          </View>

          <Text style={styles.serviceName}>{service.serviceName}</Text>

          <View style={styles.dateRow}>
            <MaterialCommunityIcons name="calendar-clock" size={14} color="#9E9E9E" />
            <Text style={styles.dateText}>{service.date}</Text>
          </View>

          <View style={styles.footerRow}>
            <View>
              <Text style={styles.priceLabel}>Amount Paid</Text>
              <Text style={styles.priceText}>{service.price}</Text>
            </View>
            <TouchableOpacity 
              style={styles.rebookButton}
              onPress={(e) => {
                e.stopPropagation();
                onReBook?.(service);
              }}
            >
              <MaterialCommunityIcons name="refresh" size={16} color="#FFFFFF" />
              <Text style={styles.rebookButtonText}>Re-book</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
  },
  imageSection: {
    position: 'relative',
    width: 120,
    height: 140,
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2A2A2A',
  },
  completedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    borderRadius: 20,
    padding: 4,
  },
  infoSection: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceTypeContainer: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  serviceTypeText: {
    fontSize: 11,
    color: '#CCCCCC',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statusText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  dateText: {
    fontSize: 13,
    color: '#9E9E9E',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  priceLabel: {
    fontSize: 11,
    color: '#9E9E9E',
    marginBottom: 2,
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  rebookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2CD4FB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  rebookButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
