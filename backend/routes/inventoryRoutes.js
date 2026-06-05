import express from 'express';
import {
  getInventory,
  getInventoryById,
  createInventoryItem,
  updateInventoryItem,
  updateStock,
  getInventoryUsageHistory,
  recordInventoryUsage,
  createRefillRequest,
  getRefillRequests,
  reviewRefillRequest,
  deleteInventoryItem,
} from '../controllers/inventoryController.js';

const router = express.Router();

// @route   GET /api/inventory
// @desc    Get all inventory items (with filters: category, lowStock, search)
// @access  Admin
router.get('/', getInventory);

router.get('/refill-requests', getRefillRequests);
router.patch('/refill-requests/:requestId', reviewRefillRequest);

router.get('/:id/usage', getInventoryUsageHistory);
router.post('/:id/usage', recordInventoryUsage);
router.post('/:id/refill-request', createRefillRequest);

// @route   GET /api/inventory/:id
// @desc    Get single inventory item by ID
// @access  Admin
router.get('/:id', getInventoryById);

// @route   POST /api/inventory
// @desc    Create new inventory item
// @access  Admin
router.post('/', createInventoryItem);

// @route   PUT /api/inventory/:id
// @desc    Update inventory item
// @access  Admin
router.put('/:id', updateInventoryItem);

// @route   PATCH /api/inventory/:id/stock
// @desc    Update stock (add/remove)
// @access  Admin
router.patch('/:id/stock', updateStock);

// @route   DELETE /api/inventory/:id
// @desc    Delete inventory item
// @access  Admin
router.delete('/:id', deleteInventoryItem);

export default router;
