import React, { useMemo, useState } from 'react';
import {
  Alert,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export default function LoginScreen({ onLogin }) {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(), []);
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!employeeId.trim() || !password.trim()) {
      Alert.alert('Missing details', 'Please enter employee ID and password.');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/employees/login', {
        employeeId: employeeId.trim(),
        password,
      });
      
      const data = response.data;
      if (!data.success) {
        Alert.alert('Login failed', data.message || 'Invalid credentials');
        return;
      }
      
      // Save token and employee data
      if (data.token) {
        await AsyncStorage.setItem('employeeAuthToken', data.token);
        await AsyncStorage.setItem('employeeId', data.data.employeeId);
        await AsyncStorage.setItem('employeeName', data.data.name || '');
        await AsyncStorage.setItem('employeePhone', data.data.phone || '');
      }
      
      if (onLogin) {
        onLogin({ employeeId: data.data.employeeId });
      }
    } catch (error) {
      console.error('Employee login error:', error);
      if (error.response) {
        // Server responded with error
        Alert.alert('Login failed', error.response.data?.message || 'Invalid credentials');
      } else if (error.request) {
        // Request made but no response - network issue
        const errorMessage = error.request?._response || error.message || '';
        if (errorMessage.includes('unreachable')) {
          Alert.alert(
            'Connection Error',
            'Cannot reach server. Please check:\n\n' +
            '• Backend server is running\n' +
            '• Correct IP address configured\n' +
            '• Device and computer on same network\n\n' +
            'Check console for details.'
          );
        } else {
          Alert.alert('Network Error', 'Unable to connect to server. Please check your connection.');
        }
      } else {
        // Something else happened
        Alert.alert('Login failed', error.message || 'Unable to login right now.');
      }
    } finally {
      setLoading(false);
    }
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
            <MaterialCommunityIcons name="car-wash" size={64} color="#2F8CF4" />
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
                color="#6B7280"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your employee ID"
                placeholderTextColor="#6B7280"
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
                color="#6B7280"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#6B7280"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                style={styles.passwordToggle}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Logging in...' : 'Login'}
            </Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = () =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F5F6F8',
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
      backgroundColor: 'rgba(47, 140, 244, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
    },
    welcomeText: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#1A1A1A',
      marginBottom: 8,
    },
    subtitleText: {
      fontSize: 16,
      color: '#6B7280',
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
      color: '#1A1A1A',
      marginBottom: 8,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      paddingHorizontal: 16,
      minHeight: 56,
    },
    inputIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: '#1A1A1A',
      paddingVertical: 16,
    },
    passwordToggle: {
      marginLeft: 8,
      height: 40,
      width: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
    },
    primaryButton: {
      backgroundColor: '#2F8CF4',
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
