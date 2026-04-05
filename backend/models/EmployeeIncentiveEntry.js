import mongoose from 'mongoose';

const employeeIncentiveEntrySchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, index: true },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    periodKey: { type: String, required: true },
    periodType: { type: String, enum: ['daily', 'weekly'], required: true },
    amount: { type: Number, required: true, min: 0 },
    /** Completed job count in period including this order */
    countInPeriod: { type: Number, required: true },
    targetSnapshot: { type: Number, required: true },
    rateSnapshot: { type: Number, required: true },
    completedAt: { type: Date, required: true },
  },
  { timestamps: true }
);

employeeIncentiveEntrySchema.index({ employeeId: 1, orderId: 1 }, { unique: true });

const EmployeeIncentiveEntry = mongoose.model('EmployeeIncentiveEntry', employeeIncentiveEntrySchema);

export default EmployeeIncentiveEntry;
