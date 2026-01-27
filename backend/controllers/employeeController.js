import bcrypt from 'bcryptjs';
import Employee from '../models/Employee.js';

// @desc    Employee login
// @route   POST /api/employees/login
// @access  Public (will add auth later)
export const loginEmployee = async (req, res) => {
  try {
    const { employeeId, password } = req.body;

    if (!employeeId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID and password are required',
      });
    }

    const employee = await Employee.findOne({ employeeId });
    if (!employee || !employee.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const isMatch = await bcrypt.compare(password, employee.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        employeeId: employee.employeeId,
        name: employee.name,
        phone: employee.phone,
      },
    });
  } catch (error) {
    console.error('Error logging in employee:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in employee',
      error: error.message,
    });
  }
};

// @desc    Create employee
// @route   POST /api/employees
// @access  Public (demo only)
export const createEmployee = async (req, res) => {
  try {
    const { employeeId, name, phone, password } = req.body;

    if (!employeeId || !name || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'employeeId, name, phone, and password are required',
      });
    }

    const existing = await Employee.findOne({ employeeId });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Employee ID already exists',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const employee = await Employee.create({
      employeeId: employeeId.trim(),
      name: name.trim(),
      phone: phone.trim(),
      passwordHash,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      data: {
        employeeId: employee.employeeId,
        name: employee.name,
        phone: employee.phone,
      },
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating employee',
      error: error.message,
    });
  }
};
