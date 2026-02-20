import mongoose from 'mongoose';

const dailySlotOverrideSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true,
    index: true,
  },
  slots: [{
    time: {
      type: String,
      required: true,
      // Format: "9:00 AM - 10:00 AM"
    },
    startTime: {
      type: String,
      required: true,
      // Format: "09:00" (24-hour format)
    },
    endTime: {
      type: String,
      required: true,
      // Format: "10:00" (24-hour format)
    },
    order: {
      type: Number,
      required: true,
    },
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Index for faster date queries
dailySlotOverrideSchema.index({ date: 1 });

const DailySlotOverride = mongoose.model('DailySlotOverride', dailySlotOverrideSchema);

export default DailySlotOverride;
