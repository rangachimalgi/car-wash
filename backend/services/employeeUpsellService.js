import EmployeeUpsellConfig from '../models/EmployeeUpsellConfig.js';
import EmployeeUpsellEvent from '../models/EmployeeUpsellEvent.js';
import { getPeriodBounds } from '../utils/employeeIncentivePeriod.js';

/**
 * Commission for the week containing refDate: 10% of weekly sum if sum >= target.
 */
export async function getUpsellCommissionForWeek(employeeId, refDate) {
  const config = await EmployeeUpsellConfig.findOne().sort({ updatedAt: -1 }).lean();
  const target = Number(config?.targetAmount ?? 3000);
  const percent = Number(config?.commissionPercent ?? 10);
  const tz = config?.timezone || 'Asia/Kolkata';
  const weekStartsOn = Number(config?.weekStartsOn ?? 1);
  const isActive = config?.isActive !== false;

  const { start, end, periodKey } = getPeriodBounds(refDate, 'weekly', tz, weekStartsOn);

  const agg = await EmployeeUpsellEvent.aggregate([
    {
      $match: {
        employeeId,
        createdAt: { $gte: start, $lt: end },
      },
    },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const totalSales = agg.length ? Number(agg[0].total) : 0;
  const qualifies = isActive && totalSales >= target;
  const commissionAmount = qualifies ? Number(((totalSales * percent) / 100).toFixed(2)) : 0;

  return {
    periodKey,
    totalSales,
    targetAmount: target,
    commissionPercent: percent,
    commissionAmount,
    qualifies,
    isActive,
    periodStart: start,
    periodEnd: end,
  };
}
