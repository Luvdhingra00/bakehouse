// Shared coupon rules. Used by the validate endpoint AND order creation,
// so the discount is always computed on the server.
export function evaluateCoupon(coupon, subtotal) {
  if (!coupon) return { ok: false, error: "Invalid coupon code" };
  if (!coupon.isActive) return { ok: false, error: "This coupon is not active" };
  if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date())
    return { ok: false, error: "This coupon has expired" };
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit)
    return { ok: false, error: "This coupon has reached its usage limit" };
  if (subtotal < coupon.minimumOrderAmount)
    return { ok: false, error: `Minimum order of ₹${coupon.minimumOrderAmount} required for this coupon` };

  let discount =
    coupon.discountType === "percentage" ? (subtotal * coupon.discountValue) / 100 : coupon.discountValue;
  if (coupon.maximumDiscount > 0) discount = Math.min(discount, coupon.maximumDiscount);
  discount = Math.min(Math.round(discount), subtotal);
  return { ok: true, discount };
}
