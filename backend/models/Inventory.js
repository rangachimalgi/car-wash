import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    index: true,
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Soap', 'Towels', 'Polish', 'Equipment', 'Other'],
    index: true,
  },
  currentStock: {
    type: Number,
    required: [true, 'Current stock is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0,
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    trim: true,
    default: 'units',
  },
  maxCapacity: {
    type: Number,
    min: [0, 'Max capacity cannot be negative'],
    default: null,
  },
  lowStockThreshold: {
    type: Number,
    required: [true, 'Low stock threshold is required'],
    min: [0, 'Threshold cannot be negative'],
    default: 10,
  },
  isLowStock: {
    type: Boolean,
    default: false,
    index: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  supplier: {
    type: String,
    trim: true,
    default: '',
  },
  lastRestocked: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Calculate isLowStock before saving
inventorySchema.pre('save', async function() {
  if (this.currentStock !== undefined && this.lowStockThreshold !== undefined) {
    this.isLowStock = this.currentStock <= this.lowStockThreshold;
  }
});

// Index for better query performance
inventorySchema.index({ category: 1, isLowStock: 1 });
inventorySchema.index({ isLowStock: 1 });

const Inventory = mongoose.model('Inventory', inventorySchema);

export default Inventory;
