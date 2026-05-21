import { normalizeOrderStatus } from './orderStatus';

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
