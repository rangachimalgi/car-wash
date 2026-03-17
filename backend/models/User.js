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
  walletBalance: {
    type: Number,
    default: 0,
    min: 0,
  },
  walletTransactions: [
    {
      amount: {
        type: Number,
        required: true,
      },
      type: {
        type: String,
        enum: ['CREDIT', 'DEBIT'],
        required: true,
      },
      source: {
        type: String,
        default: 'ADMIN',
        trim: true,
      },
      note: {
        type: String,
        default: '',
        trim: true,
      },
      balanceAfter: {
        type: Number,
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
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
  expoPushToken: { type: String, default: '' },
  isActive: {
    type: Boolean,
    default: true,
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },
  referredByUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  referralStats: {
    totalReferrals: {
      type: Number,
      default: 0,
    },
    totalReferralEarnings: {
      type: Number,
      default: 0,
    },
  },
}, {
  timestamps: true,
});

const User = mongoose.model('User', userSchema);

export default User;
