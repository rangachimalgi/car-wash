import Employee from '../models/Employee.js';
import User from '../models/User.js';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_RECEIPTS_URL = 'https://exp.host/--/api/v2/push/getReceipts';

export const NOTIFICATION_TYPES = {
  NEW_JOB: 'new_job',
  ON_THE_WAY: 'on_the_way',
  SERVICE_STARTING: 'service_starting',
  SERVICE_STARTED: 'service_started',
  SERVICE_COMPLETED: 'service_completed',
  RATE_SERVICE: 'rate_service',
  BOOKING_CONFIRMED: 'booking_confirmed',
};

export function isValidExpoPushToken(token) {
  const t = (token || '').toString().trim();
  return t.startsWith('ExponentPushToken[') || t.startsWith('ExpoPushToken[');
}

/** Android channel for heads-up banners — must match app notificationSetup.js */
export const PUSH_CHANNEL_ID = 'woosh_urgent';

/**
 * Send one or more Expo push messages. Returns Expo API response data.
 * Invalid tokens in the response are logged for future cleanup.
 */
export async function sendExpoPush(messages) {
  const batch = (Array.isArray(messages) ? messages : [messages])
    .filter((m) => m?.to && isValidExpoPushToken(m.to))
    .map((m) => ({
      to: m.to,
      title: m.title || 'Woosh',
      body: m.body || '',
      sound: m.sound ?? 'default',
      priority: m.priority ?? 'high',
      channelId: m.channelId ?? PUSH_CHANNEL_ID,
      ttl: m.ttl ?? 3600,
      badge: m.badge,
      data: m.data || {},
    }));

  if (batch.length === 0) {
    console.warn('[push] No valid tokens in batch');
    return { data: [] };
  }

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(batch),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('[push] Expo API HTTP error:', res.status, data);
      return data;
    }

    const tickets = Array.isArray(data?.data) ? data.data : [];
    tickets.forEach((item, i) => {
      if (item?.status === 'error') {
        console.warn('[push] Ticket error:', batch[i]?.to?.slice(0, 30), item.message, item.details);
      } else if (item?.status === 'ok') {
        console.log('[push] Ticket ok:', item.id, batch[i]?.title || 'notification');
      }
    });

    const ticketIds = tickets.filter((t) => t?.status === 'ok' && t?.id).map((t) => t.id);
    if (ticketIds.length > 0) {
      setTimeout(async () => {
        try {
          const receiptRes = await fetch(EXPO_RECEIPTS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ ids: ticketIds }),
          });
          const receipts = await receiptRes.json().catch(() => ({}));
          Object.entries(receipts?.data || {}).forEach(([id, receipt]) => {
            if (receipt?.status === 'error') {
              console.error('[push] Receipt error:', id, receipt.message, receipt.details);
            }
          });
        } catch (err) {
          console.warn('[push] Receipt check failed:', err?.message);
        }
      }, 2500);
    }

    return data;
  } catch (err) {
    console.error('[push] Failed to send:', err?.message || err);
    return { data: [], error: err };
  }
}

/** Send a test push to verify background delivery (app should be killed). */
export async function sendTestPush(token, { title, body } = {}) {
  if (!isValidExpoPushToken(token)) {
    return { ok: false, reason: 'invalid_token' };
  }
  const data = await sendExpoPush({
    to: token,
    title: title || 'Woosh test',
    body: body || 'Background push is working!',
    data: { type: 'test' },
  });
  const ticket = data?.data?.[0];
  if (ticket?.status === 'ok') {
    return { ok: true, ticketId: ticket.id };
  }
  return { ok: false, reason: ticket?.message || 'send_failed', details: ticket?.details };
}

async function getEmployeeTokens(employeeIds) {
  if (!Array.isArray(employeeIds) || employeeIds.length === 0) return [];
  const employees = await Employee.find({
    employeeId: { $in: employeeIds },
    pushToken: { $exists: true, $ne: '' },
  }).select('pushToken employeeId');
  return employees.map((e) => e.pushToken).filter(isValidExpoPushToken);
}

async function getCustomerToken(userId) {
  if (!userId) return null;
  const user = await User.findById(userId).select('expoPushToken');
  const token = (user?.expoPushToken || '').trim();
  return isValidExpoPushToken(token) ? token : null;
}

