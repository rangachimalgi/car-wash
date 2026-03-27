import api from '../config/api';

export const getPackagePricing = async ({ app = 'customer', vehicleType = 'car' } = {}) => {
  const response = await api.get('/package-pricing', {
    params: { app, vehicleType },
  });
  return response.data;
};
