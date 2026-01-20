import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Service description is required'],
    trim: true,
  },
  category: {
    type: String,
    required: [true, 'Service category is required'],
    enum: ['CarWash', 'BikeWash', 'AddOn'],
    index: true,
  },
  basePrice: {
    type: Number,
    required: [true, 'Base price is required'],
    min: [0, 'Price must be positive'],
  },
  duration: {
    type: String,
    required: [true, 'Duration is required'],
    default: '30 mins',
  },
  image: {
    type: String,
    default: '',
  },
  images: {
    type: [String],
    default: [],
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  totalReviews: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  // For admin tracking
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  // Additional metadata
  specifications: {
    coverage: [String], // e.g., ["Exterior", "Interior"] - What's included
    notIncluded: [String], // e.g., ["Dashboard Polish", "Air Freshener"] - What's not included
  },
  // Add-on services that can be added to this service
  addOnServices: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
  }],
  // Pricing packages (monthly, quarterly, yearly)
  packages: {
    monthly: [{
      times: { type: Number, required: true }, // e.g., 2, 4, 6, 8
      discount: { type: Number, required: true }, // e.g., 5, 10, 15, 20
      price: { type: Number, required: true }, // Total price for the package
      perWash: { type: Number, required: true }, // Price per wash
    }],
    quarterly: [{
      times: { type: Number, required: true }, // e.g., 6, 12, 18
      discount: { type: Number, required: true }, // e.g., 15, 20, 25
      price: { type: Number, required: true }, // Total price for 3 months
      perWash: { type: Number, required: true }, // Price per wash
    }],
    yearly: [{
      times: { type: Number, required: true }, // e.g., 24, 36, 48
      discount: { type: Number, required: true }, // e.g., 25, 30, 35
      price: { type: Number, required: true }, // Total price for 12 months
      perWash: { type: Number, required: true }, // Price per wash
    }],
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
serviceSchema.index({ category: 1, isActive: 1 });
serviceSchema.index({ rating: -1, totalReviews: -1 });

const Service = mongoose.model('Service', serviceSchema);

export default Service;
