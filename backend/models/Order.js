import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true,
  },
  serviceName: {
    type: String,
    default: '',
    trim: true,
  },
  addOns: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
  }],
  packageType: {
    type: String,
    enum: ['OneTime', 'Monthly', 'Quarterly', 'Yearly', 'Membership'],
    default: 'OneTime',
  },
  packageTimes: {
    type: Number,
    default: 1,
  },
  scheduledDate: {
    type: Date,
    required: function() {
      return this.packageType === 'OneTime';
    },
  },
  scheduledTimeSlot: {
    type: String,
    required: function() {
      return this.packageType === 'OneTime';
    },
  },
  // For package orders: array of scheduled slots
  scheduledSlots: [{
    scheduledDate: { type: Date, required: true },
    scheduledTimeSlot: { type: String, required: true },
  }],
  // For custom monthly package flow (customer app)
  customPackage: {
    packageStartDate: { type: Date },
    packageDurationDays: { type: Number, min: 1 },
    packageTimeSlot: { type: String, default: '' },
    interiorDates: { type: [Date], default: [] },
    exteriorDates: { type: [Date], default: [] },
    dailyMode: { type: String, default: '' },
    pricingKey: { type: String, default: '' },
    packagePrice: { type: Number, min: 0 },
    pricingVersion: { type: Date },
  },
  unitPrice: {
    type: Number,
    required: true,
  },
  addOnsTotal: {
    type: Number,
    required: true,
  },
  lineTotal: {
    type: Number,
    required: true,
  },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  /** Customer-facing id (e.g. ORD00001042). Set at create; searchable in Mongo. */
  orderNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    index: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  items: {
    type: [orderItemSchema],
    required: true,
  },
  subtotal: {
    type: Number,
    required: true,
  },
  tax: {
    type: Number,
    required: true,
  },
  couponCode: {
    type: String,
    default: '',
  },
  couponDiscount: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  // Wallet usage for this order
  walletUsed: {
    type: Number,
    default: 0,
  },
  // Final amount after wallet and discounts (for future payment integrations)
  netAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Paid', 'Scheduled', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Pending',
    index: true,
  },
  customer: {
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    vehicleType: { type: String, default: '' },
    vehicleModel: { type: String, default: '' },
    latitude: { type: Number },
    longitude: { type: Number },
  },
  assignmentStatus: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'completed'],
    default: 'pending',
    index: true,
  },
  assignedEmployeeId: {
    type: String,
    default: '',
    index: true,
  },
  assignments: [{
    employeeId: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'completed'],
      default: 'pending',
    },
    assignedAt: { type: Date, default: Date.now },
    acceptedAt: { type: Date },
    declinedAt: { type: Date },
    completedAt: { type: Date },
  }],
  employeeLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
    updatedAt: { type: Date },
  },
  startOtp: { type: String, default: '' },
  startOtpExpiresAt: { type: Date },
  // Before/after photos uploaded by employee during service
  servicePhotos: {
    beforePhotos: { type: [String], default: [] },
    afterPhotos: { type: [String], default: [] },
  },
  // Customer rating after service is completed
  rating: { type: Number, min: 1, max: 5 },
  review: { type: String, default: '' },
  ratedAt: { type: Date },
}, {
  timestamps: true,
});

const Order = mongoose.model('Order', orderSchema);

export default Order;
