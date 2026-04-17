import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  address: {
    type: String,
    required: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  pushToken: {
    type: String,
    default: '',
    trim: true,
  },
  documentsUploaded: {
    type: Boolean,
    default: false,
  },
  aadharPath: { type: String, default: '' },
  panPath: { type: String, default: '' },
}, {
  timestamps: true,
});

const Employee = mongoose.model('Employee', employeeSchema);

export default Employee;
