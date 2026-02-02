import jwt from 'jsonwebtoken';
import Employee from '../models/Employee.js';

// @desc    Verify JWT token and attach employee to request
// @access  Protected routes
export const protectEmployee = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
      
      // Get employee from token (using employeeId from token)
      const employee = await Employee.findOne({ 
        employeeId: decoded.employeeId,
        isActive: true 
      }).select('-passwordHash -__v');
      
      if (!employee) {
        return res.status(401).json({
          success: false,
          message: 'Employee not found or inactive',
        });
      }

      // Attach employee to request
      req.employee = employee;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
    }
  } catch (error) {
    console.error('Employee auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
