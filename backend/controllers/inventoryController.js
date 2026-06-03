import Inventory from '../models/Inventory.js';
import InventoryUsage from '../models/InventoryUsage.js';
import Order from '../models/Order.js';

function buildJobLabel(order) {
  if (!order) return 'Job';
  const parts = [];
  if (order.orderNumber) parts.push(order.orderNumber);
  const vehicle = [order.customer?.vehicleType, order.customer?.vehicleModel]
    .filter(Boolean)
    .join(' ');
  if (vehicle) parts.push(vehicle);
  else if (order.customer?.name) parts.push(order.customer.name);
  return parts.join(' · ') || 'Job';
}

// @desc    Get all inventory items (with optional filters)
// @route   GET /api/inventory
// @access  Admin
export const getInventory = async (req, res) => {
  try {
    const { category, lowStock, search } = req.query;

    // Build query
    const query = {};

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by low stock
    if (lowStock === 'true') {
      query.isLowStock = true;
    }

    // Search by name
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const items = await Inventory.find(query)
      .sort({ isLowStock: -1, name: 1 }) // Low stock items first, then alphabetically
      .select('-__v');

    res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory',
      error: error.message,
    });
  }
};

// @desc    Get single inventory item by ID
// @route   GET /api/inventory/:id
// @access  Admin
export const getInventoryById = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id).select('-__v');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
      });
    }

    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid inventory item ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error fetching inventory item',
      error: error.message,
    });
  }
};

// @desc    Create new inventory item
// @route   POST /api/inventory
// @access  Admin
export const createInventoryItem = async (req, res) => {
  try {
    const {
      name,
      category,
      currentStock,
      unit,
      maxCapacity,
      lowStockThreshold,
      description,
      supplier,
    } = req.body;

    // Validate required fields
    if (
      !name ||
      !category ||
      currentStock === undefined ||
      !unit ||
      lowStockThreshold === undefined ||
      maxCapacity === undefined ||
      maxCapacity === null ||
      maxCapacity === ''
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Missing required fields: name, category, currentStock, unit, maxCapacity, lowStockThreshold',
      });
    }

    // Validate category
    const validCategories = ['Soap', 'Towels', 'Polish', 'Equipment', 'Other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category. Must be one of: Soap, Towels, Polish, Equipment, Other',
      });
    }

    // Validate stock and threshold
    if (currentStock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Current stock cannot be negative',
      });
    }

    if (lowStockThreshold < 0) {
      return res.status(400).json({
        success: false,
        message: 'Low stock threshold cannot be negative',
      });
    }

    const parsedMaxCapacity = Number(maxCapacity);

    if (Number.isNaN(parsedMaxCapacity) || parsedMaxCapacity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Max capacity must be greater than 0',
      });
    }

    if (Number(currentStock) > parsedMaxCapacity) {
      return res.status(400).json({
        success: false,
        message: 'Current stock cannot exceed max capacity',
      });
    }

    // Create inventory item (isLowStock will be auto-calculated by pre-save hook)
    const inventoryItem = await Inventory.create({
      name: name.trim(),
      category,
      currentStock: Number(currentStock),
      unit: unit.trim(),
      maxCapacity: parsedMaxCapacity,
      lowStockThreshold: Number(lowStockThreshold),
      description: description ? description.trim() : '',
      supplier: supplier ? supplier.trim() : '',
      lastRestocked: currentStock > 0 ? new Date() : null,
    });

    res.status(201).json({
      success: true,
      message: 'Inventory item created successfully',
      data: inventoryItem,
    });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating inventory item',
      error: error.message,
    });
  }
};

