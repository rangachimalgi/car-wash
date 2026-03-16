import api from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Fetch wallet details for the currently logged-in user (by phone)
export const getWallet = async () => {
  const phone = await AsyncStorage.getItem('authPhone');
  if (!phone) {
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
    console.warn('Error fetching wallet:', error.response?.data || error.message);
    return { walletBalance: 0, transactions: [] };
  }
};

