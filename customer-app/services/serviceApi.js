import api from '../config/api';

/**
 * Service API functions
 */

/**
 * Get all services with optional filters
 * @param {Object} filters - { category, search, sortBy, isActive }
 * @returns {Promise} Service list
 */
export const getServices = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.category) params.append('category', filters.category);
    if (filters.search) params.append('search', filters.search);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.isActive !== undefined) params.append('isActive', filters.isActive);

    const queryString = params.toString();
    const url = `/services${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching services:', error);
    throw error;
  }
};

/**
 * Get service by ID
 * @param {String} serviceId - Service ID
 * @returns {Promise} Service details
 */
export const getServiceById = async (serviceId) => {
  try {
    const response = await api.get(`/services/${serviceId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching service:', error);
    throw error;
  }
};

/**
 * Get popular services
 * @param {Object} filters - { category, limit }
 * @returns {Promise} Popular services list
 */
export const getPopularServices = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.category) params.append('category', filters.category);
    if (filters.limit) params.append('limit', filters.limit);

    const queryString = params.toString();
    const url = `/services/popular${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching popular services:', error);
    throw error;
  }
};

/**
 * Get services by category
 * @param {String} category - CarWash, BikeWash, or AddOn
 * @param {Object} options - { sortBy }
 * @returns {Promise} Services list
 */
export const getServicesByCategory = async (category, options = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (options.sortBy) params.append('sortBy', options.sortBy);

    const queryString = params.toString();
    const url = `/services/category/${category}${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching services by category:', error);
    throw error;
  }
};
