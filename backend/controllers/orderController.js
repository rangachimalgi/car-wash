import Order from '../models/Order.js';
import Service from '../models/Service.js';
import Employee from '../models/Employee.js';

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
// @access  Public (will add auth later)
export const createOrder = async (req, res) => {
  try {
    const { items, customer, employeeIds } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must include at least one item',
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
      items: hydratedItems,
      subtotal,
      tax,
      totalAmount,
      customer: {
        name: customer?.name || '',
        phone: customer?.phone || '',
        address: customer?.address || '',
      },
      assignments,
    });

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

// @desc    Get all orders
// @route   GET /api/orders
// @access  Admin (will add auth later)
export const getOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};

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
// @access  Admin/Customer (will add auth later)
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Paid', 'Scheduled', 'Completed', 'Cancelled'];

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
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
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
        message: 'Order not found',
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

// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Admin (will add auth later)
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
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
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message,
    });
  }
};
