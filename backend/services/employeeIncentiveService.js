import Order from '../models/Order.js';
import EmployeeIncentiveConfig from '../models/EmployeeIncentiveConfig.js';
import EmployeeIncentiveEntry from '../models/EmployeeIncentiveEntry.js';
import { getPeriodBounds } from '../utils/employeeIncentivePeriod.js';

/**
 * After an order is marked Completed by an employee, record flat incentive if above target.
 * Idempotent per (employeeId, orderId).
 */
export async function recordIncentiveForCompletedOrder({ employeeId, orderId, completedAt }) {
  const config = await EmployeeIncentiveConfig.findOne().sort({ updatedAt: -1 }).lean();
  if (!config || !config.isActive) return null;

  const target = Number(config.targetCount ?? 0);
  const rate = Number(config.amountPerExtraService ?? 0);
  if (rate <= 0) return null;

  const tz = config.timezone || 'Asia/Kolkata';
  const weekStartsOn = Number(config.weekStartsOn ?? 1);
  const { start, end, periodKey } = getPeriodBounds(
    completedAt,
    config.periodType || 'weekly',
    tz,
    weekStartsOn
  );

  const count = await Order.countDocuments({
    status: 'Completed',
    assignments: {
      $elemMatch: {
        employeeId,
        status: 'completed',
        completedAt: { $gte: start, $lt: end },
      },
    },
  });

  if (count <= target) {
    return null;
  }

  const amount = rate;

  try {
    const entry = await EmployeeIncentiveEntry.create({
      employeeId,
      orderId,
      periodKey,
      periodType: config.periodType || 'weekly',
      amount,
      countInPeriod: count,
      targetSnapshot: target,
      rateSnapshot: rate,
      completedAt,
    });
    return entry;
  } catch (e) {
    if (e && e.code === 11000) return null;
    throw e;
  }
}
