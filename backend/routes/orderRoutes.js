import express from 'express';
import { createOrder, getOrderById, getOrders } from '../controllers/orderController.js';

const router = express.Router();

router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrderById);

export default router;
