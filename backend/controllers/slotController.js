import Order from '../models/Order.js';
import TimeSlot from '../models/TimeSlot.js';
import DailySlotOverride from '../models/DailySlotOverride.js';

/**
 * Generate default slots (10 slots, 1 hour each, starting from 9 AM)
 */
const generateDefaultSlots = (count = 10, startHour = 9) => {
  const slots = [];
  for (let i = 0; i < count; i++) {
    const hour = startHour + i;
    const nextHour = hour + 1;
    const start12h = hour > 12 ? `${hour - 12}:00 PM` : hour === 12 ? '12:00 PM' : `${hour}:00 AM`;
    const end12h = nextHour > 12 ? `${nextHour - 12}:00 PM` : nextHour === 12 ? '12:00 PM' : `${nextHour}:00 AM`;
    const start24h = String(hour).padStart(2, '0') + ':00';
    const end24h = String(nextHour).padStart(2, '0') + ':00';
    
    slots.push({
      time: `${start12h} - ${end12h}`,
      startTime: start24h,
      endTime: end24h,
      order: i + 1,
    });
  }
  return slots;
};

/**
 * Get active time slots from database, fallback to default if none exist
 */
const getTimeSlotsFromDB = async () => {
  try {
    const slots = await TimeSlot.find({ isActive: true })
      .sort({ order: 1 })
      .lean();
    
    if (slots.length > 0) {
      return slots.map(slot => ({
        id: slot._id.toString(),
        time: slot.time,
        startTime: slot.startTime,
        endTime: slot.endTime,
        order: slot.order,
      }));
    }
    
    // Fallback to default 10 slots if none in DB
    return generateDefaultSlots(10, 9);
  } catch (error) {
    console.error('Error fetching time slots from DB:', error);
    // Return default on error
    return generateDefaultSlots(10, 9);
  }
};

/**
 * Get slots for a specific date (check for override first, then use defaults)
 */
const getSlotsForDate = async (date) => {
  try {
    const dateStr = new Date(date).toISOString().split('T')[0]; // YYYY-MM-DD
    const dateObj = new Date(dateStr);
    dateObj.setHours(0, 0, 0, 0);

    // Check for daily override
    const override = await DailySlotOverride.findOne({
      date: dateObj,
      isActive: true,
    }).lean();

    if (override && override.slots && override.slots.length > 0) {
      return override.slots
        .sort((a, b) => a.order - b.order)
        .map((slot, idx) => ({
          id: `override-${idx}`,
          time: slot.time,
          startTime: slot.startTime,
          endTime: slot.endTime,
          order: slot.order,
        }));
    }

    // Use default slots
    return await getTimeSlotsFromDB();
  } catch (error) {
    console.error('Error getting slots for date:', error);
    return await getTimeSlotsFromDB();
  }
};

/**
 * Get booked slots for a date range
 * Checks all orders (Pending, Paid, Scheduled, In Progress) to find booked slots
 */
const getBookedSlots = async (startDate, endDate) => {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  // Find all orders with slots in this date range
  // Only count orders that are not cancelled or completed
  const orders = await Order.find({
    status: { $in: ['Pending', 'Paid', 'Scheduled', 'In Progress'] },
    $or: [
      // OneTime orders
      {
        'items.scheduledDate': {
          $gte: start,
          $lte: end,
        },
      },
      // Package orders with scheduledSlots
      {
        'items.scheduledSlots.scheduledDate': {
          $gte: start,
          $lte: end,
        },
      },
    ],
  }).select('items');

  const bookedSlots = new Set();

  orders.forEach((order) => {
    order.items.forEach((item) => {
      if (item.packageType === 'OneTime' && item.scheduledDate && item.scheduledTimeSlot) {
        const dateStr = new Date(item.scheduledDate).toDateString();
        const slotKey = `${dateStr}|${item.scheduledTimeSlot}`;
        bookedSlots.add(slotKey);
      } else if (item.scheduledSlots && Array.isArray(item.scheduledSlots)) {
        item.scheduledSlots.forEach((slot) => {
          if (slot.scheduledDate) {
            const slotDate = new Date(slot.scheduledDate);
            if (slotDate >= start && slotDate <= end) {
              const dateStr = slotDate.toDateString();
              const slotKey = `${dateStr}|${slot.scheduledTimeSlot}`;
              bookedSlots.add(slotKey);
            }
          }
        });
      }
    });
  });

  return bookedSlots;
};

