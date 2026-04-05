import EmployeeIncentiveConfig from '../models/EmployeeIncentiveConfig.js';
import EmployeeIncentiveEntry from '../models/EmployeeIncentiveEntry.js';
import EmployeeUpsellConfig from '../models/EmployeeUpsellConfig.js';
import { getUpsellCommissionForWeek } from '../services/employeeUpsellService.js';

export const getIncentiveConfig = async (req, res) => {
  try {
    let config = await EmployeeIncentiveConfig.findOne().sort({ updatedAt: -1 }).lean();
    if (!config) {
      config = {
        periodType: 'weekly',
        targetCount: 4,
        amountPerExtraService: 100,
        timezone: 'Asia/Kolkata',
        weekStartsOn: 1,
        isActive: true,
      };
    }
    res.status(200).json({ success: true, data: config });
  } catch (error) {
    console.error('getIncentiveConfig:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const putIncentiveConfig = async (req, res) => {
  try {
    const {
      periodType,
      targetCount,
      amountPerExtraService,
      timezone,
      weekStartsOn,
      isActive,
    } = req.body;

    if (periodType && !['daily', 'weekly'].includes(periodType)) {
      return res.status(400).json({ success: false, message: 'periodType must be daily or weekly' });
    }

    const update = {};
    if (periodType !== undefined) update.periodType = periodType;
    if (targetCount !== undefined) update.targetCount = Math.max(0, Number(targetCount));
    if (amountPerExtraService !== undefined) {
      update.amountPerExtraService = Math.max(0, Number(amountPerExtraService));
    }
    if (timezone !== undefined) update.timezone = String(timezone).trim() || 'Asia/Kolkata';
    if (weekStartsOn !== undefined) {
      const w = Number(weekStartsOn);
      if (Number.isNaN(w) || w < 0 || w > 6) {
        return res.status(400).json({ success: false, message: 'weekStartsOn must be 0–6' });
      }
      update.weekStartsOn = w;
    }
    if (isActive !== undefined) update.isActive = Boolean(isActive);

    const config = await EmployeeIncentiveConfig.findOneAndUpdate(
      {},
      { $set: update },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ success: true, data: config });
  } catch (error) {
    console.error('putIncentiveConfig:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyIncentiveEarnings = async (req, res) => {
  try {
    const employeeId = req.employee?.employeeId;
    if (!employeeId) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const entries = await EmployeeIncentiveEntry.find({ employeeId })
      .sort({ completedAt: -1 })
      .limit(200)
      .lean();

    const total = entries.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    let config = await EmployeeIncentiveConfig.findOne().sort({ updatedAt: -1 }).lean();
    if (!config) {
      config = {
        periodType: 'weekly',
        targetCount: 4,
        amountPerExtraService: 100,
        timezone: 'Asia/Kolkata',
        weekStartsOn: 1,
        isActive: true,
      };
    }

    const upsellWeek = await getUpsellCommissionForWeek(employeeId, new Date());
    const target = Number(upsellWeek.targetAmount ?? 0);
    const sales = Number(upsellWeek.totalSales ?? 0);
    const progress = target > 0 ? Math.min(1, sales / target) : 0;

    res.status(200).json({
      success: true,
      data: {
        config,
        entries,
        totalIncentives: total,
        upsell: {
          ...upsellWeek,
          progress,
        },
      },
    });
  } catch (error) {
    console.error('getMyIncentiveEarnings:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUpsellConfig = async (req, res) => {
  try {
    let config = await EmployeeUpsellConfig.findOne().sort({ updatedAt: -1 }).lean();
    if (!config) {
      config = {
        targetAmount: 3000,
        commissionPercent: 10,
        timezone: 'Asia/Kolkata',
        weekStartsOn: 1,
        isActive: true,
      };
    }
    res.status(200).json({ success: true, data: config });
  } catch (error) {
    console.error('getUpsellConfig:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const putUpsellConfig = async (req, res) => {
  try {
    const { targetAmount, commissionPercent, timezone, weekStartsOn, isActive } = req.body;
    const update = {};
    if (targetAmount !== undefined) update.targetAmount = Math.max(0, Number(targetAmount));
    if (commissionPercent !== undefined) {
      const p = Number(commissionPercent);
      if (Number.isNaN(p) || p < 0 || p > 100) {
        return res.status(400).json({ success: false, message: 'commissionPercent must be 0–100' });
      }
      update.commissionPercent = p;
    }
    if (timezone !== undefined) update.timezone = String(timezone).trim() || 'Asia/Kolkata';
    if (weekStartsOn !== undefined) {
      const w = Number(weekStartsOn);
      if (Number.isNaN(w) || w < 0 || w > 6) {
        return res.status(400).json({ success: false, message: 'weekStartsOn must be 0–6' });
      }
      update.weekStartsOn = w;
    }
    if (isActive !== undefined) update.isActive = Boolean(isActive);

    const config = await EmployeeUpsellConfig.findOneAndUpdate(
      {},
      { $set: update },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.status(200).json({ success: true, data: config });
  } catch (error) {
    console.error('putUpsellConfig:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
