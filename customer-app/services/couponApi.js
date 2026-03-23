import api from '../config/api';

export const validateCoupon = async ({ code, orderAmount, phone }) => {
  const response = await api.post('/coupons/validate', { code, orderAmount, phone });
  return response.data;
};

export const getCoupons = async () => {
  const response = await api.get('/coupons');
  return response.data;
};
