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
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

const User = mongoose.model('User', userSchema);

export default User;
