import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    default: '',
    trim: true,
  },
  address: {
    type: String,
    default: '',
    trim: true,
  },
  vehicleType: {
    type: String,
    default: '',
    trim: true,
  },
  vehicleModel: {
    type: String,
    default: '',
    trim: true,
  },
  vehicles: [{
    vehicleType: {
      type: String,
      required: true,
      trim: true,
    },
    vehicleModel: {
      type: String,
      required: true,
      trim: true,
    },
    isSelected: {
      type: Boolean,
      default: false,
    },
  }],
  selectedVehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

const User = mongoose.model('User', userSchema);

export default User;
