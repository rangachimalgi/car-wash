import Order from '../models/Order.js';
import { notifyCustomerRateReminder } from './pushNotificationService.js';

const REMINDER_AFTER_MS = 30 * 60 * 1000;
const CHECK_INTERVAL_MS = 5 * 60 * 1000;

async function sendPendingRatingReminders() {
  const cutoff = new Date(Date.now() - REMINDER_AFTER_MS);
  const orders = await Order.find({
    status: 'Completed',
    $or: [{ rating: { $exists: false } }, { rating: null }],
    'notificationFlags.ratingReminderSentAt': { $exists: false },
    updatedAt: { $lte: cutoff },
  })
    .limit(50)
    .select('_id user orderNumber notificationFlags');

  for (const order of orders) {
    try {
      const sent = await notifyCustomerRateReminder(order);
      if (sent) {
        order.notificationFlags = order.notificationFlags || {};
        order.notificationFlags.ratingReminderSentAt = new Date();
        await order.save();
      }
    } catch (err) {
      console.error('[ratingReminder] Failed for order', order._id, err?.message);
    }
  }
}

export function startRatingReminderScheduler() {
  sendPendingRatingReminders().catch((err) => {
    console.error('[ratingReminder] Initial run failed:', err?.message);
  });
  const intervalId = setInterval(() => {
    sendPendingRatingReminders().catch((err) => {
      console.error('[ratingReminder] Scheduled run failed:', err?.message);
    });
  }, CHECK_INTERVAL_MS);
  return () => clearInterval(intervalId);
}
