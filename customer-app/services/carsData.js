import carsData from '../assets/carsData.json';

/**
 * Get all unique car brands
 * @returns {Array<{id: string, name: string}>} Array of brand objects
 */
export const getAllBrands = () => {
  const brands = Object.keys(carsData).map(brand => ({
    id: brand.toLowerCase().replace(/\s+/g, '-'),
    name: brand,
  }));
  return brands.sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Get models for a specific brand
 * @param {string} brandName - The brand name (e.g., "Tata", "Maruti Suzuki")
 * @param {number} limit - Maximum number of models to return (default: 20)
 * @returns {Array<string>} Array of model names
 */
export const getModelsForBrand = (brandName, limit = 20) => {
  if (!brandName) return [];
  
  // Try exact match first
  let models = carsData[brandName];
  
  // If not found, try case-insensitive match
  if (!models) {
    const brandKey = Object.keys(carsData).find(
      key => key.toLowerCase() === brandName.toLowerCase()
    );
    if (brandKey) {
      models = carsData[brandKey];
    }
  }
  
  if (!models || !Array.isArray(models)) {
    return [];
  }
  
  // Return unique models, limited to specified count
  return models.slice(0, limit);
};

/**
 * Get popular brands (you can customize this list)
 * @returns {Array<{id: string, name: string}>} Array of popular brand objects
 */
export const getPopularBrands = () => {
  const popularBrandNames = [
    'Maruti Suzuki',
    'Hyundai',
    'Tata',
    'Honda',
    'Mahindra',
    'Kia',
  ];
  
  return popularBrandNames
    .map(name => {
      const brand = Object.keys(carsData).find(
        key => key.toLowerCase() === name.toLowerCase()
      );
      return brand ? { id: brand.toLowerCase().replace(/\s+/g, '-'), name: brand } : null;
    })
    .filter(Boolean);
};

/**
 * Search brands by model name
 * @param {string} modelQuery - The model name to search for (e.g., "A4", "Swift")
 * @returns {Array<{id: string, name: string}>} Array of brand objects that have models matching the query
 */
export const searchBrandsByModel = (modelQuery) => {
  if (!modelQuery || !modelQuery.trim()) return [];
  
  const query = modelQuery.toLowerCase().trim();
  const matchingBrands = [];
  
  // Search through all brands and their models
  Object.keys(carsData).forEach(brandName => {
    const models = carsData[brandName];
    if (Array.isArray(models)) {
      // Check if any model matches the query
      const hasMatchingModel = models.some(model => 
        model.toLowerCase().includes(query)
      );
      
      if (hasMatchingModel) {
        matchingBrands.push({
          id: brandName.toLowerCase().replace(/\s+/g, '-'),
          name: brandName,
        });
      }
    }
  });
  
  return matchingBrands.sort((a, b) => a.name.localeCompare(b.name));
};

export default carsData;
