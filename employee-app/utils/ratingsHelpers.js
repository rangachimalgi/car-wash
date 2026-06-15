import { getAssignment } from './jobBookingHelpers.js';

export function orderRatedForEmployee(order, employeeId) {
  const eid = String(employeeId ?? '').trim();
  if (!eid) return false;
  const rating = order?.rating;
  if (typeof rating !== 'number' || rating < 1 || rating > 5) return false;
  if (order.status !== 'Completed') return false;

  if (order.ratedEmployeeId && String(order.ratedEmployeeId) === eid) return true;

  const assignment = getAssignment(order, eid);
  return assignment?.status === 'completed';
}

export function computeEmployeeRating(orders, employeeId) {
  const rated = (Array.isArray(orders) ? orders : []).filter((order) =>
    orderRatedForEmployee(order, employeeId)
  );

  if (rated.length === 0) {
    return { average: null, count: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }, positivePercent: 0 };
  }

  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;
  for (const order of rated) {
    const r = Math.round(order.rating);
    if (r >= 1 && r <= 5) distribution[r] += 1;
    sum += order.rating;
  }

  const count = rated.length;
  const positive = distribution[5] + distribution[4];

  return {
    average: Math.round((sum / count) * 10) / 10,
    count,
    distribution,
    positivePercent: Math.round((positive / count) * 100),
  };
}

export function getRatingLabel(score) {
  const n = Number(score);
  if (n >= 4.5) return 'Excellent';
  if (n >= 4) return 'Good';
  if (n >= 3) return 'Average';
  if (n >= 2) return 'Fair';
  return 'Needs work';
}

export function getInitials(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return '?';
}

export function formatReviewDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatReviewTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function getVehicleLine(order) {
  const model = order?.customer?.vehicleModel || '';
  const type = order?.customer?.vehicleType || '';
  if (model && type) return `${model} • ${type}`;
  return model || type || 'Vehicle not listed';
}
