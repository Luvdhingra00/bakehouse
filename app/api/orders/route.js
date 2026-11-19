import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import Order from "@/models/Order";
import Coupon from "@/models/Coupon";
import User from "@/models/User";
import InventoryLog from "@/models/InventoryLog";
import { handler, ok, fail, readJson } from "@/lib/api";
import { orderSchema } from "@/lib/validators";
import { evaluateCoupon } from "@/lib/coupon";

export const dynamic = "force-dynamic";

// Customers: their own orders. Admins: all orders (optional ?status= filter).
export const GET = handler(
  async (req, _ctx, session) => {
    await connectDB();
    const sp = new URL(req.url).searchParams;
    const filter = session.role === "admin" ? {} : { userId: session.id };
    const status = sp.get("status");
    if (status && status !== "All") filter.orderStatus = status;
    const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(300).lean();
    return ok({ orders });
  },
  { role: "user" }
);

export const POST = handler(
  async (req, _ctx, session) => {
    const data = orderSchema.parse(await readJson(req));
    await connectDB();

    // Merge duplicate lines
    const wanted = new Map();
    for (const i of data.items) wanted.set(i.productId, (wanted.get(i.productId) || 0) + i.quantity);

    const ids = [...wanted.keys()];
    if (!ids.every((id) => mongoose.isValidObjectId(id))) return fail("Invalid product in cart", 400);

    const products = await Product.find({ _id: { $in: ids } }).lean();
    if (products.length !== ids.length) return fail("Some products in your cart no longer exist", 400);

    // Price + availability come from the database, never from the client
    let subtotal = 0;
    const items = [];
    for (const p of products) {
      const qty = wanted.get(String(p._id));
      if (!p.isAvailable) return fail(`${p.name} is currently unavailable`, 409);
      if (p.stock < qty) return fail(`Only ${p.stock} left of ${p.name}`, 409);
      subtotal += p.price * qty;
      items.push({ productId: p._id, name: p.name, image: p.image, price: p.price, quantity: qty });
    }

    // Coupon: validate, then atomically claim one use
    let discount = 0;
    let couponCode = "";
    let couponClaimed = false;
    if (data.couponCode) {
      const coupon = await Coupon.findOne({ code: data.couponCode }).lean();
      const result = evaluateCoupon(coupon, subtotal);
      if (!result.ok) return fail(result.error, 400);
      const claimed = await Coupon.findOneAndUpdate(
        {
          _id: coupon._id,
          isActive: true,
          $or: [{ usageLimit: 0 }, { $expr: { $lt: ["$usedCount", "$usageLimit"] } }],
        },
        { $inc: { usedCount: 1 } }
      );
      if (!claimed) return fail("This coupon has reached its usage limit", 400);
      couponClaimed = true;
      discount = result.discount;
      couponCode = coupon.code;
    }

    // Atomic stock deduction: only succeeds if enough stock remains at this instant.
    // If any line fails, everything already deducted is put back.
    const deducted = [];
    const rollback = async () => {
      for (const d of deducted) {
        await Product.updateOne({ _id: d.productId }, { $inc: { stock: d.quantity, soldCount: -d.quantity } });
      }
      if (couponClaimed) await Coupon.updateOne({ code: couponCode }, { $inc: { usedCount: -1 } });
    };

    for (const it of items) {
      const updated = await Product.findOneAndUpdate(
        { _id: it.productId, isAvailable: true, stock: { $gte: it.quantity } },
        { $inc: { stock: -it.quantity, soldCount: it.quantity } },
        { new: true }
      );
      if (!updated) {
        await rollback();
        return fail(`Sorry, ${it.name} just sold out or doesn't have enough stock`, 409);
      }
      deducted.push({ productId: it.productId, quantity: it.quantity, name: it.name, newStock: updated.stock });
    }

    let order;
    try {
      order = await Order.create({
        userId: session.id,
        customerName: data.customerName,
        phone: data.phone,
        items,
        subtotal,
        discount,
        totalAmount: subtotal - discount,
        couponCode,
        paymentMethod: data.paymentMethod,
        deliveryAddress: data.deliveryAddress,
      });
    } catch (err) {
      await rollback();
      throw err;
    }

    await InventoryLog.insertMany(
      deducted.map((d) => ({
        productId: d.productId,
        productName: d.name,
        changeType: "order",
        quantityChanged: -d.quantity,
        previousStock: d.newStock + d.quantity,
        newStock: d.newStock,
        reason: `Order #${order._id.toString().slice(-6).toUpperCase()}`,
      }))
    );

    // Save phone/address on the profile for next time
    await User.updateOne({ _id: session.id }, { phone: data.phone, address: data.deliveryAddress });

    return ok({ order }, 201);
  },
  { role: "user" }
);
