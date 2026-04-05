/**
 * Map API order.status to canonical values used in Bookings UI.
 * Prevents orders from disappearing from both Upcoming and Recent when casing differs.
 */
export function normalizeOrderStatus(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return '';
  const key = s.toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  const map = {
    pending: 'Pending',
    paid: 'Paid',
    scheduled: 'Scheduled',
    'in progress': 'In Progress',
    inprogress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    canceled: 'Cancelled',
  };
  return map[key] || s;
}
