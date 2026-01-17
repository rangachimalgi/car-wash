import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BackHeader({ navigation, title }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
      <View style={styles.headerContent}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#000000" />
        </TouchableOpacity>
        {title && (
          <Text style={styles.headerTitle}>{title}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 8,
    alignSelf: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginLeft: 8,
  },
});
