import express from 'express';
import { createOrder, getOrderById, getOrders, updateEmployeeLocation, updateOrderStatus } from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';

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
router.get('/', protect, getOrders);
router.get('/:id', conditionalProtect, getOrderById);
router.patch('/:id/employee-location', conditionalProtect, updateEmployeeLocation);
router.patch('/:id', conditionalProtect, updateOrderStatus);

export default router;
