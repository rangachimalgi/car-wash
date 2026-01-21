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

export const verifyOtp = async (phone, otp, name) => {
  try {
    const response = await api.post('/auth/verify-otp', { phone, otp, name });
    return response.data;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw error;
  }
};
