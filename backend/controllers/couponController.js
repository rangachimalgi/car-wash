import Coupon from '../models/Coupon.js';

const round2 = (n) => Number(Number(n || 0).toFixed(2));

export const computeCouponDiscount = ({ coupon, orderAmount, phone }) => {
  const amount = Number(orderAmount || 0);
  if (!coupon || !coupon.isActive) {
    return { valid: false, message: 'Coupon is not active' };
  }
  if (amount <= 0) {
    return { valid: false, message: 'Invalid order amount' };
  }
  if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
    return { valid: false, message: 'Coupon has expired' };
  }
  if (amount < Number(coupon.minOrderAmount || 0)) {
    return { valid: false, message: `Minimum order amount is ₹${coupon.minOrderAmount}` };
  }
  if (Number(coupon.usageLimit || 0) > 0 && Number(coupon.usedCount || 0) >= Number(coupon.usageLimit)) {
    return { valid: false, message: 'Coupon usage limit reached' };
  }

  const normalizedPhone = String(phone || '').trim();
  const userUsage = normalizedPhone
    ? (coupon.usageByPhone || []).find((u) => u.phone === normalizedPhone)?.count || 0
    : 0;
  if (normalizedPhone && Number(coupon.perUserLimit || 0) > 0 && userUsage >= Number(coupon.perUserLimit)) {
    return { valid: false, message: 'Coupon usage limit reached for this user' };
  }

  let discount = 0;
  if (coupon.discountType === 'PERCENT') {
    discount = (amount * Number(coupon.discountValue || 0)) / 100;
    if (Number(coupon.maxDiscount || 0) > 0) {
      discount = Math.min(discount, Number(coupon.maxDiscount));
    }
  } else {
    discount = Number(coupon.discountValue || 0);
  }
  discount = round2(Math.min(discount, amount));
  if (discount <= 0) {
    return { valid: false, message: 'Coupon not applicable' };
  }

  return {
    valid: true,
    message: 'Coupon applied',
    discountAmount: discount,
    finalAmount: round2(amount - discount),
  };
};

// @desc    Create coupon (admin panel)
// @route   POST /api/coupons
// @access  Public (admin panel usage)
export const createCoupon = async (req, res) => {
  try {
    const {
      code,
      discountType = 'FLAT',
      discountValue,
      minOrderAmount = 0,
      maxDiscount = 0,
      expiryDate,
      usageLimit = 0,
      perUserLimit = 1,
      isActive = true,
    } = req.body || {};

    if (!code || String(code).trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Valid coupon code is required' });
    }
    if (Number(discountValue) <= 0) {
      return res.status(400).json({ success: false, message: 'Discount value must be greater than 0' });
    }
    if (!['FLAT', 'PERCENT'].includes(String(discountType).toUpperCase())) {
      return res.status(400).json({ success: false, message: 'Invalid discount type' });
    }

    const coupon = await Coupon.create({
      code: String(code).trim().toUpperCase(),
      discountType: String(discountType).trim().toUpperCase(),
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount || 0),
      maxDiscount: Number(maxDiscount || 0),
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      usageLimit: Number(usageLimit || 0),
      perUserLimit: Number(perUserLimit || 1),
      isActive: Boolean(isActive),
    });

    res.status(201).json({ success: true, data: coupon });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: 'Coupon code already exists' });
    }
    console.error('Error creating coupon:', error);
    res.status(500).json({ success: false, message: 'Error creating coupon', error: error.message });
  }
};

// @desc    List coupons
// @route   GET /api/coupons
// @access  Public (admin panel usage)
export const listCoupons = async (_req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: coupons.length, data: coupons });
  } catch (error) {
    console.error('Error listing coupons:', error);
    res.status(500).json({ success: false, message: 'Error listing coupons', error: error.message });
  }
};

// @desc    Validate coupon for checkout
// @route   POST /api/coupons/validate
// @access  Protected
export const validateCoupon = async (req, res) => {
  try {
    const { code, orderAmount, phone } = req.body || {};
    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }

    const coupon = await Coupon.findOne({ code: String(code).trim().toUpperCase() });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    }

    const result = computeCouponDiscount({
      coupon,
      orderAmount: Number(orderAmount || 0),
      phone: phone || req.user?.phone || '',
    });

    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.message });
    }

    res.status(200).json({
      success: true,
      data: {
        couponId: coupon._id,
        code: coupon.code,
        discountAmount: result.discountAmount,
        finalAmount: result.finalAmount,
      },
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    res.status(500).json({ success: false, message: 'Error validating coupon', error: error.message });
  }
};
