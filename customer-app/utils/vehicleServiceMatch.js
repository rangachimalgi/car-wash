/**
 * Whether a saved vehicle type/model matches the wash service category.
 */
export function isVehicleValidForService(vehicleType, serviceCategory, vehicleModel = '') {
  if (!serviceCategory || !vehicleType) return true;

  const vehicleTypeLower = String(vehicleType).toLowerCase();
  const vehicleModelLower = String(vehicleModel || '').toLowerCase();

  if (serviceCategory === 'CarWash' || serviceCategory === 'AutoWash') {
    const is4Wheeler =
      vehicleTypeLower === '4wheeler' ||
      vehicleTypeLower === 'car' ||
      (vehicleTypeLower.includes('4') && vehicleTypeLower.includes('wheeler'));
    const isBike =
      vehicleTypeLower.includes('2wheeler') ||
      vehicleTypeLower.includes('bike') ||
      (vehicleTypeLower.includes('2') && vehicleTypeLower.includes('wheeler')) ||
      vehicleModelLower.includes('bike');
    return is4Wheeler && !isBike;
  }

  if (serviceCategory === 'BikeWash') {
    return (
      vehicleTypeLower === '2wheeler' ||
      vehicleTypeLower === 'bike' ||
      vehicleTypeLower.includes('bike') ||
      (vehicleTypeLower.includes('2') && vehicleTypeLower.includes('wheeler')) ||
      vehicleModelLower.includes('bike')
    );
  }

  return true;
}

/** Filter saved vehicles for the current wash service category. */
export function filterVehiclesForService(vehicles = [], serviceCategory) {
  if (!serviceCategory || !Array.isArray(vehicles)) return vehicles;

  return vehicles.filter((v) =>
    isVehicleValidForService(v?.vehicleType, serviceCategory, v?.vehicleModel)
  );
}

export function getVehicleFilterLabel(serviceCategory) {
  if (serviceCategory === 'CarWash' || serviceCategory === 'AutoWash') return 'car';
  if (serviceCategory === 'BikeWash') return 'bike';
  return 'vehicle';
}
