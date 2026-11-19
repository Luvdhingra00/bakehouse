import { connectDB } from "@/lib/db";
import Coupon from "@/models/Coupon";
import { handler, ok, readJson } from "@/lib/api";
import { couponSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export const GET = handler(
  async () => {
    await connectDB();
    return ok({ coupons: await Coupon.find().sort({ createdAt: -1 }).lean() });
  },
  { role: "admin" }
);

export const POST = handler(
  async (req) => {
    const data = couponSchema.parse(await readJson(req));
    await connectDB();
    return ok({ coupon: await Coupon.create(data) }, 201);
  },
  { role: "admin" }
);
