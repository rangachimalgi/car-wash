import User from '../models/User.js';
import Referral from '../models/Referral.js';
import { sendTestPush } from '../services/pushNotificationService.js';

// @desc    Update current user's Expo push token (for start-service OTP notifications)
// @route   PUT /api/users/me/push-token
// @access  Protected
export const updatePushToken = async (req, res) => {
  try {
    const expoPushToken = (req.body?.expoPushToken ?? req.body?.pushToken ?? '').toString().trim();
    const valid =
      expoPushToken.startsWith('ExponentPushToken[') || expoPushToken.startsWith('ExpoPushToken[');

    if (!valid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing Expo push token',
      });
    }

    await User.findByIdAndUpdate(req.user._id, { expoPushToken });
    if (process.env.NODE_ENV !== 'production') {
      console.log('[push-token] Saved for user', req.user._id, expoPushToken.slice(0, 24) + '…');
    }
    res.status(200).json({ success: true, message: 'Push token updated' });
  } catch (error) {
    console.error('Error updating push token:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating push token',
      error: error.message,
    });
  }
};

// @desc    Send test push to current user (kill app first to verify background delivery)
// @route   POST /api/users/me/test-push
// @access  Protected
export const sendTestPushNotification = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('expoPushToken');
    const token = (user?.expoPushToken || '').trim();
    if (!token) {
      return res.status(400).json({ success: false, message: 'No push token saved — log in and allow notifications' });
    }
    const result = await sendTestPush(token, {
      title: req.body?.title || 'Woosh test',
      body: req.body?.body || 'If you see this with the app closed, push works!',
    });
    if (!result.ok) {
      return res.status(502).json({ success: false, message: result.reason, details: result.details });
    }
    res.status(200).json({ success: true, message: 'Test push sent', ticketId: result.ticketId });
  } catch (error) {
    console.error('Error sending test push:', error);
    res.status(500).json({ success: false, message: 'Error sending test push', error: error.message });
  }
};

// @desc    Update user vehicle info (legacy - for backward compatibility)
// @route   PUT /api/users/vehicle
// @access  Public (will add auth later)
export const updateUserVehicle = async (req, res) => {
  try {
    const { phone, vehicleType, vehicleModel } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
      });
    }

    const user = await User.findOneAndUpdate(
      { phone },
      {
        $set: {
          vehicleType: vehicleType || '',
          vehicleModel: vehicleModel || '',
        },
        $setOnInsert: { phone },
      },
      { new: true, upsert: true }
    );

    // Also add to vehicles array if not exists
    if (vehicleType && vehicleModel) {
      const vehicleExists = user.vehicles.some(
        v => v.vehicleType === vehicleType && v.vehicleModel === vehicleModel
      );
      
      if (!vehicleExists) {
        user.vehicles.push({
          vehicleType,
          vehicleModel,
          isSelected: true,
        });
        // Unselect other vehicles
        user.vehicles.forEach(v => {
          if (v.vehicleType !== vehicleType || v.vehicleModel !== vehicleModel) {
            v.isSelected = false;
          }
        });
        await user.save();
      }
    }

    res.status(200).json({
      success: true,
      data: {
        phone: user.phone,
        vehicleType: user.vehicleType,
        vehicleModel: user.vehicleModel,
      },
    });
  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating vehicle',
      error: error.message,
    });
  }
};

// @desc    Get all vehicles for a user
// @route   GET /api/users/:phone/vehicles
// @access  Public
export const getVehicles = async (req, res) => {
  try {
    const { phone } = req.params;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
      });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    // Ensure vehicles have proper _id fields and are properly serialized
    const vehicles = (user.vehicles || []).map(vehicle => ({
      _id: vehicle._id,
      vehicleType: vehicle.vehicleType,
      vehicleModel: vehicle.vehicleModel,
      isSelected: vehicle.isSelected || false,
    }));

    console.log(`Returning ${vehicles.length} vehicles for phone ${phone}`);

    res.status(200).json({
      success: true,
      data: vehicles,
    });
  } catch (error) {
    console.error('Error getting vehicles:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting vehicles',
      error: error.message,
    });
  }
};

// @desc    Add a new vehicle
// @route   POST /api/users/:phone/vehicles
// @access  Public
export const addVehicle = async (req, res) => {
  try {
    const { phone } = req.params;
    const { vehicleType, vehicleModel } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
      });
    }

    if (!vehicleType || !vehicleModel) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle type and model are required',
      });
    }

    const user = await User.findOneAndUpdate(
      { phone },
      {
        $setOnInsert: { phone },
        $push: {
          vehicles: {
            vehicleType,
            vehicleModel,
            isSelected: false,
          },
        },
      },
      { new: true, upsert: true }
    );

    const newVehicle = user.vehicles[user.vehicles.length - 1];

    res.status(200).json({
      success: true,
      data: newVehicle,
    });
  } catch (error) {
    console.error('Error adding vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding vehicle',
      error: error.message,
    });
  }
};

