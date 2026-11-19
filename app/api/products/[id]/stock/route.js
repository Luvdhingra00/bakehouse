import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import InventoryLog from "@/models/InventoryLog";
import { handler, ok, fail, readJson } from "@/lib/api";
import { stockUpdateSchema } from "@/lib/validators";

// Atomic stock adjustment so two admins (or an admin and a customer order)
// can't overwrite each other's changes.
export const PATCH = handler(
  async (req, { params }) => {
    const { mode, quantity, reason } = stockUpdateSchema.parse(await readJson(req));
    await connectDB();

    let updated;
    if (mode === "add") {
      updated = await Product.findByIdAndUpdate(params.id, { $inc: { stock: quantity } }, { new: true });
    } else if (mode === "remove") {
      updated = await Product.findOneAndUpdate(
        { _id: params.id, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { new: true }
      );
      if (!updated) {
        const exists = await Product.exists({ _id: params.id });
        return fail(exists ? "Cannot remove more than the current stock" : "Product not found", exists ? 400 : 404);
      }
    } else {
      updated = await Product.findByIdAndUpdate(params.id, { $set: { stock: quantity } }, { new: true });
    }
    if (!updated) return fail("Product not found", 404);

    const newStock = updated.stock;
    const previousStock = mode === "add" ? newStock - quantity : mode === "remove" ? newStock + quantity : null;
    await InventoryLog.create({
      productId: updated._id,
      productName: updated.name,
      changeType: mode,
      quantityChanged: mode === "set" ? newStock : mode === "add" ? quantity : -quantity,
      previousStock: previousStock ?? 0,
      newStock,
      reason,
    });
    return ok({ product: updated });
  },
  { role: "admin" }
);
