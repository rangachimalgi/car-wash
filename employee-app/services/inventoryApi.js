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

export const submitRefillRequest = async (inventoryId, payload) => {
  try {
    const response = await api.post(`/inventory/${inventoryId}/refill-request`, payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to submit refill request' };
  }
};

export const getInventoryById = async (inventoryId) => {
  try {
    const response = await api.get(`/inventory/${inventoryId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch inventory item' };
  }
};

export const getRefillRequests = async (params = {}) => {
  try {
    const response = await api.get('/inventory/refill-requests', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch refill requests' };
  }
};

