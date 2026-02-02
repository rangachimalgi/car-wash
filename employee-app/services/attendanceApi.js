import api from './api.js';

// Mark attendance
export const markCheckIn = async (location = null, notes = null) => {
  try {
    const response = await api.post('/attendance/check-in', {
      location,
      notes,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to mark attendance' };
  }
};

// Get today's attendance
export const getTodayAttendance = async () => {
  try {
    const response = await api.get('/attendance/today');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch today attendance' };
  }
};

// Get attendance history
export const getAttendanceHistory = async (limit = 30, page = 1) => {
  try {
    const response = await api.get('/attendance/history', {
      params: { limit, page },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch attendance history' };
  }
};
