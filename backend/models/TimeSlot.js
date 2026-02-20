import mongoose from 'mongoose';

const timeSlotSchema = new mongoose.Schema({
  time: {
    type: String,
    required: [true, 'Time slot is required'],
    unique: true,
    trim: true,
    // Format: "9:00 AM - 10:00 AM"
  },
  startTime: {
    type: String,
    required: true,
    // Format: "09:00" (24-hour format for sorting)
  },
  endTime: {
    type: String,
    required: true,
    // Format: "10:00" (24-hour format for sorting)
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    required: true,
    // For sorting slots in order
  },
  // Default number of slots per day (usually 10)
  defaultSlotsPerDay: {
    type: Number,
    default: 10,
    min: 1,
    max: 24,
  },
}, {
  timestamps: true,
});

// Index for faster queries
timeSlotSchema.index({ order: 1 });
timeSlotSchema.index({ isActive: 1 });

const TimeSlot = mongoose.model('TimeSlot', timeSlotSchema);

export default TimeSlot;
