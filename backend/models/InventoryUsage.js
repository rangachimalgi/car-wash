import mongoose from 'mongoose';

const inventoryUsageSchema = new mongoose.Schema(
  {
    inventoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
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
    orderNumber: {
      type: String,
      trim: true,
      default: '',
    },
    jobLabel: {
      type: String,
      trim: true,
      default: '',
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

inventoryUsageSchema.index({ inventoryId: 1, createdAt: -1 });
inventoryUsageSchema.index({ orderId: 1, createdAt: -1 });

const InventoryUsage = mongoose.model('InventoryUsage', inventoryUsageSchema);

export default InventoryUsage;