/**
 * Get available slots for a date range
 * @route   GET /api/slots/available
 * @access  Public
 */
export const getAvailableSlots = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate query parameters are required (ISO format)',
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use ISO format (e.g., 2024-01-15T00:00:00.000Z)',
      });
    }

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'startDate must be before endDate',
      });
    }

    // Get all booked slots in the date range
    const bookedSlots = await getBookedSlots(start, end);

    // Generate all possible date-slot combinations
    const availableSlots = [];
    const currentDate = new Date(start);
    currentDate.setHours(0, 0, 0, 0);

    while (currentDate <= end) {
      const dateStr = currentDate.toDateString();
      
      // Get slots for this specific date (checks for overrides)
      const slotsForDate = await getSlotsForDate(currentDate);
      
      slotsForDate.forEach((slot) => {
        const slotKey = `${dateStr}|${slot.time}`;
        if (!bookedSlots.has(slotKey)) {
          availableSlots.push({
            date: new Date(currentDate),
            timeSlot: slot,
          });
        }
      });

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Group by date for easier frontend consumption
    const slotsByDate = {};
    availableSlots.forEach(({ date, timeSlot }) => {
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      if (!slotsByDate[dateKey]) {
        slotsByDate[dateKey] = [];
      }
      slotsByDate[dateKey].push(timeSlot);
    });

    res.status(200).json({
      success: true,
      data: {
        slotsByDate,
        totalAvailable: availableSlots.length,
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching available slots',
      error: error.message,
    });
  }
};

/**
 * Get all time slots configuration
 * @route   GET /api/slots/times
 * @access  Public
 */
export const getTimeSlots = async (req, res) => {
  try {
    const slots = await getTimeSlotsFromDB();
    res.status(200).json({
      success: true,
      data: slots,
    });
  } catch (error) {
    console.error('Error fetching time slots:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching time slots',
      error: error.message,
    });
  }
};

/**
 * Get all time slots (including inactive) - Admin
 * @route   GET /api/slots/times/all
 * @access  Public (admin panel)
 */
export const getAllTimeSlots = async (req, res) => {
  try {
    const slots = await TimeSlot.find()
      .sort({ order: 1 })
      .lean();
    
    res.status(200).json({
      success: true,
      data: slots.map(slot => ({
        _id: slot._id,
        time: slot.time,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isActive: slot.isActive,
        order: slot.order,
        createdAt: slot.createdAt,
        updatedAt: slot.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching all time slots:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching time slots',
      error: error.message,
    });
  }
};

/**
 * Create a new time slot
 * @route   POST /api/slots/times
 * @access  Public (admin panel)
 */
export const createTimeSlot = async (req, res) => {
  try {
    const { time, startTime, endTime, order, isActive } = req.body;

    if (!time || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'time, startTime, and endTime are required',
      });
    }

    // Check if slot with same time already exists
    const existing = await TimeSlot.findOne({ time });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Time slot with this time already exists',
      });
    }

    // Get max order if not provided
    let slotOrder = order;
    if (slotOrder === undefined || slotOrder === null) {
      const maxSlot = await TimeSlot.findOne().sort({ order: -1 });
      slotOrder = maxSlot ? maxSlot.order + 1 : 1;
    }

    const timeSlot = await TimeSlot.create({
      time,
      startTime,
      endTime,
      order: slotOrder,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({
      success: true,
      data: timeSlot,
    });
  } catch (error) {
    console.error('Error creating time slot:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating time slot',
      error: error.message,
    });
  }
};

/**
 * Update a time slot
 * @route   PUT /api/slots/times/:id
 * @access  Public (admin panel)
 */
export const updateTimeSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const { time, startTime, endTime, order, isActive } = req.body;

    const timeSlot = await TimeSlot.findById(id);
    if (!timeSlot) {
      return res.status(404).json({
        success: false,
        message: 'Time slot not found',
      });
    }

    // Check if updating time would conflict with another slot
    if (time && time !== timeSlot.time) {
      const existing = await TimeSlot.findOne({ time, _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Time slot with this time already exists',
        });
      }
    }

    // Update fields
    if (time !== undefined) timeSlot.time = time;
    if (startTime !== undefined) timeSlot.startTime = startTime;
    if (endTime !== undefined) timeSlot.endTime = endTime;
    if (order !== undefined) timeSlot.order = order;
    if (isActive !== undefined) timeSlot.isActive = isActive;

    await timeSlot.save();

    res.status(200).json({
      success: true,
      data: timeSlot,
    });
  } catch (error) {
    console.error('Error updating time slot:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating time slot',
      error: error.message,
    });
  }
};

