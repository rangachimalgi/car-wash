import api from '../config/api';

export const requestOtp = async (phone, name) => {
  try {
    const response = await api.post('/auth/request-otp', { phone, name });
    return response.data;
  } catch (error) {
    console.error('Error requesting OTP:', error);
    throw error;
  }
};

export const verifyOtp = async (phone, otp, name, referralCode) => {
  try {
    const payload = { phone, otp, name };
    if (referralCode && referralCode.trim()) {
      payload.referralCode = referralCode.trim();
    }
    const response = await api.post('/auth/verify-otp', payload);
    return response.data;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw error;
  }
};