function orderIdStr(order) {
  return String(order?._id || order?.id || '');
}

function orderLabel(order) {
  return order?.orderNumber ? `#${order.orderNumber}` : 'your booking';
}

/** Notify assigned employees of a new pending job. */
export async function notifyEmployeesNewJob({ employeeIds, orderId, summary = '' }) {
  const tokens = await getEmployeeTokens(employeeIds);
  if (tokens.length === 0) {
    console.warn('[push] new_job skipped — no employee tokens for', employeeIds);
    return;
  }
  console.log('[push] Sending new_job to', tokens.length, 'employee(s)');
  await sendExpoPush(
    tokens.map((to) => ({
      to,
      title: 'New job assigned',
      body: summary || 'You have a new job to review.',
      data: { type: NOTIFICATION_TYPES.NEW_JOB, orderId: String(orderId || '') },
    }))
  );
}

/** Customer: employee shared live location for the first time. */
export async function notifyCustomerOnTheWay(order) {
  const token = await getCustomerToken(order.user);
  if (!token) {
    console.warn('[push] on_the_way skipped — no customer token for user', order.user);
    return false;
  }
  console.log('[push] Sending on_the_way to customer', orderIdStr(order));
  await sendExpoPush({
    to: token,
    title: 'On the way',
    body: `Your Woosh pro is heading to you for ${orderLabel(order)}. Tap to track live.`,
    data: { type: NOTIFICATION_TYPES.ON_THE_WAY, orderId: orderIdStr(order) },
  });
  return true;
}

/** Customer: OTP for service start (employee requested). */
export async function notifyCustomerServiceStarting(order, otp) {
  const token = await getCustomerToken(order.user);
  if (!token) return false;
  await sendExpoPush({
    to: token,
    title: 'Service starting',
    body: `Your Woosh service is starting. OTP for employee: ${otp}`,
    data: { type: NOTIFICATION_TYPES.SERVICE_STARTING, orderId: orderIdStr(order) },
  });
  return true;
}

/** Customer: OTP verified, wash in progress. */
export async function notifyCustomerServiceStarted(order) {
  const token = await getCustomerToken(order.user);
  if (!token) return false;
  await sendExpoPush({
    to: token,
    title: 'Wash started',
    body: `Your Woosh service for ${orderLabel(order)} is now in progress.`,
    data: { type: NOTIFICATION_TYPES.SERVICE_STARTED, orderId: orderIdStr(order) },
  });
  return true;
}

/** Customer: service completed. */
export async function notifyCustomerServiceCompleted(order) {
  const token = await getCustomerToken(order.user);
  if (!token) return false;
  await sendExpoPush({
    to: token,
    title: 'Service complete',
    body: `Your Woosh wash for ${orderLabel(order)} is done!`,
    data: { type: NOTIFICATION_TYPES.SERVICE_COMPLETED, orderId: orderIdStr(order) },
  });
  return true;
}

/** Customer: prompt to rate after completion. */
export async function notifyCustomerRateReminder(order) {
  const token = await getCustomerToken(order.user);
  if (!token) return false;
  await sendExpoPush({
    to: token,
    title: 'Rate your wash',
    body: `How was your Woosh service for ${orderLabel(order)}? Tap to rate.`,
    data: { type: NOTIFICATION_TYPES.RATE_SERVICE, orderId: orderIdStr(order) },
  });
  return true;
}

/** Customer: booking confirmed after order create. */
export async function notifyCustomerBookingConfirmed(order) {
  const token = await getCustomerToken(order.user);
  if (!token) return false;
  const item = order.items?.[0];
  const slot = item?.scheduledTimeSlot || item?.scheduledSlots?.[0]?.scheduledTimeSlot || '';
  const body = slot
    ? `Your Woosh booking ${orderLabel(order)} is confirmed for ${slot}.`
    : `Your Woosh booking ${orderLabel(order)} is confirmed.`;
  await sendExpoPush({
    to: token,
    title: 'Booking confirmed',
    body,
    data: { type: NOTIFICATION_TYPES.BOOKING_CONFIRMED, orderId: orderIdStr(order) },
  });
  return true;
}
