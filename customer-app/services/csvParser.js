import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

// Cache key for parsed CSV data
const CSV_CACHE_KEY = 'carsData_csv_cache';
const CSV_CACHE_VERSION = '1.0'; // Increment to invalidate cache

// In-memory cache to avoid re-parsing during app session
let inMemoryCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Parse CSV file and convert to JSON structure
 * @param {string} csvContent - Raw CSV content
 * @returns {Object} Parsed data in format { Brand: [models...] }
 */
const parseCSVToJSON = (csvContent) => {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) return {};
  
  // Parse header to find Make and Model columns
  const headers = lines[0].split(',').map(h => h.trim());
  const makeIndex = headers.findIndex(h => h.toLowerCase() === 'make');
  const modelIndex = headers.findIndex(h => h.toLowerCase() === 'model');
  
  if (makeIndex === -1 || modelIndex === -1) {
    console.warn('CSV missing Make or Model columns');
    return {};
  }
  
  // Group models by brand
  const brandModels = {};
  
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Handle CSV with quoted fields
    const fields = parseCSVLine(line);
    
    if (fields.length > Math.max(makeIndex, modelIndex)) {
      const brand = fields[makeIndex]?.trim();
      const model = fields[modelIndex]?.trim();
      
      if (brand && model) {
        // Normalize brand name (capitalize first letter of each word)
        const normalizedBrand = brand
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
        
        if (!brandModels[normalizedBrand]) {
          brandModels[normalizedBrand] = [];
        }
        
        // Add model if not already present (avoid duplicates)
        const normalizedModel = model
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
        
        if (!brandModels[normalizedBrand].includes(normalizedModel)) {
          brandModels[normalizedBrand].push(normalizedModel);
        }
      }
    }
  }
  
  return brandModels;
};

/**
 * Parse a CSV line handling quoted fields
 * @param {string} line - CSV line
 * @returns {Array<string>} Parsed fields
 */
const parseCSVLine = (line) => {
  const fields = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        currentField += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      fields.push(currentField);
      currentField = '';
    } else {
      currentField += char;
    }
  }
  
  // Add last field
  fields.push(currentField);
  
  return fields;
};

/**
 * Load and parse CSV file with caching
 * @param {string} csvPath - Path to CSV file (relative to assets)
 * @returns {Promise<Object>} Parsed data
 */
export const loadCarsDataFromCSV = async (csvPath = 'assets/archive/cars_ds_final.csv') => {
  try {
    // Check in-memory cache first (fastest)
    if (inMemoryCache && cacheTimestamp) {
      const age = Date.now() - cacheTimestamp;
      if (age < CACHE_DURATION) {
        console.log('Using in-memory CSV cache');
        return inMemoryCache;
      }
    }
    
    // Check AsyncStorage cache
    try {
      const cached = await AsyncStorage.getItem(CSV_CACHE_KEY);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        if (parsedCache.version === CSV_CACHE_VERSION && parsedCache.data) {
          const age = Date.now() - parsedCache.timestamp;
          if (age < CACHE_DURATION) {
            console.log('Using AsyncStorage CSV cache');
            inMemoryCache = parsedCache.data;
            cacheTimestamp = parsedCache.timestamp;
            return parsedCache.data;
          }
        }
      }
    } catch (e) {
      console.warn('Error reading CSV cache from AsyncStorage:', e);
    }
    
    // Parse CSV file
    console.log('Parsing CSV file (this may take a moment)...');
    const startTime = Date.now();
    
    // For React Native/Expo, we need to use require or fetch
    // Since we can't directly read files in React Native, we'll use the JSON fallback
    // If you need CSV parsing, you'd need to bundle the CSV or fetch it from a server
    
    // For now, return null to indicate CSV parsing isn't available
    // The app should fall back to using carsData.json
    console.warn('CSV parsing requires the file to be bundled or fetched from a server');
    return null;
    
  } catch (error) {
    console.error('Error loading CSV:', error);
    return null;
  }
};

/**
 * Cache parsed CSV data
 * @param {Object} data - Parsed data to cache
 */
export const cacheCarsData = async (data) => {
  try {
    const cacheData = {
      version: CSV_CACHE_VERSION,
      timestamp: Date.now(),
      data: data,
    };
    
    // Cache in AsyncStorage
    await AsyncStorage.setItem(CSV_CACHE_KEY, JSON.stringify(cacheData));
    
    // Cache in memory
    inMemoryCache = data;
    cacheTimestamp = Date.now();
    
    console.log('CSV data cached successfully');
  } catch (error) {
    console.error('Error caching CSV data:', error);
  }
};

/**
 * Clear CSV cache
 */
export const clearCSVCache = async () => {
  try {
    await AsyncStorage.removeItem(CSV_CACHE_KEY);
    inMemoryCache = null;
    cacheTimestamp = null;
    console.log('CSV cache cleared');
  } catch (error) {
    console.error('Error clearing CSV cache:', error);
  }
};

export default {
  loadCarsDataFromCSV,
  cacheCarsData,
  clearCSVCache,
  parseCSVToJSON,
};
