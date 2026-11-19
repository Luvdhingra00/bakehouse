"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Tag, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { useCart } from "@/hooks/useCart";
import { EmptyState } from "@/components/ui/States";
import { api, formatINR, FALLBACK_IMG, COUPON_KEY } from "@/lib/utils";

export default function CartPage() {
  const { items, ready, setQty, remove, subtotal } = useCart();
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState(null); // { code, discount }
  const [busy, setBusy] = useState(false);

  // Restore a previously applied coupon, then re-validate it against the current cart
  useEffect(() => {
    if (!ready || items.length === 0) return;
    const saved = sessionStorage.getItem(COUPON_KEY);
    if (!saved) return;
    revalidate(saved, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Cart changed while a coupon is applied -> recompute the discount on the server
  useEffect(() => {
    if (!applied) return;
    if (items.length === 0) return clearCoupon();
    revalidate(applied.code, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  const payload = () => items.map((i) => ({ productId: i.productId, quantity: i.quantity }));

  async function revalidate(c, silent) {
    try {
      const res = await api("/api/coupons/validate", { method: "POST", body: { code: c, items: payload() } });
      setApplied({ code: res.code, discount: res.discount });
      sessionStorage.setItem(COUPON_KEY, res.code);
    } catch (e) {
      clearCoupon();
      if (!silent) toast.error(e.message);
      else toast.error(`Coupon removed: ${e.message}`);
    }
  }

  function clearCoupon() {
    setApplied(null);
    sessionStorage.removeItem(COUPON_KEY);
  }

  const apply = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    try {
      const res = await api("/api/coupons/validate", { method: "POST", body: { code, items: payload() } });
      setApplied({ code: res.code, discount: res.discount });
      sessionStorage.setItem(COUPON_KEY, res.code);
      toast.success(`${res.code} applied — you save ${formatINR(res.discount)}`);
      setCode("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!ready) return null;

  if (items.length === 0)
    return (
      <div className="container-x py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          text="Looks like you haven't added any treats yet."
          action={<Link href="/shop" className="btn-primary">Browse the shop</Link>}
        />
      </div>
    );

  const discount = applied?.discount || 0;
  const total = Math.max(0, subtotal - discount);

  return (
    <div className="container-x py-10">
      <h1 className="mb-8 text-4xl md:text-5xl">Your cart</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {items.map((i) => (
            <div key={i.productId} className="card flex gap-4 p-4">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-cream-100">
                <Image src={i.image || FALLBACK_IMG} alt={i.name} fill sizes="96px" className="object-cover" />
              </div>
              <div className="flex flex-1 flex-col justify-between">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/shop/${i.productId}`} className="font-display text-lg text-cocoa-900 hover:text-blush-500">{i.name}</Link>
                  <button onClick={() => remove(i.productId)} className="rounded-full p-1.5 text-cocoa-300 hover:bg-red-50 hover:text-red-600" aria-label="Remove">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center rounded-full border border-cream-200">
                    <button className="p-2 hover:text-blush-500 disabled:opacity-40" onClick={() => setQty(i.productId, i.quantity - 1)} disabled={i.quantity <= 1} aria-label="Decrease"><Minus className="h-3.5 w-3.5" /></button>
                    <span className="w-8 text-center text-sm font-semibold">{i.quantity}</span>
                    <button className="p-2 hover:text-blush-500 disabled:opacity-40" onClick={() => setQty(i.productId, i.quantity + 1)} disabled={i.quantity >= i.stock} aria-label="Increase"><Plus className="h-3.5 w-3.5" /></button>
                  </div>
                  <span className="font-bold text-cocoa-900">{formatINR(i.price * i.quantity)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="card h-fit space-y-5 p-6 lg:sticky lg:top-24">
          <h2 className="text-2xl">Order summary</h2>

          {applied ? (
            <div className="flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <span className="flex items-center gap-2 font-semibold"><Tag className="h-4 w-4" /> {applied.code} applied</span>
              <button onClick={clearCoupon} aria-label="Remove coupon"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <form onSubmit={apply} className="flex gap-2">
              <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Coupon code" className="input !rounded-full" />
              <button className="btn-outline shrink-0" disabled={busy || !code.trim()}>{busy ? "..." : "Apply"}</button>
            </form>
          )}

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatINR(subtotal)}</dd></div>
            {discount > 0 && <div className="flex justify-between text-emerald-700"><dt>Discount</dt><dd>− {formatINR(discount)}</dd></div>}
            <div className="flex justify-between"><dt>Delivery</dt><dd>Free</dd></div>
            <div className="flex justify-between border-t border-cream-200 pt-3 text-lg font-bold text-cocoa-900"><dt>Total</dt><dd>{formatINR(total)}</dd></div>
          </dl>

          <Link href="/checkout" className="btn-primary w-full">Proceed to checkout</Link>
          <Link href="/shop" className="btn-ghost w-full">Continue shopping</Link>
        </aside>
      </div>
    </div>
  );
}
