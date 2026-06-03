export const CATEGORY_ICONS = {
  Soap: 'bottle-tonic-outline',
  Towels: 'hanger',
  Polish: 'spray',
  Equipment: 'toolbox-outline',
  Other: 'package-variant',
};

export function readMaxCapacity(item) {
  const raw = item?.maxCapacity ?? item?.max_capacity;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function getItemCapacity(item) {
  const current = Number(item?.currentStock) || 0;
  const max = readMaxCapacity(item);
  const percent =
    max != null && max > 0 ? Math.min(100, Math.round((current / max) * 100)) : null;
  return { current, max, percent, hasConfiguredMax: max != null };
}

export function formatAmount(value) {
  const n = Number(value) || 0;
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, '');
}

export function getStockLabel(item) {
  const { current, max, hasConfiguredMax } = getItemCapacity(item);
  const unit = item?.unit || 'units';
  if (hasConfiguredMax) {
    return `${formatAmount(current)} left / ${formatAmount(max)} ${unit}`;
  }
  return `${formatAmount(current)} ${unit} in stock`;
}

export function getCategoryIcon(category) {
  return CATEGORY_ICONS[category] || CATEGORY_ICONS.Other;
}

export function getQuantityStep(unit = '') {
  const u = String(unit).toLowerCase();
  if (u.includes('l') || u.includes('liter') || u.includes('ml')) return 0.5;
  return 1;
}

export function buildJobPickerLabel(order) {
  const parts = [];
  if (order?.orderNumber) parts.push(order.orderNumber);
  const vehicle = [order?.customer?.vehicleType, order?.customer?.vehicleModel]
    .filter(Boolean)
    .join(' ');
  if (vehicle) parts.push(vehicle);
  else if (order?.customer?.name) parts.push(order.customer.name);
  return parts.join(' · ') || 'Job';
}
