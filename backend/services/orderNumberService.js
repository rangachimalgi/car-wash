import Order from '../models/Order.js';
import OrderCounter from '../models/OrderCounter.js';

const COUNTER_ID = 'order';
const PAD_LENGTH = 8;

/**
 * Next customer-facing order number: ORD00000001 (stored in Mongo, unique).
 */
export async function generateOrderNumber() {
  const counter = await OrderCounter.findByIdAndUpdate(
    COUNTER_ID,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const seq = Number(counter.seq) || 1;
  return `ORD${String(seq).padStart(PAD_LENGTH, '0')}`;
}

/**
 * Backfill legacy orders that only have _id (one-time per document).
 */
export async function ensureOrderHasNumber(order) {
  if (!order) return order;
  if (order.orderNumber) return order;

  const orderNumber = await generateOrderNumber();
  await Order.updateOne({ _id: order._id, orderNumber: { $in: [null, ''] } }, { $set: { orderNumber } });
  if (typeof order.set === 'function') {
    order.set('orderNumber', orderNumber);
  } else {
    order.orderNumber = orderNumber;
  }
  return order;
}

export async function ensureOrdersHaveNumbers(orders) {
  if (!Array.isArray(orders) || orders.length === 0) return orders;
  return Promise.all(orders.map((o) => ensureOrderHasNumber(o)));
}
