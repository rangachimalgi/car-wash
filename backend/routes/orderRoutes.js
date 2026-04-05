import express from 'express';
import { createOrder, getOrderById, getOrders, getAllOrders, getRatedOrders, updateEmployeeLocation, updateOrderStatus, rateOrder, requestStartOtp, verifyStartOtp, uploadOrderPhotos, addUpsellAddOnsToOrder } from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadOrderPhotosMulter } from '../config/multerOrderPhotos.js';

const router = express.Router();

// Middleware to conditionally protect routes for employee access
const conditionalProtect = (req, res, next) => {
  // Allow employee access via employeeId query param without auth
  if (req.query.employeeId) {
    return next();
  }
  // Otherwise require auth
  return protect(req, res, next);
};

router.post('/', protect, createOrder);
router.get('/admin/all', getAllOrders); // Admin route - no auth required
router.get('/admin/reviews', getRatedOrders); // Admin reviews tab
router.get('/', protect, getOrders);
router.get('/:id', conditionalProtect, getOrderById);
router.post('/:id/request-start-otp', conditionalProtect, requestStartOtp);
router.post('/:id/verify-start-otp', conditionalProtect, verifyStartOtp);
router.patch('/:id/employee-location', conditionalProtect, updateEmployeeLocation);
router.post('/:id/photos', conditionalProtect, uploadOrderPhotosMulter, uploadOrderPhotos);
router.patch('/:id', conditionalProtect, updateOrderStatus);
router.post('/:id/rate', protect, rateOrder);
router.post('/:id/upsell-addons', protect, addUpsellAddOnsToOrder);

export default router;
