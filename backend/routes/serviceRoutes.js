import express from 'express';
import {
  getServices,
  getServiceById,
  getPopularServices,
  getServicesByCategory,
} from '../controllers/serviceController.js';

const router = express.Router();

// @route   GET /api/services
// @desc    Get all services (with filters: category, search, sortBy)
// @access  Public
// Query params: ?category=CarWash&search=premium&sortBy=price-low
router.get('/', getServices);

// @route   GET /api/services/popular
// @desc    Get popular services (sorted by rating)
// @access  Public
// Query params: ?category=CarWash&limit=5
router.get('/popular', getPopularServices);

// @route   GET /api/services/category/:category
// @desc    Get services by category
// @access  Public
router.get('/category/:category', getServicesByCategory);

// @route   GET /api/services/:id
// @desc    Get single service by ID
// @access  Public
router.get('/:id', getServiceById);

export default router;
