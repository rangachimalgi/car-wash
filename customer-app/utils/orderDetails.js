import { normalizeOrderStatus } from './orderStatus';

/** Customer-facing order id from API (`orderNumber` field in Mongo). */
export function getDisplayOrderId(order) {
  const num = order?.orderNumber;
  if (num && String(num).trim()) return String(num).trim();
  const id = order?._id;
  if (!id) return '—';
  return String(id);
}

/** e.g. placed on Wed, 22 Apr'26, 10:41 PM */
export function formatOrderPlacedAt(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  const weekday = date.toLocaleString('en-IN', { weekday: 'short' });
  const day = date.getDate();
  const month = date.toLocaleString('en-IN', { month: 'short' });
  const year = String(date.getFullYear()).slice(-2);
  const time = date
    .toLocaleString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
    .replace(/\s/g, ' ')
    .trim();
  return `placed on ${weekday}, ${day} ${month}'${year}, ${time}`;
}

export function getPaymentLabel(order) {
  const status = normalizeOrderStatus(order.status);
  const wallet = Number(order.walletUsed || 0);
  const total = Number(order.totalAmount || 0);

  if (wallet > 0 && wallet >= total) return 'Paid via Woosh Coins';
  if (wallet > 0) return `Paid via Woosh Coins & other`;
  if (['Paid', 'Scheduled', 'In Progress', 'Completed'].includes(status)) return 'Paid';
  if (status === 'Cancelled') return 'Cancelled';
  return 'Pending payment';
}

function fmtAmount(n) {
  return `₹${Number(n || 0).toFixed(0)}`;
}

/** Populated add-on services from order line item (names only). */
export function getOrderAddOnNames(order) {
  const addOns = order?.items?.[0]?.addOns;
  if (!Array.isArray(addOns) || addOns.length === 0) return [];
  return addOns
    .map((addOn) => {
      if (!addOn || typeof addOn === 'string') return '';
      return String(addOn.name || '').trim();
    })
    .filter(Boolean);
}

export function buildBillRows(order) {
  const item = order.items?.[0];
  const subtotal = Number(order.subtotal || 0);
  const tax = Number(order.tax || 0);
  const couponDiscount = Number(order.couponDiscount || 0);
  const walletUsed = Number(order.walletUsed || 0);
  const totalAmount = Number(order.totalAmount || 0);
  const unitPrice = Number(item?.unitPrice || 0);
  const addOnsTotal = Number(item?.addOnsTotal || 0);

  const rows = [];

  if (unitPrice > 0) {
    rows.push({ key: 'service', label: 'Service charge', display: fmtAmount(unitPrice) });
  }
  if (addOnsTotal > 0) {
    rows.push({ key: 'addons', label: 'Add-ons', display: fmtAmount(addOnsTotal) });
  }
  rows.push({ key: 'item-total', label: 'Item total', display: fmtAmount(subtotal), bold: true });

  if (tax > 0) {
    rows.push({ key: 'tax', label: 'GST (18%)', display: `+${fmtAmount(tax)}`, charge: true });
  }
  if (couponDiscount > 0) {
    rows.push({
      key: 'coupon',
      label: 'Coupon discount',
      display: `-${fmtAmount(couponDiscount)}`,
      discount: true,
    });
  }
  if (walletUsed > 0) {
    rows.push({
      key: 'wallet',
      label: 'Woosh Coins used',
      display: `-${fmtAmount(walletUsed)}`,
      discount: true,
    });
  }

  return { rows, billTotal: fmtAmount(totalAmount) };
}
