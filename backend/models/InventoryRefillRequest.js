import mongoose from 'mongoose';

const inventoryRefillRequestSchema = new mongoose.Schema(
  {
    inventoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true,
      index: true,
    },
    employeeId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [0.01, 'Quantity must be greater than 0'],
    },
    unit: {
      type: String,
      trim: true,
      default: 'units',
    },
    reason: {
      type: String,
      required: true,
      enum: ['Low Stock', 'Damaged', 'High Usage', 'Other'],
      default: 'Low Stock',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'fulfilled', 'rejected'],
      default: 'pending',
      index: true,
    },
    itemName: {
      type: String,
      trim: true,
      default: '',
    },
    currentStockAtRequest: {
      type: Number,
      min: 0,
    },
    reviewedAt: {
      type: Date,
    },
    adminNote: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

inventoryRefillRequestSchema.index({ createdAt: -1 });
inventoryRefillRequestSchema.index({ status: 1, createdAt: -1 });

const InventoryRefillRequest = mongoose.model(
  'InventoryRefillRequest',
  inventoryRefillRequestSchema
);

export default InventoryRefillRequest;
