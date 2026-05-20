import Service from '../models/Service.js';
import Membership from '../models/Membership.js';
import { getActiveMembershipWashDiscountPercent } from '../services/membershipService.js';

const DEFAULT_PLAN_ID = 'woosh_green';
const LEGACY_PLAN_ID = 'woosh_black';

const mapServiceToPlan = (svc) => {
  if (!svc) return null;
  const price = Number(svc.basePrice || 0);
  const mrp = Number(svc.listPrice) > 0 ? Number(svc.listPrice) : price;
  return {
    planId: DEFAULT_PLAN_ID,
    serviceId: String(svc._id),
    name: svc.name || 'Woosh Green',
    price,
    mrp,
    durationMonths: Number(svc.membershipDurationMonths) || 12,
    discountPercent: Number(svc.membershipDiscountPercent) || 0,
  };
};

// @route GET /api/memberships/plans
export const getMembershipPlans = async (req, res) => {
  try {
    const services = await Service.find({ category: 'Membership', isActive: true })
      .sort({ name: 1 })
      .lean();

    const data = services.map(mapServiceToPlan).filter(Boolean);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('getMembershipPlans:', error);
    res.status(500).json({ success: false, message: 'Failed to load membership plans' });
  }
};

// @route GET /api/memberships/me
export const getMyMembership = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const active = await Membership.findOne({
      user: userId,
      status: 'active',
      endsAt: { $gt: now },
    })
      .sort({ endsAt: -1 })
      .lean();

    if (!active) {
      return res.status(200).json({
        success: true,
        data: { active: false, membership: null },
      });
    }

    const planId = String(active.planId || '').trim();
    const planLabel =
      planId === DEFAULT_PLAN_ID || planId === LEGACY_PLAN_ID
        ? 'Woosh Green'
        : planId
          ? planId.replace(/_/g, ' ')
          : 'Woosh membership';

    const discountPercent = await getActiveMembershipWashDiscountPercent(userId);

    res.status(200).json({
      success: true,
      data: {
        active: true,
        membership: {
          planId: active.planId,
          planLabel,
          startsAt: active.startsAt,
          endsAt: active.endsAt,
          discountPercent,
        },
      },
    });
  } catch (error) {
    console.error('getMyMembership:', error);
    res.status(500).json({ success: false, message: 'Failed to load membership' });
  }
};
