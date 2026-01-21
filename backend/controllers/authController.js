import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const FIXED_OTP = '1234';

// @desc    Request OTP (fixed for now)
// @route   POST /api/auth/request-otp
// @access  Public
export const requestOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent',
      otp: FIXED_OTP,
    });
  } catch (error) {
    console.error('Error requesting OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Error requesting OTP',
      error: error.message,
    });
  }
};

// @desc    Verify OTP and login
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOtp = async (req, res) => {
  try {
    const { phone, otp, name } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone and OTP are required',
      });
    }

    if (otp !== FIXED_OTP) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
      });
    }

    let user = await User.findOne({ phone });
    if (!user) {
      user = await User.create({ phone, name: name?.trim?.() || '' });
    } else if (name && name.trim()) {
      user.name = name.trim();
      await user.save();
    }

    const token = jwt.sign(
      { userId: user._id, phone: user.phone },
      process.env.JWT_SECRET || 'dev_secret',
      { expiresIn: '30d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying OTP',
      error: error.message,
    });
  }
};
