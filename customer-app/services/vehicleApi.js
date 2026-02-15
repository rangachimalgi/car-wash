import api from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get all vehicles for a user
export const getVehicles = async (phone) => {
  try {
    const response = await api.get(`/users/${phone}/vehicles`);
    return response.data.data || response.data || [];
  } catch (error) {
    console.warn('Error fetching vehicles from server:', error);
    // Fallback to AsyncStorage
    const stored = await AsyncStorage.getItem(`userVehicles:${phone}`);
    return stored ? JSON.parse(stored) : [];
  }
};

// Add a new vehicle
export const addVehicle = async (phone, vehicleData) => {
  try {
    const response = await api.post(`/users/${phone}/vehicles`, vehicleData);
    return response.data.data || response.data;
  } catch (error) {
    console.warn('Error adding vehicle to server:', error);
    // Save locally as fallback
    const vehicles = await getVehicles(phone);
    const newVehicle = {
      id: Date.now().toString(),
      ...vehicleData,
      createdAt: new Date().toISOString(),
    };
    vehicles.push(newVehicle);
    await AsyncStorage.setItem(`userVehicles:${phone}`, JSON.stringify(vehicles));
    return newVehicle;
  }
};

// Delete a vehicle
export const deleteVehicle = async (phone, vehicleId) => {
  try {
    await api.delete(`/users/${phone}/vehicles/${vehicleId}`);
    // Also update local storage after successful API call
    const vehicles = await getVehicles(phone);
    const filtered = vehicles.filter(v => {
      const id = v._id || v.id;
      return id && id.toString() !== vehicleId.toString();
    });
    await AsyncStorage.setItem(`userVehicles:${phone}`, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.warn('Error deleting vehicle from server:', error);
    // Delete locally as fallback
    try {
      const vehicles = await getVehicles(phone);
      const filtered = vehicles.filter(v => {
        const id = v._id || v.id;
        return id && id.toString() !== vehicleId.toString();
      });
      await AsyncStorage.setItem(`userVehicles:${phone}`, JSON.stringify(filtered));
      return true;
    } catch (localError) {
      console.error('Error deleting vehicle locally:', localError);
      throw localError;
    }
  }
};

// Set selected vehicle
export const setSelectedVehicle = async (phone, vehicleId) => {
  try {
    await api.put(`/users/${phone}/vehicles/${vehicleId}/select`);
  } catch (error) {
    console.warn('Error setting selected vehicle on server:', error);
    // Save locally as fallback
    await AsyncStorage.setItem(`selectedVehicleId:${phone}`, vehicleId);
  }
};
