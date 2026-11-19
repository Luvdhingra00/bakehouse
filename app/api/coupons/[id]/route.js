import { connectDB } from "@/lib/db";
import Coupon from "@/models/Coupon";
import { handler, ok, fail, readJson } from "@/lib/api";
import { couponSchema } from "@/lib/validators";

export const PUT = handler(
  async (req, { params }) => {
    const body = await readJson(req);
    await connectDB();

    // Quick toggle: { isActive: true/false }
    if (Object.keys(body).length === 1 && "isActive" in body) {
      const c = await Coupon.findByIdAndUpdate(params.id, { isActive: !!body.isActive }, { new: true });
      return c ? ok({ coupon: c }) : fail("Coupon not found", 404);
    }

    const data = couponSchema.parse(body);
    const c = await Coupon.findByIdAndUpdate(params.id, data, { new: true });
    return c ? ok({ coupon: c }) : fail("Coupon not found", 404);
  },
  { role: "admin" }
);

export const DELETE = handler(
  async (_req, { params }) => {
    await connectDB();
    const c = await Coupon.findByIdAndDelete(params.id);
    return c ? ok({ success: true }) : fail("Coupon not found", 404);
  },
  { role: "admin" }
);
