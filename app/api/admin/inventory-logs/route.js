import { connectDB } from "@/lib/db";
import InventoryLog from "@/models/InventoryLog";
import { handler, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handler(
  async (req) => {
    await connectDB();
    const productId = new URL(req.url).searchParams.get("productId");
    const logs = await InventoryLog.find(productId ? { productId } : {}).sort({ createdAt: -1 }).limit(50).lean();
    return ok({ logs });
  },
  { role: "admin" }
);
