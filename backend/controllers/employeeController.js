import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
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

    // Generate JWT token (6 months expiration, same as customer)
    const token = jwt.sign(
      { employeeId: employee.employeeId, employeeDbId: employee._id },
      process.env.JWT_SECRET || 'dev_secret',
      { expiresIn: '180d' } // 6 months
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
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

// @desc    Get all employees
// @route   GET /api/employees
// @access  Public (for admin panel)
export const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({ isActive: true })
      .select('-passwordHash -__v -aadharPath -panPath')
      .sort({ employeeId: 1 });

    res.status(200).json({
      success: true,
      data: employees,
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employees',
      error: error.message,
    });
  }
};

// @desc    Get current employee's document status (for app to decide if upload screen is needed)
// @route   GET /api/employees/me/documents
// @access  Protected (employee)
export const getMyDocuments = async (req, res) => {
  try {
    const employee = req.employee;
    const base = '/uploads';
    res.status(200).json({
      success: true,
      data: {
        documentsUploaded: !!employee.documentsUploaded,
        aadharUrl: employee.aadharPath ? `${base}/${employee.aadharPath}` : null,
        panUrl: employee.panPath ? `${base}/${employee.panPath}` : null,
      },
    });
  } catch (error) {
    console.error('Error fetching document status:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching document status',
      error: error.message,
    });
  }
};

// @desc    Upload Aadhar and PAN documents (employee, first-time only)
// @route   POST /api/employees/me/documents
// @access  Protected (employee)
export const uploadMyDocuments = async (req, res) => {
  try {
    const employee = req.employee;
    const aadharFile = req.files?.aadhar?.[0];
    const panFile = req.files?.pan?.[0];

    if (!aadharFile || !panFile) {
      return res.status(400).json({
        success: false,
        message: 'Both Aadhaar and PAN images are required',
      });
    }

    const empId = String(employee._id);
    const aadharPath = `documents/${empId}/${aadharFile.filename}`;
    const panPath = `documents/${empId}/${panFile.filename}`;

    await Employee.findOneAndUpdate(
      { _id: employee._id },
      {
        $set: {
          aadharPath,
          panPath,
          documentsUploaded: true,
        },
      }
    );

    const base = '/uploads';
    res.status(200).json({
      success: true,
      message: 'Documents uploaded successfully',
      data: {
        documentsUploaded: true,
        aadharUrl: `${base}/${aadharPath}`,
        panUrl: `${base}/${panPath}`,
      },
    });
  } catch (error) {
    console.error('Error uploading documents:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading documents',
      error: error.message,
    });
  }
};

// @desc    Get an employee's documents (admin panel - view documents)
// @route   GET /api/employees/:employeeId/documents
// @access  Public (admin)
export const getEmployeeDocuments = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const employee = await Employee.findOne({ employeeId }).select('documentsUploaded aadharPath panPath');
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }
    const base = '/uploads';
    res.status(200).json({
      success: true,
      data: {
        documentsUploaded: !!employee.documentsUploaded,
        aadharUrl: employee.aadharPath ? `${base}/${employee.aadharPath}` : null,
        panUrl: employee.panPath ? `${base}/${employee.panPath}` : null,
      },
    });
  } catch (error) {
    console.error('Error fetching employee documents:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employee documents',
      error: error.message,
    });
  }
};

// @desc    Update current employee's push token (for notifications)
// @route   PUT /api/employees/me/push-token
// @access  Protected (employee)
export const updatePushToken = async (req, res) => {
  try {
    const { pushToken } = req.body;
    const employee = req.employee;

    await Employee.findOneAndUpdate(
      { employeeId: employee.employeeId },
      { $set: { pushToken: (pushToken && String(pushToken).trim()) || '' } }
    );

    res.status(200).json({
      success: true,
      message: 'Push token updated',
    });
  } catch (error) {
    console.error('Error updating push token:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating push token',
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
