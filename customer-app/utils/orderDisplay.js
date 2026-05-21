import { resolveAssetUrl } from '../config/api';
import { normalizeOrderStatus } from './orderStatus';

const CATEGORY_FALLBACK_IMAGES = {
  BikeWash: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=300&h=200&fit=crop&auto=format',
  AutoWash: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=300&h=200&fit=crop&auto=format',
  CarWash: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&auto=format',
};

/** Resolved image URL for an order line item (service image from API, then category fallback). */
export function getOrderItemImageUri(item) {
  const category = item?.service?.category;
  const raw = item?.service?.image || '';
  const resolved = resolveAssetUrl(raw);
  if (resolved) return resolved;
  if (item?.customPackage) {
    return CATEGORY_FALLBACK_IMAGES.CarWash;
  }
  return CATEGORY_FALLBACK_IMAGES[category] || CATEGORY_FALLBACK_IMAGES.CarWash;
}

export function getOrderItemSchedule(item) {
  if (!item) return { date: null, time: '' };
  if (item.packageType === 'OneTime') {
    return { date: item.scheduledDate, time: item.scheduledTimeSlot || '' };
  }
  if (item.customPackage?.packageStartDate) {
    return {
      date: item.customPackage.packageStartDate,
      time: item.customPackage.packageTimeSlot || '',
    };
  }
  const slot = item.scheduledSlots?.[0];
  if (slot) {
    return { date: slot.scheduledDate, time: slot.scheduledTimeSlot || '' };
  }
  return { date: item.scheduledDate, time: item.scheduledTimeSlot || '' };
}

export function getServiceTypeLabel(category, item) {
  const packageType = item?.packageType;
  if (packageType && packageType !== 'OneTime') {
    return `${packageType} Package`;
  }
  if (category === 'CarWash') return 'Car Wash';
  if (category === 'BikeWash') return 'Bike Wash';
  if (category === 'AutoWash') return 'Auto Wash';
  return 'Service';
}

/** Blinkit-style: "15 May, 5:16 pm" */
export function formatOrderDateTime(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  const day = date.getDate();
  const month = date.toLocaleString('en-IN', { month: 'short' });
  const time = date.toLocaleString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
  return `${day} ${month}, ${time}`;
}

export function mapOrderToHistory(order) {
  const item = order.items?.[0];
  const category = item?.service?.category;
  const status = normalizeOrderStatus(order.status) || 'Completed';
  const dateSource = item?.scheduledDate || order.createdAt || order.updatedAt;

  return {
    id: order._id,
    status,
    sortAt: new Date(dateSource).getTime() || 0,
    serviceType: getServiceTypeLabel(category, item),
    serviceName: item?.serviceName || item?.service?.name || 'Service',
    dateTimeLine: `₹${Number(order.totalAmount || 0).toFixed(0)} • ${formatOrderDateTime(dateSource)}`,
    price: `₹${order.totalAmount?.toFixed(2)}`,
    category,
    rating: order.rating,
    review: order.review,
    time: item?.scheduledTimeSlot || '',
  };
}

export function getReorderRoute(category) {
  if (category === 'BikeWash') return { name: 'BikeWash' };
  if (category === 'AutoWash') return { name: 'AutoWash', params: { category: 'AutoWash' } };
  return { name: 'CarWash' };
}
