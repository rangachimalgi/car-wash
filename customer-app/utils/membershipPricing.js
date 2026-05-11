/**
 * Apply Woosh membership percent discount (0–100) to a gross line amount.
 */
export function applyWooshMembershipDiscount(grossPrice, discountPercent) {
  const gross = Number(grossPrice) || 0;
  const p = Math.min(100, Math.max(0, Number(discountPercent) || 0));
  if (!p || gross <= 0) return Math.round(gross);
  return Math.round(gross * (1 - p / 100));
}

/**
 * Scale base + add-on line so totals match discounted gross (for cart item shape).
 */
export function scaleLineItemsToDiscountedGross({
  basePrice,
  addOns,
  grossBeforeDiscount,
  discountPercent,
}) {
  const gross = Math.round(Number(grossBeforeDiscount) || 0);
  const discounted = applyWooshMembershipDiscount(gross, discountPercent);
  if (!discountPercent || gross <= 0) {
    return {
      basePrice: Math.round(Number(basePrice) || 0),
      addOns: addOns || [],
      price: gross,
    };
  }
  const factor = discounted / gross;
  const scaledAddOns = (addOns || []).map((a) => ({
    ...a,
    price: Math.round((Number(a.price) || 0) * factor),
    basePrice: a.basePrice != null ? Math.round(Number(a.basePrice) * factor) : undefined,
  }));
  const addSum = scaledAddOns.reduce((s, a) => s + (Number(a.price) || 0), 0);
  const scaledBase = Math.max(0, discounted - addSum);
  return {
    basePrice: scaledBase,
    addOns: scaledAddOns,
    price: discounted,
  };
}