// @desc    Update inventory item
// @route   PUT /api/inventory/:id
// @access  Admin
export const updateInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      currentStock,
      unit,
      maxCapacity,
      lowStockThreshold,
      description,
      supplier,
    } = req.body;

    // Find item
    const item = await Inventory.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
      });
    }

    // Validate category if provided
    if (category) {
      const validCategories = ['Soap', 'Towels', 'Polish', 'Equipment', 'Other'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category. Must be one of: Soap, Towels, Polish, Equipment, Other',
        });
      }
    }

    // Validate stock and threshold if provided
    if (currentStock !== undefined && currentStock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Current stock cannot be negative',
      });
    }

    if (lowStockThreshold !== undefined && lowStockThreshold < 0) {
      return res.status(400).json({
        success: false,
        message: 'Low stock threshold cannot be negative',
      });
    }

    if (maxCapacity !== undefined) {
      const parsedMaxCapacity =
        maxCapacity === null || maxCapacity === '' ? null : Number(maxCapacity);

      if (parsedMaxCapacity !== null && (Number.isNaN(parsedMaxCapacity) || parsedMaxCapacity <= 0)) {
        return res.status(400).json({
          success: false,
          message: 'Max capacity must be greater than 0 when set',
        });
      }

      const stockToCheck =
        currentStock !== undefined ? Number(currentStock) : item.currentStock;

      if (parsedMaxCapacity !== null && stockToCheck > parsedMaxCapacity) {
        return res.status(400).json({
          success: false,
          message: 'Current stock cannot exceed max capacity',
        });
      }

      item.maxCapacity = parsedMaxCapacity;
    }

    if (currentStock !== undefined) {
      const newStock = Number(currentStock);
      const cap = item.maxCapacity;
      if (cap != null && cap > 0 && newStock > cap) {
        return res.status(400).json({
          success: false,
          message: 'Current stock cannot exceed max capacity',
        });
      }
    }

    // Update fields
    if (name !== undefined) item.name = name.trim();
    if (category !== undefined) item.category = category;
    if (currentStock !== undefined) item.currentStock = Number(currentStock);
    if (unit !== undefined) item.unit = unit.trim();
    if (lowStockThreshold !== undefined) item.lowStockThreshold = Number(lowStockThreshold);
    if (description !== undefined) item.description = description ? description.trim() : '';
    if (supplier !== undefined) item.supplier = supplier ? supplier.trim() : '';

    // Save (isLowStock will be auto-calculated by pre-save hook)
    await item.save();

    res.status(200).json({
      success: true,
      message: 'Inventory item updated successfully',
      data: item,
    });
  } catch (error) {
    console.error('Error updating inventory item:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages,
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid inventory item ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating inventory item',
      error: error.message,
    });
  }
};

// @desc    Update stock (add or remove)
// @route   PATCH /api/inventory/:id/stock
// @access  Admin
export const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, operation } = req.body; // operation: 'add' or 'remove'

    // Validate required fields
    if (quantity === undefined || !operation) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: quantity, operation (add/remove)',
      });
    }

    // Validate operation
    if (!['add', 'remove'].includes(operation)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid operation. Must be "add" or "remove"',
      });
    }

    // Validate quantity
    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be greater than 0',
      });
    }

    // Find item
    const item = await Inventory.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
      });
    }

    // Calculate new stock
    let newStock;
    if (operation === 'add') {
      newStock = item.currentStock + Number(quantity);
      if (item.maxCapacity != null && item.maxCapacity > 0 && newStock > item.maxCapacity) {
        return res.status(400).json({
          success: false,
          message: `Cannot exceed max capacity of ${item.maxCapacity} ${item.unit}.`,
        });
      }
      // Update lastRestocked if adding stock
      item.lastRestocked = new Date();
    } else {
      // remove
      newStock = item.currentStock - Number(quantity);
      if (newStock < 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot remove ${quantity} ${item.unit}. Only ${item.currentStock} ${item.unit} available.`,
        });
      }
    }

    // Update stock (isLowStock will be auto-calculated by pre-save hook)
    item.currentStock = newStock;
    await item.save();

    res.status(200).json({
      success: true,
      message: `Stock ${operation === 'add' ? 'added' : 'removed'} successfully`,
      data: item,
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid inventory item ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating stock',
      error: error.message,
    });
  }
};

// @desc    Get usage history for an inventory item
// @route   GET /api/inventory/:id/usage
export const getInventoryUsageHistory = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id).select('_id name');
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
      });
    }

    const logs = await InventoryUsage.find({ inventoryId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('-__v');

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    console.error('Error fetching inventory usage:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid inventory item ID',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory usage',
      error: error.message,
    });
  }
};

// @desc    Record material usage for a job (deducts stock)
// @route   POST /api/inventory/:id/usage
export const recordInventoryUsage = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, orderId, employeeId, note } = req.body;

    if (quantity === undefined || !orderId || !employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: quantity, orderId, employeeId',
      });
    }

    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be greater than 0',
      });
    }

    const item = await Inventory.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    const newStock = item.currentStock - qty;
    if (newStock < 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot use ${qty} ${item.unit}. Only ${item.currentStock} ${item.unit} available.`,
      });
    }

    item.currentStock = newStock;
    await item.save();

    const usage = await InventoryUsage.create({
      inventoryId: item._id,
      orderId: order._id,
      employeeId: String(employeeId),
      quantity: qty,
      unit: item.unit,
      orderNumber: order.orderNumber || '',
      jobLabel: buildJobLabel(order),
      note: note ? String(note).trim() : '',
    });

    res.status(201).json({
      success: true,
      message: 'Usage recorded successfully',
      data: {
        inventory: item,
        usage,
      },
    });
  } catch (error) {
    console.error('Error recording inventory usage:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid inventory or job ID',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error recording inventory usage',
      error: error.message,
    });
  }
};

// @desc    Delete inventory item
// @route   DELETE /api/inventory/:id
// @access  Admin
export const deleteInventoryItem = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
      });
    }

    await Inventory.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Inventory item deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid inventory item ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error deleting inventory item',
      error: error.message,
    });
  }
};
