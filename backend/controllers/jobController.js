import Order from '../models/Order.js';

const requireEmployeeId = (req, res) => {
  const bodyEmployeeId = req.body?.employeeId;
  const queryEmployeeId = req.query?.employeeId;
  const employeeId = bodyEmployeeId || queryEmployeeId;
  if (!employeeId) {
    res.status(400).json({ success: false, message: 'employeeId is required' });
    return null;
  }
  return String(employeeId).trim();
};

function orderRatedForEmployee(order, employeeId) {
  const eid = String(employeeId).trim();
  if (!eid) return false;
  const rating = order?.rating;
  if (typeof rating !== 'number' || rating < 1 || rating > 5) return false;
  if (order.status !== 'Completed') return false;

  if (order.ratedEmployeeId && String(order.ratedEmployeeId) === eid) return true;
  if (String(order.assignedEmployeeId || '') === eid) {
    return order.assignments?.some(
      (a) => String(a.employeeId) === eid && a.status === 'completed'
    );
  }
  return order.assignments?.some(
    (a) => String(a.employeeId) === eid && a.status === 'completed'
  );
}

function buildRatingStats(orders) {
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;
  for (const order of orders) {
    const r = Math.round(Number(order.rating));
    if (r >= 1 && r <= 5) {
      distribution[r] += 1;
      sum += order.rating;
    }
  }
  const count = orders.length;
  const average = count > 0 ? Math.round((sum / count) * 10) / 10 : null;
  const positive = distribution[5] + distribution[4];
  const positivePercent = count > 0 ? Math.round((positive / count) * 100) : 0;
  return { average, count, distribution, positivePercent };
}

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
      status: { $nin: ['Completed', 'Cancelled'] },
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
        $elemMatch: { employeeId: String(employeeId), status: { $in: ['declined', 'completed'] } },
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

export const getEmployeeRatings = async (req, res) => {
  try {
    const employeeId = requireEmployeeId(req, res);
    if (!employeeId) return;

    const orders = await Order.find({
      status: 'Completed',
      rating: { $gte: 1, $lte: 5 },
      $or: [
        { ratedEmployeeId: employeeId },
        { assignedEmployeeId: employeeId },
        { assignments: { $elemMatch: { employeeId, status: 'completed' } } },
      ],
    })
      .sort({ ratedAt: -1, updatedAt: -1 })
      .populate('items.service', 'name category')
      .select('-__v');

    const ratedForEmployee = orders.filter((order) => orderRatedForEmployee(order, employeeId));
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonth = ratedForEmployee.filter((order) => {
      const at = order.ratedAt || order.updatedAt;
      return at && new Date(at) >= monthStart;
    });

    const allTime = buildRatingStats(ratedForEmployee);
    const monthStats = buildRatingStats(thisMonth);
    const latest = ratedForEmployee[0] || null;

    res.status(200).json({
      success: true,
      data: {
        latest,
        allTime,
        thisMonth: monthStats,
        reviews: ratedForEmployee,
      },
    });
  } catch (error) {
    console.error('Error fetching employee ratings:', error);
    res.status(500).json({ success: false, message: 'Error fetching employee ratings' });
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
