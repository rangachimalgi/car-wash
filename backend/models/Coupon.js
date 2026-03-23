import mongoose from 'mongoose';

const couponUsageSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, trim: true },
    count: { type: Number, default: 0 },
  },
  { _id: false }
);

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    discountType: {
      type: String,
      enum: ['FLAT', 'PERCENT'],
      default: 'FLAT',
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
    expiryDate: {
      type: Date,
    },
    usageLimit: {
      type: Number,
      default: 0,
      min: 0,
    },
    perUserLimit: {
      type: Number,
      default: 1,
      min: 0,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    usageByPhone: {
      type: [couponUsageSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

const Coupon = mongoose.model('Coupon', couponSchema);

export default Coupon;
