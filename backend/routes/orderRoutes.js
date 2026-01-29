import express from 'express';
import { createOrder, getOrderById, getOrders, updateEmployeeLocation, updateOrderStatus } from '../controllers/orderController.js';

const router = express.Router();

router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrderById);
router.patch('/:id/employee-location', updateEmployeeLocation);
router.patch('/:id', updateOrderStatus);

export default router;
