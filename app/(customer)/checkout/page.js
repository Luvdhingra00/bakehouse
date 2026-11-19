"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Banknote, ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { EmptyState } from "@/components/ui/States";
import { api, formatINR, COUPON_KEY } from "@/lib/utils";

const schema = z.object({
  customerName: z.string().trim().min(2, "Name is required"),
  phone: z.string().trim().regex(/^[0-9+\-\s]{7,15}$/, "Enter a valid phone number"),
  deliveryAddress: z.string().trim().min(10, "Please enter a full delivery address"),
});

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, ready, subtotal, clear } = useCart();
  const [coupon, setCoupon] = useState(null);
  const [placing, setPlacing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { customerName: "", phone: "", deliveryAddress: "" } });

  // Prefill from the profile
  useEffect(() => {
    if (user) reset({ customerName: user.name || "", phone: user.phone || "", deliveryAddress: user.address || "" });
  }, [user, reset]);

  // Ask the server for the real discount for the applied coupon
  useEffect(() => {
    if (!ready || items.length === 0) return;
    const code = sessionStorage.getItem(COUPON_KEY);
    if (!code) return setCoupon(null);
    api("/api/coupons/validate", { method: "POST", body: { code, items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })) } })
      .then((r) => setCoupon({ code: r.code, discount: r.discount }))
      .catch(() => {
        sessionStorage.removeItem(COUPON_KEY);
        setCoupon(null);
      });
  }, [ready, items]);

  const onSubmit = async (form) => {
    setPlacing(true);
    try {
      const { order } = await api("/api/orders", {
        method: "POST",
        body: {
          ...form,
          couponCode: coupon?.code || "",
          paymentMethod: "COD",
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        },
      });
      clear();
      sessionStorage.removeItem(COUPON_KEY);
      toast.success("Order placed! 🎉");
      router.push(`/orders?placed=${order._id}`);
    } catch (e) {
      toast.error(e.message);
      setPlacing(false);
    }
  };

  if (!ready) return null;
  if (items.length === 0)
    return (
      <div className="container-x py-16">
        <EmptyState icon={ShoppingBag} title="Nothing to check out" text="Add some bakes to your cart first." action={<Link href="/shop" className="btn-primary">Go to shop</Link>} />
      </div>
    );

  const discount = coupon?.discount || 0;
  const total = Math.max(0, subtotal - discount);

  return (
    <div className="container-x py-10">
      <h1 className="mb-8 text-4xl md:text-5xl">Checkout</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="card space-y-4 p-6">
            <h2 className="text-2xl">Delivery details</h2>
            <div>
              <label className="label" htmlFor="customerName">Full name</label>
              <input id="customerName" className="input" {...register("customerName")} />
              {errors.customerName && <p className="field-error">{errors.customerName.message}</p>}
            </div>
            <div>
              <label className="label" htmlFor="phone">Phone number</label>
              <input id="phone" type="tel" className="input" placeholder="98765 43210" {...register("phone")} />
              {errors.phone && <p className="field-error">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="label" htmlFor="deliveryAddress">Delivery address</label>
              <textarea id="deliveryAddress" rows={3} className="input" placeholder="House no, street, area, city, PIN" {...register("deliveryAddress")} />
              {errors.deliveryAddress && <p className="field-error">{errors.deliveryAddress.message}</p>}
            </div>
          </section>

          <section className="card p-6">
            <h2 className="mb-4 text-2xl">Payment method</h2>
            <label className="flex items-center gap-3 rounded-2xl border-2 border-blush-400 bg-blush-50 p-4">
              <input type="radio" checked readOnly className="accent-blush-500" />
              <Banknote className="h-5 w-5 text-blush-500" />
              <div>
                <p className="font-semibold text-cocoa-900">Cash on Delivery</p>
                <p className="text-xs text-cocoa-400">Pay when your order arrives. Online payments coming soon.</p>
              </div>
            </label>
          </section>
        </div>

        <aside className="card h-fit space-y-4 p-6 lg:sticky lg:top-24">
          <h2 className="text-2xl">Order summary</h2>
          <ul className="max-h-64 space-y-2 overflow-y-auto text-sm">
            {items.map((i) => (
              <li key={i.productId} className="flex justify-between gap-3">
                <span>{i.name} <span className="text-cocoa-400">× {i.quantity}</span></span>
                <span className="shrink-0">{formatINR(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 border-t border-cream-200 pt-4 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatINR(subtotal)}</dd></div>
            {coupon && <div className="flex justify-between text-emerald-700"><dt>Coupon ({coupon.code})</dt><dd>− {formatINR(discount)}</dd></div>}
            <div className="flex justify-between"><dt>Delivery</dt><dd>Free</dd></div>
            <div className="flex justify-between border-t border-cream-200 pt-3 text-lg font-bold text-cocoa-900"><dt>Total</dt><dd>{formatINR(total)}</dd></div>
          </dl>
          <button className="btn-primary w-full" disabled={placing}>{placing ? "Placing order..." : `Place order · ${formatINR(total)}`}</button>
          <Link href="/cart" className="btn-ghost w-full">Back to cart</Link>
        </aside>
      </form>
    </div>
  );
}
