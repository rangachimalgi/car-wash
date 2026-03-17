import mongoose from 'mongoose';

const referralSchema = new mongoose.Schema(
  {
    referrerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    referredUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'REJECTED'],
      default: 'PENDING',
    },
    referrerRewardAmount: {
      type: Number,
      default: 0,
    },
    referredRewardAmount: {
      type: Number,
      default: 0,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

referralSchema.index({ referrerUserId: 1, referredUserId: 1 }, { unique: true });

const Referral = mongoose.model('Referral', referralSchema);

export default Referral;

