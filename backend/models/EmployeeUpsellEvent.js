import mongoose from 'mongoose';

/** One row per upsell batch: pre-tax add-on rupees attributed to employee */
const employeeUpsellEventSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, index: true },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    /** Sum of new add-on base prices (pre-tax) for this upsell */
    amount: { type: Number, required: true, min: 0 },
    /** Customer must add from Bookings → Upcoming → Book; API enforces entrySource */
    entrySource: { type: String, default: 'upcoming_bookings' },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

employeeUpsellEventSchema.index({ employeeId: 1, createdAt: 1 });

const EmployeeUpsellEvent = mongoose.model('EmployeeUpsellEvent', employeeUpsellEventSchema);

export default EmployeeUpsellEvent;
