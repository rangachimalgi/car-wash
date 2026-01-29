import Order from '../models/Order.js';
import Service from '../models/Service.js';
import Employee from '../models/Employee.js';
import User from '../models/User.js';

const TAX_RATE = 0.18;
let lastAssignedIndex = -1;

const getPackagePrice = (service, packageType, packageTimes) => {
  if (!packageType || packageType === 'OneTime') {
    return service.basePrice;
  }
  const section = packageType.toLowerCase();
  const packages = service.packages?.[section] || [];
  const match = packages.find(pkg => Number(pkg.times) === Number(packageTimes));
  return match?.price ?? service.basePrice * Number(packageTimes || 1);
};

// @desc    Create new order (one-wash for now)
// @route   POST /api/orders
// @access  Protected
export const createOrder = async (req, res) => {
  try {
    const { items, customer, employeeIds } = req.body;
    const userId = req.user._id; // From auth middleware

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must include at least one item',
      });
    }

    // Validate customer address and vehicle details
    if (!customer) {
      return res.status(400).json({
        success: false,
        message: 'Customer information is required',
      });
    }

    if (!customer.address || customer.address.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Delivery address is required',
      });
    }

    if (!customer.vehicleType || customer.vehicleType.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Vehicle type is required',
      });
    }

    if (!customer.vehicleModel || customer.vehicleModel.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Vehicle model is required',
      });
    }

    const hydratedItems = await Promise.all(items.map(async (item) => {
      if (!item.serviceId && !item.service) {
        throw new Error('Service ID is required');
      }
      if (!item.scheduledDate || !item.scheduledTimeSlot) {
        throw new Error('Scheduled date and time slot are required');
      }

      const service = await Service.findById(item.serviceId || item.service).select('basePrice packages');
      if (!service) {
        throw new Error('Service not found');
      }

      const addOnIds = item.addOnIds || item.addOns || [];
      const addOns = addOnIds.length
        ? await Service.find({ _id: { $in: addOnIds }, category: 'AddOn', isActive: true })
            .select('basePrice')
        : [];

      const scheduledDate = new Date(item.scheduledDate);
      if (Number.isNaN(scheduledDate.getTime())) {
        throw new Error('Invalid scheduled date');
      }

      const unitPrice = getPackagePrice(service, item.packageType, item.packageTimes);
      const addOnsTotal = addOns.reduce((sum, addOn) => sum + (addOn.basePrice || 0), 0);
      const lineTotal = unitPrice + addOnsTotal;

      return {
        service: service._id,
        addOns: addOns.map(addOn => addOn._id),
        packageType: item.packageType || 'OneTime',
        packageTimes: Number(item.packageTimes || 1),
        scheduledDate,
        scheduledTimeSlot: item.scheduledTimeSlot?.time || item.scheduledTimeSlot,
        unitPrice,
        addOnsTotal,
        lineTotal,
      };
    }));

    const subtotal = hydratedItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const tax = Number((subtotal * TAX_RATE).toFixed(2));
    const totalAmount = Number((subtotal + tax).toFixed(2));

    const normalizedEmployeeIds = Array.isArray(employeeIds)
      ? employeeIds.filter(Boolean)
      : [];

    let assignmentIds = normalizedEmployeeIds;
    if (assignmentIds.length === 0) {
      const employees = await Employee.find({ isActive: true })
        .sort({ employeeId: 1 })
        .select('employeeId');
      if (employees.length > 0) {
        lastAssignedIndex = (lastAssignedIndex + 1) % employees.length;
        assignmentIds = [employees[lastAssignedIndex].employeeId];
      }
    }

    const assignments = assignmentIds.map(employeeId => ({
      employeeId,
      status: 'pending',
      assignedAt: new Date(),
    }));

    const order = await Order.create({
      user: userId,
      items: hydratedItems,
      subtotal,
      tax,
      totalAmount,
      customer: {
        name: customer?.name || '',
        phone: customer?.phone || '',
        address: customer?.address || '',
        vehicleType: customer?.vehicleType || '',
        vehicleModel: customer?.vehicleModel || '',
        latitude: typeof customer?.latitude === 'number' ? customer.latitude : undefined,
        longitude: typeof customer?.longitude === 'number' ? customer.longitude : undefined,
      },
      assignmentStatus: assignments.length > 0 ? 'pending' : 'declined',
      assignments,
    });

    if (customer?.phone) {
      await User.findOneAndUpdate(
        { phone: customer.phone },
        {
          $set: {
            name: customer?.name || '',
            address: customer?.address || '',
          },
          $setOnInsert: { phone: customer.phone },
        },
        { new: true, upsert: true }
      );
    }

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message,
    });
  }
};

