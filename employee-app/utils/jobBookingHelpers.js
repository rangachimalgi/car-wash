export function isToday(dateValue) {
  if (!dateValue) return false;
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

export function isTomorrow(dateValue) {
  if (!dateValue) return false;
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return false;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return (
    d.getDate() === tomorrow.getDate() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getFullYear() === tomorrow.getFullYear()
  );
}

export function getDateLabel(dateValue) {
  if (!dateValue) return 'Scheduled';
  if (isToday(dateValue)) return 'Today';
  if (isTomorrow(dateValue)) return 'Tomorrow';
  try {
    return new Date(dateValue).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return 'Scheduled';
  }
}

export function formatScheduledDate(dateValue) {
  if (!dateValue) return '';
  try {
    return new Date(dateValue).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export function getScheduledDate(order) {
  const item = order?.items?.[0];
  if (!item) return null;
  return item.scheduledDate || item.scheduledSlots?.[0]?.scheduledDate || null;
}

export function getScheduledTimeSlot(order) {
  const item = order?.items?.[0];
  if (!item) return '—';
  return item.scheduledTimeSlot || item.scheduledSlots?.[0]?.scheduledTimeSlot || '—';
}

export function getAssignment(order, employeeId) {
  const eid = String(employeeId ?? '').trim();
  if (!eid) return undefined;
  return order?.assignments?.find((a) => String(a.employeeId) === eid);
}

export function getServiceIcon(category, serviceName) {
  const key = `${category || ''} ${serviceName || ''}`.toLowerCase();
  if (key.includes('interior') || key.includes('vacuum')) return 'seat-passenger';
  if (key.includes('wax') || key.includes('polish') || key.includes('ceramic')) return 'spray';
  if (key.includes('package') || key.includes('monthly')) return 'calendar-month';
  if (key.includes('bike') || key.includes('two')) return 'motorbike';
  return 'car-wash';
}

export function mapOrderToBooking(order, employeeId) {
  const firstItem = order?.items?.[0];
  const scheduledDate = getScheduledDate(order);
  const serviceName =
    firstItem?.service?.name || firstItem?.serviceName || 'Service';
  const category = firstItem?.service?.category || '';
  const assignment = employeeId ? getAssignment(order, employeeId) : null;
  let statusLabel = null;
  if (assignment?.status === 'completed') statusLabel = 'Completed';
  else if (assignment?.status === 'declined') statusLabel = 'Declined';

  return {
    id: order._id,
    service: serviceName,
    time: getScheduledTimeSlot(order),
    location: order?.customer?.address || 'Address not set',
    customer: order?.customer?.name || 'Customer',
    orderNumber: order?.orderNumber || '',
    vehicle: [order?.customer?.vehicleType, order?.customer?.vehicleModel]
      .filter(Boolean)
      .join(' '),
    price: `₹${Number(order?.totalAmount ?? 0).toLocaleString('en-IN')}`,
    dateLabel: getDateLabel(scheduledDate),
    dateFormatted: formatScheduledDate(scheduledDate),
    statusLabel,
    scheduledTs: scheduledDate ? new Date(scheduledDate).getTime() : Number.MAX_SAFE_INTEGER,
    icon: getServiceIcon(category, serviceName),
  };
}

export function sortBookingsByDate(bookings) {
  return [...bookings].sort((a, b) => a.scheduledTs - b.scheduledTs);
}
