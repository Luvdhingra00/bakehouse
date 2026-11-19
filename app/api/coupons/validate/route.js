import { connectDB } from "@/lib/db";
import Coupon from "@/models/Coupon";
import Product from "@/models/Product";
import { handler, ok, fail, readJson } from "@/lib/api";
import { evaluateCoupon } from "@/lib/coupon";

// POST { code, items: [{productId, quantity}] } -> { discount, subtotal, total }
// Subtotal is recomputed from DB prices; the client's numbers are never trusted.
export const POST = handler(async (req) => {
  const { code, items } = await readJson(req);
  if (!code || !Array.isArray(items) || items.length === 0) return fail("Enter a coupon code", 400);

  await connectDB();
  const products = await Product.find({ _id: { $in: items.map((i) => i.productId) } }).lean();
  const byId = new Map(products.map((p) => [String(p._id), p]));
  let subtotal = 0;
  for (const i of items) {
    const p = byId.get(String(i.productId));
    if (p) subtotal += p.price * Math.max(1, Number(i.quantity) || 1);
  }

  const coupon = await Coupon.findOne({ code: String(code).trim().toUpperCase() }).lean();
  const result = evaluateCoupon(coupon, subtotal);
  if (!result.ok) return fail(result.error, 400);

  return ok({ code: coupon.code, discount: result.discount, subtotal, total: subtotal - result.discount });
});
