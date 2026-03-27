import mongoose from 'mongoose';

const pricingMatrixSchema = new mongoose.Schema(
  {
    i1_e1_daily: { type: Number, required: true, min: 0 },
    i1_e1_alternate: { type: Number, required: true, min: 0 },
    i1_e2_daily: { type: Number, required: true, min: 0 },
    i1_e2_alternate: { type: Number, required: true, min: 0 },
    i2_e1_daily: { type: Number, required: true, min: 0 },
    i2_e1_alternate: { type: Number, required: true, min: 0 },
    i2_e2_daily: { type: Number, required: true, min: 0 },
    i2_e2_alternate: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const packageCardSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    image: { type: String, default: '', trim: true },
    times: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    addOnServiceIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Service',
      default: [],
    },
    coverageIncluded: {
      type: [String],
      default: [],
    },
    coverageNotIncluded: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const packagePricingSchema = new mongoose.Schema(
  {
    app: {
      type: String,
      enum: ['customer'],
      default: 'customer',
      index: true,
    },
    vehicleType: {
      type: String,
      enum: ['car', 'bike'],
      default: 'car',
      index: true,
    },
    durationDays: {
      type: Number,
      default: 30,
      min: 1,
    },
    timeSlots: {
      type: [String],
      default: ['7:00 AM - 8:00 AM', '8:00 AM - 9:00 AM', '10:00 AM - 11:00 AM'],
    },
    pricingMatrix: {
      type: pricingMatrixSchema,
      required: true,
    },
    packageCards: {
      type: [packageCardSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

packagePricingSchema.index({ app: 1, vehicleType: 1 }, { unique: true });

const PackagePricing = mongoose.model('PackagePricing', packagePricingSchema);

export default PackagePricing;
