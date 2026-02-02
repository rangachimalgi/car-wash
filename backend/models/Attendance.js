import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    trim: true,
    ref: 'Employee',
  },
  date: {
    type: Date,
    required: true,
    // Store date only (YYYY-MM-DD), time will be set to 00:00:00
  },
  checkIn: {
    type: Date,
    required: true,
  },
  location: {
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
  },
  notes: {
    type: String,
    default: null,
    trim: true,
  },
}, {
  timestamps: true,
});

// Create compound unique index on employeeId + date (one attendance per employee per day)
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

// Index for efficient queries
attendanceSchema.index({ employeeId: 1, date: -1 });
attendanceSchema.index({ date: -1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;
