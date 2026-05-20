import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestOtp, verifyOtp } from '../services/authApi';
import { registerPushTokenWithBackend } from '../services/pushNotifications';
import { useTheme } from '../theme/ThemeContext';
import { getMedia } from '../config/api';

const { width } = Dimensions.get('window');
const OTP_LENGTH = 6;
const DEFAULT_LOGIN_BANNER = require('../assets/carpicfour.jpeg');
const LOGIN_BANNER_CACHE_KEY = 'cachedLoginBannerUri';

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { theme, isLightMode } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [otpSent, setOtpSent] = useState(false);
  const [errors, setErrors] = useState({});
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [loginBannerUri, setLoginBannerUri] = useState(null);
  const [loginBannerFetchDone, setLoginBannerFetchDone] = useState(false);
  const [loginBannerFailed, setLoginBannerFailed] = useState(false);
  const otpInputRefs = useRef([]);

  const showRemoteBanner = Boolean(loginBannerUri && !loginBannerFailed);
  const showFallbackBanner = loginBannerFetchDone && !showRemoteBanner;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let hadCachedUri = false;
      try {
        const cached = await AsyncStorage.getItem(LOGIN_BANNER_CACHE_KEY);
        const cachedUri = cached?.trim() || '';
        if (!cancelled && cachedUri) {
          hadCachedUri = true;
          setLoginBannerUri(cachedUri);
          setLoginBannerFailed(false);
          Image.prefetch(cachedUri, { cachePolicy: 'memory-disk' }).catch(() => {});
        }
      } catch (_) {
        /* ignore cache read errors */
      }

      try {
        const data = await getMedia();
        const first = (data.loginBanner || []).find((m) => m?.url && String(m.url).trim());
        const remoteUri = first?.url ? String(first.url).trim() : '';
        if (!cancelled) {
          if (remoteUri) {
            setLoginBannerUri(remoteUri);
            setLoginBannerFailed(false);
            AsyncStorage.setItem(LOGIN_BANNER_CACHE_KEY, remoteUri).catch(() => {});
            Image.prefetch(remoteUri, { cachePolicy: 'memory-disk' }).catch(() => {});
          } else if (!hadCachedUri) {
            setLoginBannerUri('');
          }
        }
      } catch (_) {
        if (!cancelled && !hadCachedUri) {
          setLoginBannerUri('');
        }
      } finally {
        if (!cancelled) {
          setLoginBannerFetchDone(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const validatePhoneNumber = () => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!phoneNumber.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(phoneNumber)) {
      newErrors.phone = 'Phone number must be 10 digits';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    if (otpSent && resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
  }, [otpSent, resendTimer]);

  const validateOtp = () => {
    const newErrors = {};
    const otpString = otp.join('');
    
    if (!otpString.trim()) {
      newErrors.otp = 'OTP is required';
    } else if (!new RegExp(`^\\d{${OTP_LENGTH}}$`).test(otpString)) {
      newErrors.otp = `OTP must be ${OTP_LENGTH} digits`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOtp = async () => {
    if (!validatePhoneNumber()) return;
    try {
      const response = await requestOtp(phoneNumber, name);
      console.log('OTP response:', response);
      setOtpSent(true);
      setResendTimer(60);
      setCanResend(false);
      setOtp(Array(OTP_LENGTH).fill(''));
    } catch (error) {
      Alert.alert('OTP Failed', 'Unable to send OTP right now.');
    }
  };

  const handleVerifyOtp = async () => {
    if (!validateOtp()) return;
    const otpString = otp.join('');
    try {
      const response = await verifyOtp(phoneNumber, otpString, name, referralCode);
      console.log('Verify OTP response:', response);
      if (response?.success && response?.token) {
        await AsyncStorage.setItem('authToken', response.token);
        await AsyncStorage.setItem('authPhone', phoneNumber);
        await AsyncStorage.setItem('authName', response.user?.name || name);
        if (response.user?.id) {
          await AsyncStorage.setItem('userId', String(response.user.id));
        }
        registerPushTokenWithBackend().catch(() => {});
      }
      navigation.navigate('MainTabs');
    } catch (error) {
      Alert.alert('Invalid OTP', 'Please check the OTP and try again.');
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    try {
      await requestOtp(phoneNumber);
      setOtp(Array(OTP_LENGTH).fill(''));
      setResendTimer(60);
      setCanResend(false);
    } catch (error) {
      Alert.alert('OTP Failed', 'Unable to resend OTP right now.');
    }
  };

  const formatPhoneNumber = (phone) => {
    if (phone.length === 10) {
      return `+91-${phone.slice(0, 5)}-${phone.slice(5)}`;
    }
    return `+91-${phone}`;
  };

  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto-focus next input
    if (value && index < OTP_LENGTH - 1) {
      otpInputRefs.current[index + 1]?.focus();
    }
    
    // Auto-verify when all digits are entered
    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === OTP_LENGTH) {
      setTimeout(() => {
        const otpString = newOtp.join('');
        if (new RegExp(`^\\d{${OTP_LENGTH}}$`).test(otpString)) {
          // Use the new OTP value directly
          verifyOtpWithString(otpString);
        }
      }, 300);
    }
  };

  const verifyOtpWithString = async (otpString) => {
    try {
      const response = await verifyOtp(phoneNumber, otpString, name, referralCode);
      console.log('Verify OTP response:', response);
      if (response?.success && response?.token) {
        await AsyncStorage.setItem('authToken', response.token);
        await AsyncStorage.setItem('authPhone', phoneNumber);
        await AsyncStorage.setItem('authName', response.user?.name || name);
        if (response.user?.id) {
          await AsyncStorage.setItem('userId', String(response.user.id));
        }
        registerPushTokenWithBackend().catch(() => {});
      }
      navigation.navigate('MainTabs');
    } catch (error) {
      Alert.alert('Invalid OTP', 'Please check the OTP and try again.');
    }
  };

  const handleOtpKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style={isLightMode ? 'dark' : 'light'} />
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top, paddingBottom: 40 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!otpSent && (
          <>
            {/* Banner Section with Image */}
            <View style={styles.bannerContainer}>
              {showRemoteBanner ? (
                <Image
                  source={{ uri: loginBannerUri }}
                  style={styles.bannerImage}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={200}
                  onError={() => setLoginBannerFailed(true)}
                />
              ) : showFallbackBanner ? (
                <Image
                  source={DEFAULT_LOGIN_BANNER}
                  style={styles.bannerImage}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.bannerPlaceholder} />
              )}
            </View>

            {/* App Description */}
            <View style={styles.appDescription}>
              {/* <Text style={styles.appDescriptionTop}>{"India's"}</Text> */}
              <Text style={styles.appDescriptionBottom}>
                {"Your Vehicle's Best\nCompanion App"}
              </Text>
            </View>
          </>
        )}

        {/* Form Section */}
        <View style={[styles.formSection, otpSent && styles.otpFormSection]}>
          {!otpSent ? (
            <>
              <Text style={styles.loginPrompt}>Log in or sign up</Text>
              
              <View style={styles.inputContainer}>
                <View style={[styles.inputWrapper, errors.phone && styles.inputError]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Phone Number"
                    placeholderTextColor={theme.textSecondary}
                    value={phoneNumber}
                    onChangeText={(text) => {
                      const numericText = text.replace(/[^0-9]/g, '').slice(0, 10);
                      setPhoneNumber(numericText);
                      if (errors.phone) setErrors({ ...errors, phone: '' });
                    }}
                    keyboardType="phone-pad"
                    maxLength={10}
                    keyboardAppearance={isLightMode ? 'light' : 'dark'}
                  />
                </View>
                {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
              </View>

              {/* Name Input - shown when phone number is valid */}
              {phoneNumber.length === 10 && (
                <View style={styles.inputContainer}>
                  <View style={[styles.inputWrapper, errors.name && styles.inputError]}>
                    <TextInput
                      style={styles.input}
                      placeholder="Full Name"
                      placeholderTextColor={theme.textSecondary}
                      value={name}
                      onChangeText={(text) => {
                        setName(text);
                        if (errors.name) setErrors({ ...errors, name: '' });
                      }}
                      autoCapitalize="words"
                      keyboardAppearance={isLightMode ? 'light' : 'dark'}
                    />
                  </View>
                  {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                </View>
              )}

              {/* Referral Code (optional) */}
              {phoneNumber.length === 10 && (
                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="Referral Code (optional)"
                      placeholderTextColor={theme.textSecondary}
                      value={referralCode}
                      onChangeText={(text) => {
                        setReferralCode(text.toUpperCase().trimStart());
                      }}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      keyboardAppearance={isLightMode ? 'light' : 'dark'}
                    />
                  </View>
                </View>
              )}

              {/* Login/Signup Button */}
              <TouchableOpacity 
                style={styles.loginButton}
                onPress={handleSendOtp}
                activeOpacity={0.8}
              >
                <Text style={styles.loginButtonText}>Login/Signup</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Header with Back Button */}
              <View style={styles.otpHeader}>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => setOtpSent(false)}
                >
                  <MaterialCommunityIcons name="arrow-left" size={24} color={theme.textPrimary} />
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
              </View>

              {/* Title */}
              <Text style={styles.otpTitle}>Enter Verification Code</Text>

              {/* Instructions */}
              <Text style={styles.otpInstruction}>
                We have sent you a {OTP_LENGTH} digit verification code on
              </Text>

              {/* Phone Number Display with Edit */}
              <View style={styles.phoneNumberContainer}>
                <TouchableOpacity 
                  style={styles.phoneNumberDisplay}
                  onPress={() => setOtpSent(false)}
                >
                  <Text style={styles.phoneNumberText}>{formatPhoneNumber(phoneNumber)}</Text>
                  <MaterialCommunityIcons name="pencil" size={18} color={theme.textSecondary} style={styles.editIcon} />
                </TouchableOpacity>
              </View>
              <Text style={styles.smsText}>via SMS</Text>

              {/* OTP Input Fields */}
              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (otpInputRefs.current[index] = ref)}
                    style={[styles.otpBox, errors.otp && styles.otpBoxError]}
                    value={digit}
                    onChangeText={(value) => {
                      const numericValue = value.replace(/[^0-9]/g, '').slice(0, 1);
                      handleOtpChange(numericValue, index);
                      if (errors.otp) setErrors({ ...errors, otp: '' });
                    }}
                    onKeyPress={(e) => handleOtpKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    textAlign="center"
                  />
                ))}
              </View>
              {errors.otp && <Text style={styles.errorText}>{errors.otp}</Text>}

              {/* Resend Code Section */}
              <View style={styles.resendCodeContainer}>
                <Text style={styles.resendQuestionText}>Didn't receive the code?</Text>
                <TouchableOpacity 
                  style={[styles.resendButton, !canResend && styles.resendButtonDisabled]}
                  onPress={handleResendOtp}
                  disabled={!canResend}
                >
                  <Text style={styles.resendButtonText}>
                    {canResend ? 'Resend' : `Wait | ${resendTimer}`}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Terms and Conditions - Only show when not in OTP screen */}
          {!otpSent && (
            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                By proceeding you agree to the{' '}
                <Text style={styles.termsLink}>Terms & Conditions</Text>
                {' '}and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = theme => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  bannerContainer: {
    width: width,
    height: width * 0.72,
    overflow: 'hidden',
    marginBottom: 32,
    backgroundColor: theme.background,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.background,
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    justifyContent: 'space-between',
  },
  bannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: 'flex-start',
    gap: 8,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  bannerBadgeBottom: {
    alignSelf: 'flex-end',
    marginTop: 0,
    marginBottom: 24,
  },
  bannerBadgeText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  appDescription: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
    width: '100%',
  },
  appDescriptionTop: {
    fontSize: 20,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
    width: '100%',
  },
  appDescriptionBottom: {
    fontSize: 24,
    color: theme.textPrimary,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    textAlign: 'center',
    width: '100%',
  },
  formSection: {
    paddingHorizontal: 24,
    flex: 1,
  },
  otpFormSection: {
    paddingHorizontal: 20,
  },
  loginPrompt: {
    fontSize: 16,
    color: theme.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.cardBackground,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: theme.cardBorder,
    paddingHorizontal: 18,
    minHeight: 58,
  },
  inputError: {
    borderColor: theme.danger,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.textPrimary,
    paddingVertical: 18,
  },
  errorText: {
    fontSize: 12,
    color: theme.danger,
    marginTop: 6,
    marginLeft: 4,
  },
  loginButton: {
    backgroundColor: theme.accent,
    borderRadius: 10,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    marginTop: 12,
  },
  loginButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: theme.onAccent,
    letterSpacing: 0.5,
  },
  phoneDisplayContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  phoneDisplayText: {
    fontSize: 14,
    color: '#6B7280',
  },
  changeNumberText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  resendText: {
    fontSize: 14,
    color: '#6B7280',
  },
  resendLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  termsContainer: {
    marginTop: 'auto',
    paddingTop: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  termsText: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  termsLink: {
    textDecorationLine: 'underline',
    color: theme.textPrimary,
    fontWeight: '500',
  },
  // OTP Screen Styles
  otpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 4,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: theme.textPrimary,
    fontWeight: '500',
  },
  otpTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  otpInstruction: {
    fontSize: 15,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 22,
  },
  phoneNumberContainer: {
    alignItems: 'center',
    marginBottom: 4,
  },
  phoneNumberDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phoneNumberText: {
    fontSize: 16,
    color: theme.textPrimary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  editIcon: {
    marginLeft: 4,
  },
  smsText: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  otpBox: {
    width: 44,
    height: 50,
    borderWidth: 1.5,
    borderColor: theme.cardBorder,
    borderRadius: 8,
    fontSize: 22,
    fontWeight: '600',
    color: theme.textPrimary,
    backgroundColor: theme.cardBackground,
    textAlign: 'center',
  },
  otpBoxError: {
    borderColor: theme.danger,
  },
  resendCodeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  resendQuestionText: {
    fontSize: 15,
    color: theme.textSecondary,
  },
  resendButton: {
    backgroundColor: theme.accent,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  resendButtonDisabled: {
    backgroundColor: theme.divider,
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.onAccent,
  },
});
