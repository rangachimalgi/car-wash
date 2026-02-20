import api from '../config/api';

/**
 * Get available slots for a date range
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {Promise} Available slots grouped by date
 */
export const getAvailableSlots = async (startDate, endDate) => {
  try {
    // Convert dates to ISO strings if they're Date objects
    const startISO = startDate instanceof Date ? startDate.toISOString() : startDate;
    const endISO = endDate instanceof Date ? endDate.toISOString() : endDate;

    const response = await api.get('/slots/available', {
      params: {
        startDate: startISO,
        endDate: endISO,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching available slots:', error);
    throw error;
  }
};

/**
 * Get all configured time slots
 * @returns {Promise} Array of time slot objects
 */
export const getTimeSlots = async () => {
  try {
    const response = await api.get('/slots/times');
    return response.data;
  } catch (error) {
    console.error('Error fetching time slots:', error);
    throw error;
  }
};