// @desc    Get all orders for the logged-in user
// @route   GET /api/orders
// @access  Protected
export const getOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const userId = req.user._id; // From auth middleware
    const query = { user: userId }; // Filter by user

    if (status) {
      const statuses = status.split(',').map(s => s.trim()).filter(Boolean);
      if (statuses.length > 0) {
        query.status = { $in: statuses };
      }
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .populate('items.service', 'name category')
      .populate('items.addOns', 'name basePrice');

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message,
    });
  }
};

// @desc    Update order status
// @route   PATCH /api/orders/:id
// @access  Protected (or employeeId query param for employees)
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;
    const employeeId = req.query.employeeId; // For employee access
    const userId = req.user?._id; // From auth middleware (may be undefined for employees)
    const validStatuses = ['Pending', 'Paid', 'Scheduled', 'In Progress', 'Completed', 'Cancelled'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    const update = { status };

    if (status === 'Completed') {
      update['assignments.$[accepted].status'] = 'completed';
      update['assignments.$[accepted].completedAt'] = new Date();
      update.assignmentStatus = 'completed';
    }

    let query;
    if (employeeId) {
      // Employee access: check if order is assigned to this employee
      query = {
        _id: orderId,
        assignments: { $elemMatch: { employeeId } },
      };
    } else if (userId) {
      // Customer access: check if order belongs to this user
      query = { _id: orderId, user: userId };
    } else {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const order = await Order.findOneAndUpdate(
      query,
      update,
      {
        new: true,
        arrayFilters: status === 'Completed'
          ? [{ 'accepted.status': 'accepted' }]
          : undefined,
      }
    )
      .populate('items.service', 'name category')
      .populate('items.addOns', 'name basePrice');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or you do not have access to this order',
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      error: error.message,
    });
  }
};

// @desc    Update employee live location for an order
// @route   PATCH /api/orders/:id/employee-location
// @access  Employee (employeeId query param) or Protected
export const updateEmployeeLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const orderId = req.params.id;
    const employeeId = req.query.employeeId; // For employee access
    const userId = req.user?._id; // From auth middleware (may be undefined for employees)

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
      });
    }

    const update = {
      employeeLocation: {
        latitude,
        longitude,
        updatedAt: new Date(),
      },
    };

    let query;
    if (employeeId) {
      // Employee access: check if order is assigned to this employee
      query = {
        _id: orderId,
        assignments: { $elemMatch: { employeeId } },
      };
    } else if (userId) {
      // Customer access: check if order belongs to this user (for admin/customer viewing)
      query = { _id: orderId, user: userId };
    } else {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const order = await Order.findOneAndUpdate(query, update, { new: true })
      .populate('items.service', 'name category')
      .populate('items.addOns', 'name basePrice');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error updating employee location:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating employee location',
      error: error.message,
    });
  }
};

// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Protected (or employeeId query param for employees)
export const getOrderById = async (req, res) => {
  try {
    const orderId = req.params.id;
    const employeeId = req.query.employeeId; // For employee access
    const userId = req.user?._id; // From auth middleware (may be undefined for employees)

    let order;
    
    if (employeeId) {
      // Employee access: check if order is assigned to this employee
      order = await Order.findOne({
        _id: orderId,
        assignments: { $elemMatch: { employeeId } },
      })
        .populate('items.service', 'name category')
        .populate('items.addOns', 'name basePrice');
    } else if (userId) {
      // Customer access: check if order belongs to this user
      order = await Order.findOne({ _id: orderId, user: userId })
        .populate('items.service', 'name category')
        .populate('items.addOns', 'name basePrice');
    } else {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or you do not have access to this order',
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message,
    });
  }
};
