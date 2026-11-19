import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import InventoryLog from "@/models/InventoryLog";
import { handler, ok, fail, readJson } from "@/lib/api";
import { productSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export const GET = handler(async (_req, { params }) => {
  await connectDB();
  const product = await Product.findById(params.id).lean();
  if (!product) return fail("Product not found", 404);
  return ok({ product });
});

export const PUT = handler(
  async (req, { params }) => {
    const data = productSchema.parse(await readJson(req));
    await connectDB();
    const existing = await Product.findById(params.id);
    if (!existing) return fail("Product not found", 404);

    const prevStock = existing.stock;
    Object.assign(existing, data);
    await existing.save();

    if (prevStock !== existing.stock) {
      await InventoryLog.create({
        productId: existing._id,
        productName: existing.name,
        changeType: "set",
        quantityChanged: existing.stock - prevStock,
        previousStock: prevStock,
        newStock: existing.stock,
        reason: "Edited product",
      });
    }
    return ok({ product: existing });
  },
  { role: "admin" }
);

export const DELETE = handler(
  async (_req, { params }) => {
    await connectDB();
    const product = await Product.findByIdAndDelete(params.id);
    if (!product) return fail("Product not found", 404);
    return ok({ success: true });
  },
  { role: "admin" }
);
