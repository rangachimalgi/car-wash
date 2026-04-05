import mongoose from 'mongoose';

const employeeUpsellConfigSchema = new mongoose.Schema(
  {
    /** Pre-tax add-on sales in the period must reach this for commission to apply */
    targetAmount: {
      type: Number,
      default: 3000,
      min: 0,
    },
    commissionPercent: {
      type: Number,
      default: 10,
      min: 0,
      max: 100,
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
    },
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

const EmployeeUpsellConfig = mongoose.model('EmployeeUpsellConfig', employeeUpsellConfigSchema);

export default EmployeeUpsellConfig;
