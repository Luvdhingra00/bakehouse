import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Coupon from "@/models/Coupon";
import InventoryLog from "@/models/InventoryLog";
import { handler, ok, fail, readJson } from "@/lib/api";
import { orderStatusSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

const NEXT = {
  Pending: ["Confirmed", "Cancelled"],
  Confirmed: ["Preparing", "Cancelled"],
  Preparing: ["Out for Delivery", "Cancelled"],
  "Out for Delivery": ["Delivered", "Cancelled"],
  Delivered: [],
  Cancelled: [],
};

// Put stock + coupon use back when an order is cancelled
async function restoreOrder(order, reason) {
  for (const it of order.items) {
    const updated = await Product.findByIdAndUpdate(
      it.productId,
      { $inc: { stock: it.quantity, soldCount: -it.quantity } },
      { new: true }
    );
    if (updated) {
      await InventoryLog.create({
        productId: updated._id,
        productName: updated.name,
        changeType: "cancel",
        quantityChanged: it.quantity,
        previousStock: updated.stock - it.quantity,
        newStock: updated.stock,
        reason,
      });
    }
  }
  if (order.couponCode) await Coupon.updateOne({ code: order.couponCode, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
}

export const GET = handler(
  async (_req, { params }, session) => {
    await connectDB();
    const order = await Order.findById(params.id).lean();
    if (!order || (session.role !== "admin" && String(order.userId) !== session.id)) return fail("Order not found", 404);
    return ok({ order });
  },
  { role: "user" }
);

// Admin: change orderStatus / paymentStatus.  Customer: { orderStatus: "Cancelled" } on their own early orders.
export const PATCH = handler(
  async (req, { params }, session) => {
    const body = orderStatusSchema.parse(await readJson(req));
    await connectDB();
    const order = await Order.findById(params.id);
    if (!order) return fail("Order not found", 404);

    const isAdmin = session.role === "admin";
    if (!isAdmin) {
      if (String(order.userId) !== session.id) return fail("Order not found", 404);
      if (body.orderStatus !== "Cancelled" || body.paymentStatus) return fail("You can only cancel your order", 403);
      if (!["Pending", "Confirmed"].includes(order.orderStatus))
        return fail("This order can no longer be cancelled", 400);
    }

    if (body.orderStatus && body.orderStatus !== order.orderStatus) {
      if (!NEXT[order.orderStatus].includes(body.orderStatus))
        return fail(`Cannot change status from ${order.orderStatus} to ${body.orderStatus}`, 400);

      if (body.orderStatus === "Cancelled") {
        // Guard against double-restore if two requests race
        const claimed = await Order.findOneAndUpdate(
          { _id: order._id, orderStatus: { $ne: "Cancelled" } },
          { orderStatus: "Cancelled" },
          { new: true }
        );
        if (!claimed) return fail("Order is already cancelled", 400);
        await restoreOrder(order, `Cancelled order #${order._id.toString().slice(-6).toUpperCase()}`);
        order.orderStatus = "Cancelled";
        if (order.paymentStatus === "Paid") order.paymentStatus = "Refunded";
      } else {
        order.orderStatus = body.orderStatus;
        if (body.orderStatus === "Delivered" && order.paymentMethod === "COD") order.paymentStatus = "Paid";
      }
    }
    if (isAdmin && body.paymentStatus) order.paymentStatus = body.paymentStatus;

    await order.save();
    return ok({ order });
  },
  { role: "user" }
);
