import api from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getVehicleKeys } from './addressStorage';
import { isSessionStillValid } from './authSession';

// Get all vehicles for a user
export const getVehicles = async (phone) => {
  if (!(await isSessionStillValid(phone))) {
    try {
      const keys = await getVehicleKeys();
      const stored = await AsyncStorage.getItem(keys.vehicles);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
  try {
    const response = await api.get(`/users/${phone}/vehicles`);
    console.log('getVehicles API response:', response.data);
    
    // Handle different response structures
    let vehicles = [];
    if (response.data) {
      if (response.data.data) {
        vehicles = response.data.data;
      } else if (Array.isArray(response.data)) {
        vehicles = response.data;
      } else if (response.data.vehicles) {
        vehicles = response.data.vehicles;
      }
    }
    
    // Ensure it's an array
    if (!Array.isArray(vehicles)) {
      console.warn('Vehicles response is not an array:', vehicles);
      vehicles = [];
    }
    
    console.log('Parsed vehicles:', vehicles.length, vehicles);
    return vehicles;
  } catch (error) {
    const cancelled =
      error?.code === 'ERR_CANCELED' ||
      error?.name === 'CanceledError' ||
      String(error?.message || '').toLowerCase().includes('cancel');
    if (!cancelled) {
      console.warn('Error fetching vehicles from server:', error);
      console.warn('Error details:', error.response?.data || error.message);
    }
    // Fallback to AsyncStorage (user-scoped key)
    try {
      const keys = await getVehicleKeys();
      const stored = await AsyncStorage.getItem(keys.vehicles);
      return stored ? JSON.parse(stored) : [];
    } catch (storageError) {
      console.warn('Error reading from AsyncStorage:', storageError);
      return [];
    }
  }
};

// Add a new vehicle
export const addVehicle = async (phone, vehicleData) => {
  try {
    const response = await api.post(`/users/${phone}/vehicles`, vehicleData);
    const savedVehicle = response.data.data || response.data;
    
    // Sync to AsyncStorage after successful API call
    try {
      const vehicles = await getVehicles(phone);
      const vehiclesArray = Array.isArray(vehicles) ? vehicles : [];
      
      // Check if vehicle already exists (avoid duplicates)
      const vehicleId = savedVehicle._id || savedVehicle.id;
      const exists = vehiclesArray.some(v => {
        const id = v._id || v.id;
        return id && id.toString() === vehicleId?.toString();
      });
      
      if (!exists) {
        vehiclesArray.push(savedVehicle);
        const keys = await getVehicleKeys();
        await AsyncStorage.setItem(keys.vehicles, JSON.stringify(vehiclesArray));
      } else {
        // Update existing vehicle
        const index = vehiclesArray.findIndex(v => {
          const id = v._id || v.id;
          return id && id.toString() === vehicleId?.toString();
        });
        if (index !== -1) {
          vehiclesArray[index] = savedVehicle;
          const keys = await getVehicleKeys();
          await AsyncStorage.setItem(keys.vehicles, JSON.stringify(vehiclesArray));
        }
      }
    } catch (storageError) {
      console.warn('Error syncing vehicle to AsyncStorage:', storageError);
      // Don't fail the whole operation if storage sync fails
    }
    
    return savedVehicle;
  } catch (error) {
    console.warn('Error adding vehicle to server:', error);
    // Save locally as fallback (user-scoped key)
    const vehicles = await getVehicles(phone);
    const vehiclesArray = Array.isArray(vehicles) ? vehicles : [];
    const newVehicle = {
      id: Date.now().toString(),
      ...vehicleData,
      createdAt: new Date().toISOString(),
    };
    vehiclesArray.push(newVehicle);
    const keys = await getVehicleKeys();
    await AsyncStorage.setItem(keys.vehicles, JSON.stringify(vehiclesArray));
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
    const keys = await getVehicleKeys();
    await AsyncStorage.setItem(keys.vehicles, JSON.stringify(filtered));
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
      const keys = await getVehicleKeys();
      await AsyncStorage.setItem(keys.vehicles, JSON.stringify(filtered));
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
    // Save locally as fallback (user-scoped key)
    const keys = await getVehicleKeys();
    await AsyncStorage.setItem(keys.selectedVehicleId, vehicleId);
  }
};
