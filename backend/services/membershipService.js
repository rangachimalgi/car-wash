import Membership from '../models/Membership.js';
import Service from '../models/Service.js';

const DEFAULT_PLAN_ID = 'woosh_green';

/**
 * Wash discount for an active member — always reads live membershipDiscountPercent
 * from the Woosh Green service in admin (not the snapshot stored at purchase).
 */
export async function getActiveMembershipWashDiscountPercent(userId) {
  if (!userId) return 0;

  const now = new Date();
  const active = await Membership.findOne({
    user: userId,
    status: 'active',
    endsAt: { $gt: now },
  })
    .sort({ endsAt: -1 })
    .select('discountPercent service')
    .lean();

  if (!active) return 0;

  let svc = null;
  if (active.service) {
    svc = await Service.findById(active.service).select('membershipDiscountPercent').lean();
  }
  if (!svc) {
    svc = await Service.findOne({ category: 'Membership', isActive: true })
      .select('membershipDiscountPercent')
      .lean();
  }

  const fromService = Number(svc?.membershipDiscountPercent);
  if (Number.isFinite(fromService) && fromService >= 0) {
    return Math.min(100, Math.max(0, fromService));
  }

  return Math.min(100, Math.max(0, Number(active.discountPercent) || 0));
}

/**
 * Extend or create active Woosh Green membership after a paid membership order line.
 */
export async function activateMembershipFromOrder({
  userId,
  sourceOrderId,
  planId = DEFAULT_PLAN_ID,
  durationMonths = 12,
  discountPercent = 0,
  serviceId,
}) {
  if (!userId) return null;

  const now = new Date();
  const addMs = Math.round(Number(durationMonths) * 30.44 * 24 * 60 * 60 * 1000);

  const active = await Membership.findOne({
    user: userId,
    planId,
    status: 'active',
    endsAt: { $gt: now },
  }).sort({ endsAt: -1 });

  let startsAt = now;
  let endsAt = new Date(now.getTime() + addMs);

  if (active) {
    const base = active.endsAt > now ? active.endsAt : now;
    startsAt = active.startsAt;
    endsAt = new Date(base.getTime() + addMs);
    active.status = 'expired';
    await active.save();
  }

  const doc = await Membership.create({
    user: userId,
    planId,
    service: serviceId || undefined,
    startsAt,
    endsAt,
    status: 'active',
    sourceOrder: sourceOrderId,
    discountPercent: Number(discountPercent) || 0,
  });

  return doc;
}
