import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Referral from '../models/Referral.js';

const otpSessionStore = new Map();

const normalizeIndianPhone = (phone = '') => {
  const onlyDigits = String(phone).replace(/\D/g, '');
  if (onlyDigits.length === 10) {
    return `91${onlyDigits}`;
  }
  if (onlyDigits.length === 12 && onlyDigits.startsWith('91')) {
    return onlyDigits;
  }
  return null;
};

const localPhoneFromNormalized = (normalizedPhone) => normalizedPhone.slice(-10);
const otpSessionTtlMs = () => {
  const validityMinutes = Number(process.env.OTP_VALIDITY_MINUTES || 10);
  return Math.max(1, validityMinutes) * 60 * 1000;
};
const buildSendOtpPath = (normalizedPhone) => {
  const configuredTemplate = process.env.TWOFACTOR_SEND_OTP_PATH_TEMPLATE;
  const otpLength = Number(process.env.OTP_LENGTH || 6);
  const templateName = process.env.TWOFACTOR_TEMPLATE_NAME || '';

  if (configuredTemplate) {
    return configuredTemplate
      .replaceAll('{phone}', normalizedPhone)
      .replaceAll('{otpLength}', String(otpLength))
      .replaceAll('{templateName}', templateName);
  }

  if (templateName) {
    return `SMS/${normalizedPhone}/AUTOGEN/${templateName}`;
  }

  return `SMS/${normalizedPhone}/AUTOGEN/${otpLength}`;
};

const cleanupExpiredOtpSessions = () => {
  const now = Date.now();
  for (const [phone, session] of otpSessionStore.entries()) {
    if (session.expiresAt <= now) {
      otpSessionStore.delete(phone);
    }
  }
};

const call2FactorApi = async (path) => {
  const apiKey = process.env.TWOFACTOR_API_KEY;
  if (!apiKey) {
    throw new Error('TWOFACTOR_API_KEY is not set in environment');
  }

  const baseUrl = process.env.TWOFACTOR_BASE_URL || 'https://2factor.in/API/V1';
  const response = await fetch(`${baseUrl}/${apiKey}/${path}`, { method: 'GET' });
  const payload = await response.json();

  if (!response.ok || payload?.Status !== 'Success') {
    throw new Error(payload?.Details || payload?.message || '2Factor API request failed');
  }

  return payload;
};

// @desc    Request OTP via 2Factor
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

    const normalizedPhone = normalizeIndianPhone(phone);
    if (!normalizedPhone) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid Indian phone number',
      });
    }

    cleanupExpiredOtpSessions();
    const routePath = buildSendOtpPath(normalizedPhone);

    const otpResponse = await call2FactorApi(routePath);
    const localPhone = localPhoneFromNormalized(normalizedPhone);
    otpSessionStore.set(localPhone, {
      details: otpResponse.Details,
      expiresAt: Date.now() + otpSessionTtlMs(),
    });

    res.status(200).json({
      success: true,
      message: 'OTP sent',
    });
  } catch (error) {
    console.error('Error requesting OTP:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error requesting OTP',
      error: error.message,
    });
  }
};

// @desc    Verify OTP and login via 2Factor
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

    const normalizedPhone = normalizeIndianPhone(phone);
    if (!normalizedPhone) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid Indian phone number',
      });
    }

    cleanupExpiredOtpSessions();
    const localPhone = localPhoneFromNormalized(normalizedPhone);
    const session = otpSessionStore.get(localPhone);
    if (!session || !session.details || session.expiresAt <= Date.now()) {
      otpSessionStore.delete(localPhone);
      return res.status(400).json({
        success: false,
        message: 'OTP expired or not requested. Please request OTP again.',
      });
    }

    try {
      await call2FactorApi(`SMS/VERIFY/${session.details}/${otp}`);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
        error: error.message,
      });
    }

    otpSessionStore.delete(localPhone);

    let user = await User.findOne({ phone: localPhone });
    const trimmedName = name?.trim?.() || '';

    if (!user) {
      // New user – optionally link referral
      let referredByUserId = null;

      if (referralCode && typeof referralCode === 'string' && referralCode.trim()) {
        const referrer = await User.findOne({ referralCode: referralCode.trim() });
        if (referrer && referrer.phone !== localPhone) {
          referredByUserId = referrer._id;
        }
      }

      user = await User.create({
        phone: localPhone,
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
