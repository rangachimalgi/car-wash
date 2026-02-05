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