// @desc    Delete a vehicle
// @route   DELETE /api/users/:phone/vehicles/:vehicleId
// @access  Public
export const deleteVehicle = async (req, res) => {
  try {
    const { phone, vehicleId } = req.params;

    if (!phone || !vehicleId) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and vehicle ID are required',
      });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.vehicles = user.vehicles.filter(
      v => v._id.toString() !== vehicleId
    );

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Vehicle deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting vehicle',
      error: error.message,
    });
  }
};

// @desc    Set selected vehicle
// @route   PUT /api/users/:phone/vehicles/:vehicleId/select
// @access  Public
export const setSelectedVehicle = async (req, res) => {
  try {
    const { phone, vehicleId } = req.params;

    if (!phone || !vehicleId) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and vehicle ID are required',
      });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Unselect all vehicles
    user.vehicles.forEach(v => {
      v.isSelected = v._id.toString() === vehicleId;
    });

    user.selectedVehicleId = vehicleId;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Vehicle selected successfully',
    });
  } catch (error) {
    console.error('Error setting selected vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting selected vehicle',
      error: error.message,
    });
  }
};

// @desc    Get wallet details for a user
// @route   GET /api/users/:phone/wallet
// @access  Public (tied to phone-based auth on client)
export const getWallet = async (req, res) => {
  try {
    const { phone } = req.params;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
      });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(200).json({
        success: true,
        data: {
          walletBalance: 0,
          transactions: [],
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        walletBalance: user.walletBalance || 0,
        // Only return latest 20 transactions for now
        transactions: (user.walletTransactions || []).slice(-20).reverse(),
      },
    });
  } catch (error) {
    console.error('Error getting wallet:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting wallet',
      error: error.message,
    });
  }
};

// @desc    Credit wallet for a user (admin action)
// @route   POST /api/users/:phone/wallet/credit
// @access  Public for now (lock down later when admin auth is ready)
export const creditWallet = async (req, res) => {
  try {
    const { phone } = req.params;
    const { amount, note } = req.body;

    const numericAmount = Number(amount);

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
      });
    }

    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than zero',
      });
    }

    let user = await User.findOne({ phone });
    if (!user) {
      user = await User.create({ phone });
    }

    const previousBalance = user.walletBalance || 0;
    const newBalance = previousBalance + numericAmount;

    user.walletBalance = newBalance;
    user.walletTransactions = user.walletTransactions || [];
    user.walletTransactions.push({
      amount: numericAmount,
      type: 'CREDIT',
      source: 'ADMIN',
      note: note || '',
      balanceAfter: newBalance,
    });

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        walletBalance: user.walletBalance,
      },
    });
  } catch (error) {
    console.error('Error crediting wallet:', error);
    res.status(500).json({
      success: false,
      message: 'Error crediting wallet',
      error: error.message,
    });
  }
};

// @desc    Get referral info for a user (by phone)
// @route   GET /api/users/:phone/referral-info
// @access  Public (tied to phone-based auth on client)
export const getReferralInfo = async (req, res) => {
  try {
    const { phone } = req.params;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
      });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Ensure referralCode exists
    if (!user.referralCode) {
      const base = 'WOOSH';
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      const candidate = `${base}${random}`;

      // Very low chance of collision; if it happens, next request will regenerate
      user.referralCode = candidate;
      try {
        await user.save();
      } catch (e) {
        console.warn('Error saving referralCode, possibly duplicate:', e.message);
      }
    }

    // Aggregate completed referrals
    const completedReferrals = await Referral.find({
      referrerUserId: user._id,
      status: 'COMPLETED',
    });

    const totalReferrals = completedReferrals.length;
    const totalReferralEarnings = completedReferrals.reduce(
      (sum, r) => sum + (r.referrerRewardAmount || 0),
      0
    );

    const REFERRAL_BONUS_REFERRER = Number(process.env.REFERRAL_BONUS_REFERRER || 100);
    const REFERRAL_BONUS_REFERRED = Number(process.env.REFERRAL_BONUS_REFERRED || 100);
    const REFERRAL_ACTIVE = (process.env.REFERRAL_ACTIVE || 'true').toLowerCase() === 'true';

    return res.status(200).json({
      success: true,
      data: {
        referralCode: user.referralCode,
        totalReferrals,
        totalReferralEarnings,
        perReferralRewardReferrer: REFERRAL_BONUS_REFERRER,
        perReferralRewardReferred: REFERRAL_BONUS_REFERRED,
        referralActive: REFERRAL_ACTIVE,
      },
    });
  } catch (error) {
    console.error('Error getting referral info:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting referral info',
      error: error.message,
    });
  }
};
