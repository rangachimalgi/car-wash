import User from '../models/User.js';

// @desc    Update user vehicle info
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
