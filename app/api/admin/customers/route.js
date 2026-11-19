import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Order from "@/models/Order";
import { handler, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handler(
  async () => {
    await connectDB();
    const [users, agg] = await Promise.all([
      User.find({ role: "customer" }).sort({ createdAt: -1 }).lean(),
      Order.aggregate([
        { $match: { orderStatus: { $ne: "Cancelled" } } },
        { $group: { _id: "$userId", orders: { $sum: 1 }, spent: { $sum: "$totalAmount" }, last: { $max: "$createdAt" } } },
      ]),
    ]);
    const byUser = new Map(agg.map((a) => [String(a._id), a]));
    const customers = users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      address: u.address,
      joined: u.createdAt,
      totalOrders: byUser.get(String(u._id))?.orders || 0,
      totalSpent: byUser.get(String(u._id))?.spent || 0,
      lastOrder: byUser.get(String(u._id))?.last || null,
    }));
    return ok({ customers });
  },
  { role: "admin" }
);
