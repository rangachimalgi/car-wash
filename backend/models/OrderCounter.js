import mongoose from 'mongoose';

/** Global sequence for customer-facing order numbers (ORD00000001, …). */
const orderCounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const OrderCounter = mongoose.model('OrderCounter', orderCounterSchema);

export default OrderCounter;
