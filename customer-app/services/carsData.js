import carsData from '../assets/carsData.json';

// Cache for expensive operations - persists across renders
let cachedBrands = null;
let cachedPopularBrands = null;
const modelsCache = new Map(); // Cache for brand models

/**
 * Get all unique car brands (cached)
 * @returns {Array<{id: string, name: string}>} Array of brand objects
 */
export const getAllBrands = () => {
  // Return cached result if available
  if (cachedBrands) {
    return cachedBrands;
  }
  
  // Compute and cache
  cachedBrands = Object.keys(carsData).map(brand => ({
    id: brand.toLowerCase().replace(/\s+/g, '-'),
    name: brand,
  })).sort((a, b) => a.name.localeCompare(b.name));
  
  return cachedBrands;
};

/**
 * Get models for a specific brand (cached)
 * @param {string} brandName - The brand name (e.g., "Tata", "Maruti Suzuki")
 * @param {number} limit - Maximum number of models to return (default: 20)
 * @returns {Array<string>} Array of model names
 */
export const getModelsForBrand = (brandName, limit = 20) => {
  if (!brandName) return [];
  
  // Create cache key
  const cacheKey = `${brandName.toLowerCase()}_${limit}`;
  
  // Check cache first
  if (modelsCache.has(cacheKey)) {
    return modelsCache.get(cacheKey);
  }
  
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
    modelsCache.set(cacheKey, []); // Cache empty result too
    return [];
  }
  
  // Return unique models, limited to specified count
  const result = models.slice(0, limit);
  modelsCache.set(cacheKey, result); // Cache the result
  return result;
};

/**
 * Get popular brands (you can customize this list) - cached
 * @returns {Array<{id: string, name: string}>} Array of popular brand objects
 */
export const getPopularBrands = () => {
  // Return cached result if available
  if (cachedPopularBrands) {
    return cachedPopularBrands;
  }
  
  const popularBrandNames = [
    'Maruti Suzuki',
    'Hyundai',
    'Tata',
    'Honda',
    'Mahindra',
    'Kia',
  ];
  
  // Compute and cache
  cachedPopularBrands = popularBrandNames
    .map(name => {
      const brand = Object.keys(carsData).find(
        key => key.toLowerCase() === name.toLowerCase()
      );
      return brand ? { id: brand.toLowerCase().replace(/\s+/g, '-'), name: brand } : null;
    })
    .filter(Boolean);
  
  return cachedPopularBrands;
};

// Lazy-loaded search index: model name -> array of brand names
// Built only when first search happens (not at module load) to speed up initial load
let modelToBrandsIndex = null;
let indexBuilding = false; // Prevent concurrent builds

/**
 * Build search index lazily (only when needed)
 * Maps model names to brand names for O(1) lookup
 */
const buildSearchIndex = () => {
  // Return if already built or currently building
  if (modelToBrandsIndex || indexBuilding) return;
  
  indexBuilding = true;
  const index = new Map();
  
  // Build index: for each brand, index all its models
  Object.keys(carsData).forEach(brandName => {
    const models = carsData[brandName];
    if (Array.isArray(models)) {
      models.forEach(model => {
        const modelLower = model.toLowerCase();
        // Index by full model name
        if (!index.has(modelLower)) {
          index.set(modelLower, []);
        }
        const brands = index.get(modelLower);
        if (!brands.includes(brandName)) {
          brands.push(brandName);
        }
        
        // Also index by individual words for partial matching
        const words = modelLower.split(/\s+/).filter(w => w.length > 2); // Only words > 2 chars
        words.forEach(word => {
          if (!index.has(word)) {
            index.set(word, []);
          }
          const wordBrands = index.get(word);
          if (!wordBrands.includes(brandName)) {
            wordBrands.push(brandName);
          }
        });
      });
    }
  });
  
  modelToBrandsIndex = index;
  indexBuilding = false;
};

// Cache for search results to avoid re-processing
const searchCache = new Map();
const CACHE_SIZE_LIMIT = 50; // Increased since we're using index now

// Clear cache periodically to prevent memory buildup
const clearCacheIfNeeded = () => {
  if (searchCache.size >= CACHE_SIZE_LIMIT) {
    // Clear half of the cache (FIFO)
    const keysToDelete = Array.from(searchCache.keys()).slice(0, Math.floor(CACHE_SIZE_LIMIT / 2));
    keysToDelete.forEach(key => searchCache.delete(key));
  }
};

/**
 * Search brands by model name (optimized with pre-built index and caching)
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
  
  // Build index lazily (only on first search)
  buildSearchIndex();
  
  // Use index for fast lookup (no iteration needed)
  const matchingBrandNames = new Set();
  const queryWords = query.split(/\s+/).filter(w => w.length > 0);
  
  // Search using index - much faster than iterating all brands
  queryWords.forEach(word => {
    if (modelToBrandsIndex && modelToBrandsIndex.has(word)) {
      modelToBrandsIndex.get(word).forEach(brandName => {
        matchingBrandNames.add(brandName);
      });
    }
  });
  
  // Also check full query match
  if (modelToBrandsIndex && modelToBrandsIndex.has(query)) {
    modelToBrandsIndex.get(query).forEach(brandName => {
      matchingBrandNames.add(brandName);
    });
  }
  
  // Convert to result format
  const result = Array.from(matchingBrandNames)
    .map(brandName => ({
      id: brandName.toLowerCase().replace(/\s+/g, '-'),
      name: brandName,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  
  // Clear cache if needed before adding new entry
  clearCacheIfNeeded();
  
  // Cache the result
  searchCache.set(query, result);
  
  return result;
};

export default carsData;
