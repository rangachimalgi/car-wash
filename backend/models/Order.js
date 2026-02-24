import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true,
  },
  addOns: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
  }],
  packageType: {
    type: String,
    enum: ['OneTime', 'Monthly', 'Quarterly', 'Yearly'],
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
  totalAmount: {
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
  // Customer rating after service is completed
  rating: { type: Number, min: 1, max: 5 },
  review: { type: String, default: '' },
  ratedAt: { type: Date },
}, {
  timestamps: true,
});

const Order = mongoose.model('Order', orderSchema);

export default Order;
