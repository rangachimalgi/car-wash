import api from '../config/api';

export const updateUserVehicle = async (payload) => {
  const response = await api.put('/users/vehicle', payload);
  return response.data;
};
