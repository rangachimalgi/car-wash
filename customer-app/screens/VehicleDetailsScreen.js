import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { Image } from 'expo-image';

export default function VehicleDetailsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { theme, isLightMode } = useTheme();

  const handleVehicleTypeSelect = (type) => {
    // Navigate to BrandsScreen with vehicle type
    navigation.navigate('Brands', { vehicleType: type });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: theme.background }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons 
            name="arrow-left" 
            size={24} 
            color={theme.textPrimary} 
          />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            Choose Your Vehicle Type
          </Text>
        </View>
        <View style={styles.backButton} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Subtitle */}
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          You can add more vehicles from the home screen.
        </Text>

        {/* 4 Wheeler Option */}
        <TouchableOpacity 
          style={[styles.vehicleOption, { borderColor: theme.cardBorder }]}
          onPress={() => handleVehicleTypeSelect('4WHEELER')}
          activeOpacity={0.8}
        >
          <View style={styles.vehicleOptionContent}>
            <View style={styles.vehicleTextContainer}>
              <Text style={[styles.vehicleLabel, { color: '#FFA500' }]}>I have a</Text>
              <Text style={[styles.vehicleType, { color: theme.textPrimary }]}>4 WHEELER</Text>
            </View>
            <Image 
              source={require('../assets/carVehicle.png')}
              style={styles.vehicleImage}
              contentFit="contain"
              transition={200}
            />
          </View>
        </TouchableOpacity>

        {/* OR Separator */}
        <View style={styles.orContainer}>
          <View style={[styles.orLine, { backgroundColor: theme.divider }]} />
          <Text style={[styles.orText, { color: theme.textSecondary }]}>OR</Text>
          <View style={[styles.orLine, { backgroundColor: theme.divider }]} />
        </View>

        {/* 2 Wheeler Option */}
        <TouchableOpacity 
          style={[styles.vehicleOption, { borderColor: theme.cardBorder }]}
          onPress={() => handleVehicleTypeSelect('2WHEELER')}
          activeOpacity={0.8}
        >
          <View style={styles.vehicleOptionContent}>
            <View style={styles.vehicleTextContainer}>
              <Text style={[styles.vehicleLabel, { color: '#FFA500' }]}>I have a</Text>
              <Text style={[styles.vehicleType, { color: theme.textPrimary }]}>2 WHEELER / BIKE</Text>
            </View>
            <Image 
              source={require('../assets/fallbackBike.png')}
              style={styles.vehicleImage}
              resizeMode="contain"
            />
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 24,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 32,
    textAlign: 'center',
  },
  vehicleOption: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
    minHeight: 140,
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  vehicleOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vehicleTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  vehicleLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  vehicleType: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  vehicleImage: {
    width: 140,
    height: 120,
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  orLine: {
    flex: 1,
    height: 1,
  },
  orText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
  },
});
