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

/**
 * Auto-generate slot dates for package orders
 * Pattern: 3 washes per week with gaps (1 day, then 2 days)
 * @param {Date} startDate - First selected date
 * @param {Number} packageTimes - Total number of washes (e.g., 12 for 12/month)
 * @param {String} defaultTimeSlot - Default time slot for all generated slots
 * @returns {Array} Array of { scheduledDate, scheduledTimeSlot }
 */
const generatePackageSlots = (startDate, packageTimes, defaultTimeSlot) => {
  const slots = [];
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0); // Reset to start of day
  
  // Pattern: 3 washes per week
  // Week pattern: Day 0, Day 2, Day 5 (1 day gap, then 2 day gap)
  const weeklyPattern = [0, 2, 5]; // Days from start of week
  
  let currentDate = new Date(start);
  let slotCount = 0;
  let weekOffset = 0;
  
  while (slotCount < packageTimes) {
    // Calculate which day in the week pattern
    const patternIndex = slotCount % 3;
    const dayOffset = weeklyPattern[patternIndex];
    
    // If we've completed a week (patternIndex === 0 and slotCount > 0), move to next week
    if (patternIndex === 0 && slotCount > 0) {
      weekOffset += 7; // Move to next week
    }
    
    const slotDate = new Date(start);
    slotDate.setDate(start.getDate() + weekOffset + dayOffset);
    
    slots.push({
      scheduledDate: slotDate,
      scheduledTimeSlot: defaultTimeSlot,
    });
    
    slotCount++;
  }
  
  return slots;
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

      const service = await Service.findById(item.serviceId || item.service).select('basePrice packages');
      if (!service) {
        throw new Error('Service not found');
      }

      const addOnIds = item.addOnIds || item.addOns || [];
      const addOns = addOnIds.length
        ? await Service.find({ _id: { $in: addOnIds }, category: 'AddOn', isActive: true })
            .select('basePrice')
        : [];

      const packageType = item.packageType || 'OneTime';
      const packageTimes = Number(item.packageTimes || 1);
      const unitPrice = getPackagePrice(service, packageType, packageTimes);
      const addOnsTotal = addOns.reduce((sum, addOn) => sum + (addOn.basePrice || 0), 0);
      const lineTotal = unitPrice + addOnsTotal;

      // Handle OneTime vs Package orders
      if (packageType === 'OneTime') {
        // OneTime: requires single scheduledDate and scheduledTimeSlot
        if (!item.scheduledDate || !item.scheduledTimeSlot) {
          throw new Error('Scheduled date and time slot are required for one-time orders');
        }

        const scheduledDate = new Date(item.scheduledDate);
        if (Number.isNaN(scheduledDate.getTime())) {
          throw new Error('Invalid scheduled date');
        }

        return {
          service: service._id,
          addOns: addOns.map(addOn => addOn._id),
          packageType: 'OneTime',
          packageTimes: 1,
          scheduledDate,
          scheduledTimeSlot: item.scheduledTimeSlot?.time || item.scheduledTimeSlot,
          unitPrice,
          addOnsTotal,
          lineTotal,
        };
      } else {
        // Package: requires scheduledSlots array
        let scheduledSlots = [];
        
        if (item.scheduledSlots && Array.isArray(item.scheduledSlots) && item.scheduledSlots.length > 0) {
          // Use provided slots (from frontend after user edits)
          scheduledSlots = item.scheduledSlots.map(slot => {
            const slotDate = new Date(slot.scheduledDate);
            if (Number.isNaN(slotDate.getTime())) {
              throw new Error('Invalid scheduled date in slot');
            }
            return {
              scheduledDate: slotDate,
              scheduledTimeSlot: slot.scheduledTimeSlot?.time || slot.scheduledTimeSlot,
            };
          });
        } else if (item.startDate && item.startTimeSlot) {
          // Auto-generate slots from start date
          const startDate = new Date(item.startDate);
          if (Number.isNaN(startDate.getTime())) {
            throw new Error('Invalid start date');
          }
          scheduledSlots = generatePackageSlots(
            startDate,
            packageTimes,
            item.startTimeSlot?.time || item.startTimeSlot
          );
        } else {
          throw new Error('Package orders require either scheduledSlots array or startDate with startTimeSlot');
        }

        // Validate slot count matches packageTimes
        if (scheduledSlots.length !== packageTimes) {
          throw new Error(`Number of scheduled slots (${scheduledSlots.length}) must match package times (${packageTimes})`);
        }

        // Validate no two washes on same day
        const dateStrings = scheduledSlots.map(slot => slot.scheduledDate.toDateString());
        const uniqueDates = new Set(dateStrings);
        if (dateStrings.length !== uniqueDates.size) {
          throw new Error('Cannot schedule multiple washes on the same day');
        }

        return {
          service: service._id,
          addOns: addOns.map(addOn => addOn._id),
          packageType,
          packageTimes,
          scheduledSlots,
          unitPrice,
          addOnsTotal,
          lineTotal,
        };
      }
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

// @desc    Get all orders (admin access - no user filter)
// @route   GET /api/orders/admin/all
// @access  Public (for admin panel)
export const getAllOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {}; // No user filter - get all orders

    if (status) {
      const statuses = status.split(',').map(s => s.trim()).filter(Boolean);
      if (statuses.length > 0) {
        query.status = { $in: statuses };
      }
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .populate('items.service', 'name category')
      .populate('items.addOns', 'name basePrice')
      .populate('user', 'name phone'); // Include user info for admin

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching all orders',
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
