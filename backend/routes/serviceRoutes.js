import express from 'express';
import {
  getServices,
  getServiceById,
  getPopularServices,
  getServicesByCategory,
  createService,
  updateService,
  deleteService,
  uploadServiceImage,
} from '../controllers/serviceController.js';
import { uploadServiceImageSingle } from '../config/multerServiceImages.js';

const router = express.Router();

// @route   POST /api/services
// @desc    Create new service
// @access  Admin (will add auth middleware later)
router.post('/', createService);
router.post('/upload-image', uploadServiceImageSingle, uploadServiceImage);

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

// @route   PUT /api/services/:id
// @desc    Update service
// @access  Admin (will add auth middleware later)
router.put('/:id', updateService);

// @route   DELETE /api/services/:id
// @desc    Delete service
// @access  Admin (will add auth middleware later)
router.delete('/:id', deleteService);

export default router;
