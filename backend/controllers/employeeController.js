import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Employee from '../models/Employee.js';

const EMPLOYEE_ID_PREFIX = 'WOOSHER';

const generateNextEmployeeId = async () => {
  const docs = await Employee.find({
    employeeId: { $regex: `^${EMPLOYEE_ID_PREFIX}\\d+$` },
  })
    .select('employeeId')
    .lean();

  let maxNumber = 0;
  for (const doc of docs) {
    const value = String(doc?.employeeId || '');
    const numberPart = value.slice(EMPLOYEE_ID_PREFIX.length);
    const parsed = Number.parseInt(numberPart, 10);
    if (Number.isFinite(parsed) && parsed > maxNumber) {
      maxNumber = parsed;
    }
  }

  return `${EMPLOYEE_ID_PREFIX}${String(maxNumber + 1).padStart(2, '0')}`;
};

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
    const { name, phone, address, password } = req.body;

    if (!name || !phone || !address || !password) {
      return res.status(400).json({
        success: false,
        message: 'name, phone, address, and password are required',
      });
    }

    const existingPhone = await Employee.findOne({ phone: phone.trim() });
    if (existingPhone) {
      return res.status(409).json({
        success: false,
        message: 'Phone number already exists',
      });
    }

    const employeeId = await generateNextEmployeeId();
    const passwordHash = await bcrypt.hash(password, 10);
    const employee = await Employee.create({
      employeeId,
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      passwordHash,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      data: {
        employeeId: employee.employeeId,
        name: employee.name,
        phone: employee.phone,
        address: employee.address,
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

// @desc    Update employee details (admin)
// @route   PUT /api/employees/:employeeId
// @access  Public (admin panel)
export const updateEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { name, phone, address, isActive } = req.body || {};

    const employee = await Employee.findOne({ employeeId: String(employeeId || '').trim() });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    if (!name || !phone || !address) {
      return res.status(400).json({
        success: false,
        message: 'name, phone, and address are required',
      });
    }

    const normalizedPhone = String(phone).trim();
    const existingPhone = await Employee.findOne({
      phone: normalizedPhone,
      employeeId: { $ne: employee.employeeId },
    });
    if (existingPhone) {
      return res.status(409).json({
        success: false,
        message: 'Phone number already exists',
      });
    }

    employee.name = String(name).trim();
    employee.phone = normalizedPhone;
    employee.address = String(address).trim();
    if (typeof isActive === 'boolean') {
      employee.isActive = isActive;
    }
    await employee.save();

    res.status(200).json({
      success: true,
      data: {
        employeeId: employee.employeeId,
        name: employee.name,
        phone: employee.phone,
        address: employee.address,
        isActive: employee.isActive,
        documentsUploaded: !!employee.documentsUploaded,
        pushToken: employee.pushToken || '',
        createdAt: employee.createdAt,
        updatedAt: employee.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating employee',
      error: error.message,
    });
  }
};

// @desc    Change employee password (admin)
// @route   PUT /api/employees/:employeeId/password
// @access  Public (admin panel)
export const changeEmployeePassword = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { newPassword } = req.body || {};

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'newPassword is required',
      });
    }

    if (String(newPassword).trim().length < 4) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 4 characters',
      });
    }

    const employee = await Employee.findOne({ employeeId: String(employeeId || '').trim() });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    employee.passwordHash = await bcrypt.hash(String(newPassword), 10);
    await employee.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Error changing employee password:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing employee password',
      error: error.message,
    });
  }
};
