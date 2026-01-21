import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [errors, setErrors] = useState({});

  const validatePhoneNumber = () => {
    const newErrors = {};
    
    if (!phoneNumber.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(phoneNumber)) {
      newErrors.phone = 'Phone number must be 10 digits';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateOtp = () => {
    const newErrors = {};
    
    if (!otp.trim()) {
      newErrors.otp = 'OTP is required';
    } else if (!/^\d{6}$/.test(otp)) {
      newErrors.otp = 'OTP must be 6 digits';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOtp = () => {
    if (validatePhoneNumber()) {
      // Handle OTP sending logic here (API call)
      console.log('Sending OTP to:', phoneNumber);
      setOtpSent(true);
      // In real app, you would call your backend API here
      Alert.alert('OTP Sent', `OTP has been sent to +91 ${phoneNumber}`);
    }
  };

  const handleVerifyOtp = () => {
    if (validateOtp()) {
      // Handle OTP verification logic here (API call)
      console.log('Verifying OTP:', otp);
      // In real app, you would call your backend API here
      // On success, navigate to main app
      navigation.navigate('MainTabs');
    }
  };

  const handleResendOtp = () => {
    // Handle resend OTP logic
    console.log('Resending OTP to:', phoneNumber);
    setOtp('');
    Alert.alert('OTP Resent', `New OTP has been sent to +91 ${phoneNumber}`);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingTop: 20 + insets.top, paddingBottom: 40 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo/Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons name="car-wash" size={64} color="#85E4FC" />
          </View>
          <Text style={styles.welcomeText}>Welcome to Woosh!</Text>
          <Text style={styles.subtitleText}>
            {otpSent ? 'Enter the OTP sent to your phone' : 'Enter your phone number to continue'}
          </Text>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          {!otpSent ? (
            // Phone Number Input
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={[styles.inputWrapper, errors.phone && styles.inputError]}>
                  <View style={styles.countryCode}>
                    <Text style={styles.countryCodeText}>+91</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your 10-digit phone number"
                    placeholderTextColor="#666666"
                    value={phoneNumber}
                    onChangeText={(text) => {
                      const numericText = text.replace(/[^0-9]/g, '').slice(0, 10);
                      setPhoneNumber(numericText);
                      if (errors.phone) setErrors({ ...errors, phone: '' });
                    }}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                </View>
                {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
              </View>

              {/* Send OTP Button */}
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={handleSendOtp}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Send OTP</Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color="#000000" />
              </TouchableOpacity>
            </>
          ) : (
            // OTP Input
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Enter OTP</Text>
                <View style={[styles.inputWrapper, errors.otp && styles.inputError]}>
                  <MaterialCommunityIcons name="key-outline" size={20} color="#9E9E9E" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter 6-digit OTP"
                    placeholderTextColor="#666666"
                    value={otp}
                    onChangeText={(text) => {
                      const numericText = text.replace(/[^0-9]/g, '').slice(0, 6);
                      setOtp(numericText);
                      if (errors.otp) setErrors({ ...errors, otp: '' });
                    }}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
                {errors.otp && <Text style={styles.errorText}>{errors.otp}</Text>}
              </View>

              {/* Phone Number Display */}
              <View style={styles.phoneDisplayContainer}>
                <Text style={styles.phoneDisplayText}>OTP sent to +91 {phoneNumber}</Text>
                <TouchableOpacity onPress={() => setOtpSent(false)}>
                  <Text style={styles.changeNumberText}>Change</Text>
                </TouchableOpacity>
              </View>

              {/* Verify OTP Button */}
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={handleVerifyOtp}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Verify OTP</Text>
                <MaterialCommunityIcons name="check" size={20} color="#000000" />
              </TouchableOpacity>

              {/* Resend OTP */}
              <View style={styles.resendContainer}>
                <Text style={styles.resendText}>Didn't receive OTP? </Text>
                <TouchableOpacity onPress={handleResendOtp}>
                  <Text style={styles.resendLink}>Resend</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#28282A',
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
    backgroundColor: 'rgba(49, 197, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: '#9E9E9E',
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
    color: '#FFFFFF',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    paddingHorizontal: 16,
    minHeight: 56,
  },
  inputError: {
    borderColor: '#FF5252',
  },
  countryCode: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  countryCodeText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    paddingVertical: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#FF5252',
    marginTop: 4,
    marginLeft: 4,
  },
  phoneDisplayContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  phoneDisplayText: {
    fontSize: 14,
    color: '#9E9E9E',
  },
  changeNumberText: {
    fontSize: 14,
    color: '#85E4FC',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
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
    color: '#000000',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    color: '#9E9E9E',
  },
  resendLink: {
    fontSize: 14,
    color: '#85E4FC',
    fontWeight: '600',
  },
});
