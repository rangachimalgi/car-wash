import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const lightTheme = {
  background: '#F5F6F8',
  cardBackground: '#FFFFFF',
  cardBorder: '#E2E8F0',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  accent: '#2F8CF4',
  accentSoft: 'rgba(47, 140, 244, 0.15)',
  danger: '#FF5252',
};

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(lightTheme), []);
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    Alert.alert('Submitted', 'Login submitted (no validation yet).');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: 20 + insets.top, paddingBottom: 40 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons name="car-wash" size={64} color={lightTheme.accent} />
          </View>
          <Text style={styles.welcomeText}>Welcome Woosher !</Text>
          <Text style={styles.subtitleText}>
            Enter your employee ID and password to continue
          </Text>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Employee ID</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons
                name="badge-account-outline"
                size={20}
                color={lightTheme.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your employee ID"
                placeholderTextColor={lightTheme.textSecondary}
                value={employeeId}
                onChangeText={setEmployeeId}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons
                name="lock-outline"
                size={20}
                color={lightTheme.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={lightTheme.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSubmit}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Login</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 20,
    },
    headerSection: {
      alignItems: 'center',
      marginBottom: 48,
    },
    logoContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
    },
    welcomeText: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.textPrimary,
      marginBottom: 8,
    },
    subtitleText: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: 'center',
    },
    formSection: {
      flex: 1,
    },
    inputContainer: {
      marginBottom: 24,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textPrimary,
      marginBottom: 8,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      paddingHorizontal: 16,
      minHeight: 56,
    },
    inputIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: theme.textPrimary,
      paddingVertical: 16,
    },
    primaryButton: {
      backgroundColor: theme.accent,
      borderRadius: 12,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
      gap: 8,
    },
    primaryButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
  });
