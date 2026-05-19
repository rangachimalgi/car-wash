import api from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSessionStillValid } from './authSession';

// Fetch wallet details for the currently logged-in user (by phone)
export const getWallet = async () => {
  const phone = await AsyncStorage.getItem('authPhone');
  if (!phone || !(await isSessionStillValid(phone))) {
    return { walletBalance: 0, transactions: [] };
  }

  try {
    const response = await api.get(`/users/${phone}/wallet`);
    const data = response.data?.data || {};
    return {
      walletBalance: typeof data.walletBalance === 'number' ? data.walletBalance : 0,
      transactions: Array.isArray(data.transactions) ? data.transactions : [],
    };
  } catch (error) {
    const cancelled =
      error?.code === 'ERR_CANCELED' ||
      error?.name === 'CanceledError' ||
      String(error?.message || '').toLowerCase().includes('cancel');
    if (!cancelled) {
      console.warn('Error fetching wallet:', error.response?.data || error.message);
    }
    return { walletBalance: 0, transactions: [] };
  }
};

export const getReferralInfo = async (phone) => {
  if (!phone || !(await isSessionStillValid(phone))) {
    return null;
  }
  try {
    const response = await api.get(`/users/${phone}/referral-info`);
    return response.data?.data || null;
  } catch (error) {
    const cancelled =
      error?.code === 'ERR_CANCELED' ||
      error?.name === 'CanceledError' ||
      String(error?.message || '').toLowerCase().includes('cancel');
    if (!cancelled) {
      console.warn('Error fetching referral info:', error.response?.data || error.message);
    }
    return null;
  }
};

