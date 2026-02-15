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

// Cache for search results to avoid re-processing
const searchCache = new Map();
const CACHE_SIZE_LIMIT = 20; // Reduced cache size to prevent memory issues

// Clear cache periodically to prevent memory buildup
const clearCacheIfNeeded = () => {
  if (searchCache.size >= CACHE_SIZE_LIMIT) {
    // Clear half of the cache (FIFO)
    const keysToDelete = Array.from(searchCache.keys()).slice(0, Math.floor(CACHE_SIZE_LIMIT / 2));
    keysToDelete.forEach(key => searchCache.delete(key));
  }
};

/**
 * Search brands by model name (optimized with caching)
 * @param {string} modelQuery - The model name to search for (e.g., "A4", "Swift")
 * @returns {Array<{id: string, name: string}>} Array of brand objects that have models matching the query
 */
export const searchBrandsByModel = (modelQuery) => {
  if (!modelQuery || !modelQuery.trim()) return [];
  
  const query = modelQuery.toLowerCase().trim();
  
  // Check cache first
  if (searchCache.has(query)) {
    return searchCache.get(query);
  }
  
  const matchingBrands = [];
  const queryWords = query.split(' ').filter(w => w.length > 0);
  
  // Search through all brands and their models
  Object.keys(carsData).forEach(brandName => {
    const models = carsData[brandName];
    if (Array.isArray(models)) {
      // Optimized: Check if any model matches the query (faster with early exit)
      let hasMatchingModel = false;
      for (let i = 0; i < models.length && !hasMatchingModel; i++) {
        const modelLower = models[i].toLowerCase();
        // Check if query matches model (either full match or word match)
        if (modelLower.includes(query) || queryWords.some(word => modelLower.includes(word))) {
          hasMatchingModel = true;
        }
      }
      
      if (hasMatchingModel) {
        matchingBrands.push({
          id: brandName.toLowerCase().replace(/\s+/g, '-'),
          name: brandName,
        });
      }
    }
  });
  
  const result = matchingBrands.sort((a, b) => a.name.localeCompare(b.name));
  
  // Clear cache if needed before adding new entry
  clearCacheIfNeeded();
  
  // Cache the result
  searchCache.set(query, result);
  
  return result;
};

export default carsData;
