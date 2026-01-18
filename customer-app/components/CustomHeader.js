import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CustomHeader({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <View style={styles.headerContent}>
        <TouchableOpacity style={styles.leftSection} activeOpacity={0.7}>
          <MaterialCommunityIcons 
            name="map-marker" 
            size={20} 
            color="#FFFFFF" 
            style={styles.locationIcon}
          />
          <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="tail">
            Add Address
          </Text>
          <MaterialCommunityIcons 
            name="chevron-down" 
            size={20} 
            color="#FFFFFF" 
            style={styles.arrowIcon}
          />
        </TouchableOpacity>
        <View style={styles.rightSection}>
          <TouchableOpacity 
            activeOpacity={0.7} 
            style={styles.iconButton}
            onPress={() => navigation?.navigate('Cart')}
          >
            <MaterialCommunityIcons 
              name="cart" 
              size={24} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} style={styles.iconButton}>
            <MaterialCommunityIcons 
              name="car" 
              size={24} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    minHeight: 44,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexShrink: 1,
    marginRight: 12,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  locationIcon: {
    marginRight: 8,
  },
  addressText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    flexShrink: 1,
  },
  arrowIcon: {
    marginLeft: 4,
  },
  iconButton: {
    marginLeft: 12,
    padding: 4,
  },
});
