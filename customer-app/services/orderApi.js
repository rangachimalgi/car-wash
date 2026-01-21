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

/**
 * Get orders (optional status filter)
 * @param {String} status - comma separated statuses
 * @returns {Promise}
 */
export const getOrders = async (status) => {
  try {
    const url = status ? `/orders?status=${encodeURIComponent(status)}` : '/orders';
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};

/**
 * Update order status
 * @param {String} orderId
 * @param {String} status
 * @returns {Promise}
 */
export const updateOrderStatus = async (orderId, status) => {
  try {
    const response = await api.patch(`/orders/${orderId}`, { status });
    return response.data;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};
