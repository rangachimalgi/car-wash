import api from './api.js';

export const getInventory = async (params = {}) => {
  try {
    const response = await api.get('/inventory', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch inventory' };
  }
};

export const updateInventoryStock = async (inventoryId, { quantity, operation }) => {
  try {
    const response = await api.patch(`/inventory/${inventoryId}/stock`, {
      quantity,
      operation,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update inventory stock' };
  }
};

export const getInventoryUsage = async (inventoryId) => {
  try {
    const response = await api.get(`/inventory/${inventoryId}/usage`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch usage history' };
  }
};

export const recordInventoryUsage = async (inventoryId, payload) => {
  try {
    const response = await api.post(`/inventory/${inventoryId}/usage`, payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to record usage' };
  }
};

