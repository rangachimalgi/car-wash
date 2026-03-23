import express from 'express';
import { createCoupon, listCoupons, validateCoupon } from '../controllers/couponController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', listCoupons);
router.post('/', createCoupon);
router.post('/validate', protect, validateCoupon);

export default router;
