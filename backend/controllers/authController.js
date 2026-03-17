import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Referral from '../models/Referral.js';

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
    const { phone, otp, name, referralCode } = req.body;
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
    const trimmedName = name?.trim?.() || '';

    if (!user) {
      // New user – optionally link referral
      let referredByUserId = null;

      if (referralCode && typeof referralCode === 'string' && referralCode.trim()) {
        const referrer = await User.findOne({ referralCode: referralCode.trim() });
        if (referrer && referrer.phone !== phone) {
          referredByUserId = referrer._id;
        }
      }

      user = await User.create({
        phone,
        name: trimmedName,
        referredByUserId: referredByUserId || null,
      });

      if (referredByUserId) {
        const REFERRAL_BONUS_REFERRER = Number(process.env.REFERRAL_BONUS_REFERRER || 100);
        const REFERRAL_BONUS_REFERRED = Number(process.env.REFERRAL_BONUS_REFERRED || 100);

        try {
          await Referral.create({
            referrerUserId: referredByUserId,
            referredUserId: user._id,
            status: 'PENDING',
            referrerRewardAmount: REFERRAL_BONUS_REFERRER,
            referredRewardAmount: REFERRAL_BONUS_REFERRED,
          });
        } catch (referralError) {
          console.warn('Error creating referral record:', referralError.message);
        }
      }
    } else {
      if (trimmedName) {
        user.name = trimmedName;
      }
      // Existing user – ignore referralCode for now to avoid abuse
      await user.save();
    }

    const token = jwt.sign(
      { userId: user._id, phone: user.phone },
      process.env.JWT_SECRET || 'dev_secret',
      { expiresIn: '180d' } // 6 months
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
