import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { handler, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

// ?range=daily (last 30 days) | monthly (last 12 months)
export const GET = handler(
  async (req) => {
    await connectDB();
    const range = new URL(req.url).searchParams.get("range") === "monthly" ? "monthly" : "daily";
    const days = range === "monthly" ? 365 : 30;
    const since = new Date(Date.now() - days * 86400000);
    const fmt = range === "monthly" ? "%Y-%m" : "%Y-%m-%d";

    const [series, statusCounts, bestSellers, inventory] = await Promise.all([
      Order.aggregate([
        { $match: { orderStatus: { $ne: "Cancelled" }, createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: fmt, date: "$createdAt", timezone: "Asia/Kolkata" } }, revenue: { $sum: "$totalAmount" }, orders: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([{ $group: { _id: "$orderStatus", count: { $sum: 1 } } }]),
      Product.find({ soldCount: { $gt: 0 } }).sort({ soldCount: -1 }).limit(8).select("name soldCount price category").lean(),
      Product.aggregate([
        {
          $group: {
            _id: null,
            totalUnits: { $sum: "$stock" },
            stockValue: { $sum: { $multiply: ["$stock", "$price"] } },
            outOfStock: { $sum: { $cond: [{ $lte: ["$stock", 0] }, 1, 0] } },
            lowStock: { $sum: { $cond: [{ $and: [{ $gt: ["$stock", 0] }, { $lte: ["$stock", "$minimumStock"] }] }, 1, 0] } },
          },
        },
      ]),
    ]);

    const expiring = await Product.find({ expiryDate: { $ne: null, $lte: new Date(Date.now() + 3 * 86400000) } })
      .sort({ expiryDate: 1 })
      .select("name expiryDate stock")
      .limit(10)
      .lean();

    return ok({
      series: series.map((s) => ({ label: s._id, revenue: s.revenue, orders: s.orders })),
      statusCounts: statusCounts.map((s) => ({ status: s._id, count: s.count })),
      bestSellers,
      inventory: inventory[0] || { totalUnits: 0, stockValue: 0, outOfStock: 0, lowStock: 0 },
      expiring,
    });
  },
  { role: "admin" }
);
