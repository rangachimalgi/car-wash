import mongoose from 'mongoose';

const employeeIncentiveConfigSchema = new mongoose.Schema(
  {
    periodType: {
      type: String,
      enum: ['daily', 'weekly'],
      default: 'weekly',
    },
    /** Services completed at or below target earn no extra; each service above target earns amountPerExtraService */
    targetCount: {
      type: Number,
      default: 4,
      min: 0,
    },
    amountPerExtraService: {
      type: Number,
      default: 100,
      min: 0,
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
    },
    /** ISO weekStartsOn: 1 = Monday */
    weekStartsOn: {
      type: Number,
      default: 1,
      min: 0,
      max: 6,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const EmployeeIncentiveConfig = mongoose.model('EmployeeIncentiveConfig', employeeIncentiveConfigSchema);

export default EmployeeIncentiveConfig;
