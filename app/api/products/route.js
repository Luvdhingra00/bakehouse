import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import InventoryLog from "@/models/InventoryLog";
import { handler, ok, readJson } from "@/lib/api";
import { productSchema } from "@/lib/validators";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const SORTS = {
  newest: { createdAt: -1 },
  "price-asc": { price: 1 },
  "price-desc": { price: -1 },
  popular: { soldCount: -1 },
  name: { name: 1 },
  "stock-asc": { stock: 1 },
};

export const GET = handler(async (req) => {
  const sp = new URL(req.url).searchParams;
  const q = sp.get("q")?.trim();
  const category = sp.get("category");
  const sort = SORTS[sp.get("sort")] || SORTS.newest;
  const limit = Math.min(Number(sp.get("limit")) || 100, 200);

  const session = await getSession();
  const isAdmin = session?.role === "admin";

  const filter = {};
  // Customers only see available products. Admins can see everything.
  if (!isAdmin || sp.get("all") !== "1") filter.isAvailable = true;
  if (category && category !== "All") filter.category = category;
  if (q) filter.name = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
  if (sp.get("lowStock") === "1" && isAdmin) filter.$expr = { $lte: ["$stock", "$minimumStock"] };

  await connectDB();
  const products = await Product.find(filter).sort(sort).limit(limit).lean();
  return ok({ products });
});

export const POST = handler(
  async (req, _ctx, session) => {
    const data = productSchema.parse(await readJson(req));
    await connectDB();
    const product = await Product.create(data);
    if (product.stock > 0) {
      await InventoryLog.create({
        productId: product._id,
        productName: product.name,
        changeType: "set",
        quantityChanged: product.stock,
        previousStock: 0,
        newStock: product.stock,
        reason: "Initial stock",
      });
    }
    return ok({ product }, 201);
  },
  { role: "admin" }
);
