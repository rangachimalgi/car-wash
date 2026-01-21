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
    required: true,
  },
  scheduledTimeSlot: {
    type: String,
    required: true,
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
    enum: ['Pending', 'Paid', 'Scheduled', 'Completed', 'Cancelled'],
    default: 'Pending',
    index: true,
  },
  customer: {
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
  },
}, {
  timestamps: true,
});

const Order = mongoose.model('Order', orderSchema);

export default Order;
