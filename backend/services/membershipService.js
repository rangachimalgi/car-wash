import Membership from '../models/Membership.js';

const DEFAULT_PLAN_ID = 'woosh_black';

/**
 * Extend or create active Woosh Black membership after a paid membership order line.
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
