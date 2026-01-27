import Order from '../models/Order.js';

const requireEmployeeId = (req, res) => {
  const bodyEmployeeId = req.body?.employeeId;
  const queryEmployeeId = req.query?.employeeId;
  const employeeId = bodyEmployeeId || queryEmployeeId;
  if (!employeeId) {
    res.status(400).json({ success: false, message: 'employeeId is required' });
    return null;
  }
  return employeeId;
};

export const getIncomingJobs = async (req, res) => {
  try {
    const employeeId = requireEmployeeId(req, res);
    if (!employeeId) return;

    const orders = await Order.find({
      assignments: { $elemMatch: { employeeId, status: 'pending' } },
    })
      .sort({ createdAt: -1 })
      .populate('items.service', 'name category')
      .populate('items.addOns', 'name basePrice');

    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    console.error('Error fetching incoming jobs:', error);
    res.status(500).json({ success: false, message: 'Error fetching incoming jobs' });
  }
};

export const getQueueJobs = async (req, res) => {
  try {
    const employeeId = requireEmployeeId(req, res);
    if (!employeeId) return;

    const orders = await Order.find({
      assignments: { $elemMatch: { employeeId, status: 'accepted' } },
    })
      .sort({ createdAt: -1 })
      .populate('items.service', 'name category')
      .populate('items.addOns', 'name basePrice');

    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    console.error('Error fetching queue jobs:', error);
    res.status(500).json({ success: false, message: 'Error fetching queue jobs' });
  }
};

export const getJobHistory = async (req, res) => {
  try {
    const employeeId = requireEmployeeId(req, res);
    if (!employeeId) return;

    const orders = await Order.find({
      assignments: {
        $elemMatch: { employeeId, status: { $in: ['declined', 'completed'] } },
      },
    })
      .sort({ updatedAt: -1 })
      .populate('items.service', 'name category')
      .populate('items.addOns', 'name basePrice');

    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    console.error('Error fetching job history:', error);
    res.status(500).json({ success: false, message: 'Error fetching job history' });
  }
};

export const acceptJob = async (req, res) => {
  try {
    const employeeId = requireEmployeeId(req, res);
    if (!employeeId) return;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const assignment = order.assignments?.find(a => a.employeeId === employeeId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }
    if (assignment.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Job already responded' });
    }

    order.assignments = order.assignments.map(a => {
      if (a.employeeId === employeeId) {
        return { ...a.toObject(), status: 'accepted', acceptedAt: new Date() };
      }
      if (a.status === 'pending') {
        return { ...a.toObject(), status: 'declined', declinedAt: new Date() };
      }
      return a;
    });
    order.assignmentStatus = 'accepted';
    order.assignedEmployeeId = employeeId;
    await order.save();

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error('Error accepting job:', error);
    res.status(500).json({ success: false, message: 'Error accepting job' });
  }
};

export const declineJob = async (req, res) => {
  try {
    const employeeId = requireEmployeeId(req, res);
    if (!employeeId) return;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const assignment = order.assignments?.find(a => a.employeeId === employeeId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }
    if (assignment.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Job already responded' });
    }

    assignment.status = 'declined';
    assignment.declinedAt = new Date();
    const hasPending = order.assignments.some(a => a.status === 'pending');
    const hasAccepted = order.assignments.some(a => a.status === 'accepted');
    if (!hasPending && !hasAccepted) {
      order.assignmentStatus = 'declined';
      order.assignedEmployeeId = '';
    }
    await order.save();

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error('Error declining job:', error);
    res.status(500).json({ success: false, message: 'Error declining job' });
  }
};
