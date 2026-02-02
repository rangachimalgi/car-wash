import Attendance from '../models/Attendance.js';

// Helper function to get start and end of day in UTC
const getDayBounds = (date = new Date()) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  const start = new Date(d);
  d.setUTCHours(23, 59, 59, 999);
  const end = new Date(d);
  return { start, end };
};

// @desc    Mark attendance
// @route   POST /api/attendance/check-in
// @access  Protected (Employee)
export const markCheckIn = async (req, res) => {
  try {
    const employeeId = req.employee.employeeId;
    const { location, notes } = req.body;

    // Get today's date bounds
    const { start, end } = getDayBounds();

    // Check if already marked attendance today
    const existingAttendance = await Attendance.findOne({
      employeeId,
      date: { $gte: start, $lte: end },
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for today',
        data: existingAttendance,
      });
    }

    const checkInTime = new Date();

    // Create attendance record
    const attendance = await Attendance.create({
      employeeId,
      date: start, // Store date at start of day
      checkIn: checkInTime,
      location: location ? {
        latitude: location.latitude,
        longitude: location.longitude,
      } : null,
      notes: notes || null,
    });

    res.status(200).json({
      success: true,
      message: 'Attendance marked successfully',
      data: attendance,
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking attendance',
      error: error.message,
    });
  }
};


// @desc    Get today's attendance
// @route   GET /api/attendance/today
// @access  Protected (Employee)
export const getTodayAttendance = async (req, res) => {
  try {
    const employeeId = req.employee.employeeId;
    const { start, end } = getDayBounds();

    const attendance = await Attendance.findOne({
      employeeId,
      date: { $gte: start, $lte: end },
    });

    res.status(200).json({
      success: true,
      data: attendance || null,
    });
  } catch (error) {
    console.error('Error fetching today attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching today attendance',
      error: error.message,
    });
  }
};

// @desc    Get attendance history
// @route   GET /api/attendance/history
// @access  Protected (Employee)
export const getAttendanceHistory = async (req, res) => {
  try {
    const employeeId = req.employee.employeeId;
    const limit = parseInt(req.query.limit) || 30;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const attendance = await Attendance.find({ employeeId })
      .sort({ date: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Attendance.countDocuments({ employeeId });

    res.status(200).json({
      success: true,
      data: attendance,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching attendance history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance history',
      error: error.message,
    });
  }
};

// @desc    Get all employees' attendance (Admin)
// @route   GET /api/attendance/admin/all
// @access  Public (for now, add admin auth later)
export const getAllAttendance = async (req, res) => {
  try {
    const { date, employeeId } = req.query;
    
    let query = {};
    
    // If date provided, filter by date
    if (date) {
      // Parse date string (YYYY-MM-DD format)
      const targetDate = new Date(date + 'T00:00:00.000Z'); // Ensure UTC midnight
      const { start, end } = getDayBounds(targetDate);
      query.date = { $gte: start, $lte: end };
      
      console.log('Querying attendance for date:', {
        inputDate: date,
        targetDate: targetDate.toISOString(),
        start: start.toISOString(),
        end: end.toISOString(),
      });
    } else {
      // Default to today
      const { start, end } = getDayBounds();
      query.date = { $gte: start, $lte: end };
    }

    // If employeeId provided, filter by employee
    if (employeeId) {
      query.employeeId = employeeId;
    }

    const attendance = await Attendance.find(query)
      .sort({ employeeId: 1, date: -1 });

    console.log(`Found ${attendance.length} attendance records for query:`, query);

    res.status(200).json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    console.error('Error fetching all attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching all attendance',
      error: error.message,
    });
  }
};

// @desc    Get specific employee's attendance history (Admin)
// @route   GET /api/attendance/admin/employee/:employeeId
// @access  Public (for now, add admin auth later)
export const getEmployeeAttendance = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate, limit = 30, page = 1 } = req.query;
    
    let query = { employeeId };
    
    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const { start } = getDayBounds(new Date(startDate));
        query.date.$gte = start;
      }
      if (endDate) {
        const { end } = getDayBounds(new Date(endDate));
        query.date.$lte = end;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const attendance = await Attendance.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Attendance.countDocuments(query);

    res.status(200).json({
      success: true,
      data: attendance,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching employee attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employee attendance',
      error: error.message,
    });
  }
};
