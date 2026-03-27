import express from 'express';
import { getPackagePricing, upsertPackagePricing } from '../controllers/packagePricingController.js';

const router = express.Router();

// @route   GET /api/package-pricing
// @desc    Get package pricing config
// @access  Public
router.get('/', getPackagePricing);

// @route   PUT /api/package-pricing
// @desc    Save package pricing config
// @access  Admin (auth middleware can be added later)
router.put('/', upsertPackagePricing);

export default router;
