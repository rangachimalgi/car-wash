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

/**
 * Get order by id
 * @param {String} orderId
 * @returns {Promise}
 */
export const getOrderById = async (orderId) => {
  try {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
};

/**
 * Submit rating for a completed order (customer only)
 * @param {String} orderId
 * @param {Object} payload - { rating: 1-5, review?: string }
 * @returns {Promise}
 */
export const submitOrderRating = async (orderId, payload) => {
  try {
    const response = await api.post(`/orders/${orderId}/rate`, payload);
    return response.data;
  } catch (error) {
    console.error('Error submitting rating:', error);
    throw error;
  }
};

/**
 * Add add-ons to an existing booking (only from Bookings → Upcoming → Book).
 * @param {String} orderId
 * @param {String[]} addOnIds
 */
export const addUpsellAddOnsToOrder = async (orderId, addOnIds) => {
  try {
    const response = await api.post(`/orders/${orderId}/upsell-addons`, {
      addOnIds,
      entrySource: 'upcoming_bookings',
    });
    return response.data;
  } catch (error) {
    console.error('Error adding upsell add-ons:', error);
    throw error;
  }
};
