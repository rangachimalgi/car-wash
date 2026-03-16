import User from '../models/User.js';

// @desc    Update current user's Expo push token (for start-service OTP notifications)
// @route   PUT /api/users/me/push-token
// @access  Protected
export const updatePushToken = async (req, res) => {
  try {
    const expoPushToken = (req.body?.expoPushToken ?? '').toString().trim();
    await User.findByIdAndUpdate(req.user._id, { expoPushToken });
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
