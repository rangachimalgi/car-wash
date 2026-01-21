import api from '../config/api';

/**
 * Create order
 * @param {Object} payload
 * @returns {Promise}
 */
export const createOrder = async (payload) => {
  try {
    const response = await api.post('/orders', payload);
    return response.data;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};
