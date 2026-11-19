import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import Order from "@/models/Order";
import User from "@/models/User";
import InventoryLog from "@/models/InventoryLog";
import { handler, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handler(
  async () => {
    await connectDB();
    const now = new Date();
    const since = new Date(now.getTime() - 14 * 86400000);

    const [totalProducts, totalOrders, pendingOrders, totalCustomers, lowStock, revenueAgg, salesAgg, recentOrders, topProducts, activity] =
      await Promise.all([
        Product.countDocuments(),
        Order.countDocuments(),
        Order.countDocuments({ orderStatus: "Pending" }),
        User.countDocuments({ role: "customer" }),
        Product.find({ $expr: { $lte: ["$stock", "$minimumStock"] } }).sort({ stock: 1 }).limit(8).lean(),
        Order.aggregate([{ $match: { orderStatus: { $ne: "Cancelled" } } }, { $group: { _id: null, total: { $sum: "$totalAmount" } } }]),
        Order.aggregate([
          { $match: { orderStatus: { $ne: "Cancelled" }, createdAt: { $gte: since } } },
          { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } }, revenue: { $sum: "$totalAmount" }, orders: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]),
        Order.find().sort({ createdAt: -1 }).limit(6).lean(),
        Product.find({ soldCount: { $gt: 0 } }).sort({ soldCount: -1 }).limit(5).select("name soldCount price image").lean(),
        InventoryLog.find().sort({ createdAt: -1 }).limit(8).lean(),
      ]);

    // Fill missing days with zero so the chart has no gaps
    const map = new Map(salesAgg.map((d) => [d._id, d]));
    const sales = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const key = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d);
      sales.push({ date: key, revenue: map.get(key)?.revenue || 0, orders: map.get(key)?.orders || 0 });
    }

    return ok({
      stats: {
        totalProducts,
        totalOrders,
        totalRevenue: revenueAgg[0]?.total || 0,
        pendingOrders,
        lowStockCount: lowStock.length,
        totalCustomers,
      },
      sales,
      recentOrders,
      topProducts,
      lowStock,
      activity,
    });
  },
  { role: "admin" }
);