/**
 * Delete a time slot
 * @route   DELETE /api/slots/times/:id
 * @access  Public (admin panel)
 */
export const deleteTimeSlot = async (req, res) => {
  try {
    const { id } = req.params;

    const timeSlot = await TimeSlot.findById(id);
    if (!timeSlot) {
      return res.status(404).json({
        success: false,
        message: 'Time slot not found',
      });
    }

    // Check if any orders are using this slot
    const ordersUsingSlot = await Order.find({
      $or: [
        { 'items.scheduledTimeSlot': timeSlot.time },
        { 'items.scheduledSlots.scheduledTimeSlot': timeSlot.time },
        { 'items.startTimeSlot': timeSlot.time },
      ],
      status: { $in: ['Pending', 'Paid', 'Scheduled', 'In Progress'] },
    }).limit(1);

    if (ordersUsingSlot.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete time slot that is being used by active orders. Deactivate it instead.',
      });
    }

    await TimeSlot.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Time slot deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting time slot:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting time slot',
      error: error.message,
    });
  }
};

/**
 * Get daily slot override for a specific date
 * @route   GET /api/slots/daily/:date
 * @access  Public (admin panel)
 */
export const getDailySlotOverride = async (req, res) => {
  try {
    const { date } = req.params;
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);

    const override = await DailySlotOverride.findOne({ date: dateObj });

    if (override) {
      res.status(200).json({
        success: true,
        data: override,
      });
    } else {
      res.status(200).json({
        success: true,
        data: null,
        message: 'No override found, using default slots',
      });
    }
  } catch (error) {
    console.error('Error fetching daily slot override:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching daily slot override',
      error: error.message,
    });
  }
};

/**
 * Create or update daily slot override
 * @route   POST /api/slots/daily
 * @access  Public (admin panel)
 */
export const createOrUpdateDailySlotOverride = async (req, res) => {
  try {
    const { date, slots, isActive } = req.body;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required',
      });
    }

    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);

    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format',
      });
    }

    // Validate slots array
    if (!Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Slots array is required and must not be empty',
      });
    }

    // Validate each slot has required fields
    for (const slot of slots) {
      if (!slot.time || !slot.startTime || !slot.endTime) {
        return res.status(400).json({
          success: false,
          message: 'Each slot must have time, startTime, and endTime',
        });
      }
    }

    const override = await DailySlotOverride.findOneAndUpdate(
      { date: dateObj },
      {
        date: dateObj,
        slots: slots.map((slot, idx) => ({
          time: slot.time,
          startTime: slot.startTime,
          endTime: slot.endTime,
          order: slot.order !== undefined ? slot.order : idx + 1,
        })),
        isActive: isActive !== undefined ? isActive : true,
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      data: override,
      message: override.isNew ? 'Daily slot override created' : 'Daily slot override updated',
    });
  } catch (error) {
    console.error('Error creating/updating daily slot override:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving daily slot override',
      error: error.message,
    });
  }
};

/**
 * Delete daily slot override
 * @route   DELETE /api/slots/daily/:date
 * @access  Public (admin panel)
 */
export const deleteDailySlotOverride = async (req, res) => {
  try {
    const { date } = req.params;
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);

    const override = await DailySlotOverride.findOneAndDelete({ date: dateObj });

    if (!override) {
      return res.status(404).json({
        success: false,
        message: 'Daily slot override not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Daily slot override deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting daily slot override:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting daily slot override',
      error: error.message,
    });
  }
};

/**
 * Get daily slot overrides for a date range
 * @route   GET /api/slots/daily/range
 * @access  Public (admin panel)
 */
export const getDailySlotOverridesRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate query parameters are required',
      });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const overrides = await DailySlotOverride.find({
      date: { $gte: start, $lte: end },
    }).sort({ date: 1 });

    res.status(200).json({
      success: true,
      data: overrides,
    });
  } catch (error) {
    console.error('Error fetching daily slot overrides:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching daily slot overrides',
      error: error.message,
    });
  }
};
