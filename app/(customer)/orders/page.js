"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Check, ChevronDown, Package } from "lucide-react";
import toast from "react-hot-toast";
import { EmptyState, ErrorState, PageLoader } from "@/components/ui/States";
import { OrderBadge, PaymentBadge } from "@/components/ui/Badges";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { api, cn, formatDateTime, formatINR, FALLBACK_IMG } from "@/lib/utils";

const STEPS = ["Pending", "Confirmed", "Preparing", "Out for Delivery", "Delivered"];

function Tracker({ status }) {
  if (status === "Cancelled") return <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">This order was cancelled.</p>;
  const current = STEPS.indexOf(status);
  return (
    <ol className="flex items-start">
      {STEPS.map((s, i) => (
        <li key={s} className="flex flex-1 flex-col items-center text-center">
          <div className="flex w-full items-center">
            <div className={cn("h-0.5 flex-1", i === 0 ? "opacity-0" : i <= current ? "bg-blush-500" : "bg-cream-200")} />
            <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold", i <= current ? "bg-blush-500 text-white" : "bg-cream-200 text-cocoa-300")}>
              {i < current ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <div className={cn("h-0.5 flex-1", i === STEPS.length - 1 ? "opacity-0" : i < current ? "bg-blush-500" : "bg-cream-200")} />
          </div>
          <span className={cn("mt-2 text-[11px] leading-tight sm:text-xs", i <= current ? "font-semibold text-cocoa-900" : "text-cocoa-300")}>{s}</span>
        </li>
      ))}
    </ol>
  );
}

function OrdersInner() {
  const placed = useSearchParams().get("placed");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(placed);
  const [cancelId, setCancelId] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { orders } = await api("/api/orders");
      setOrders(orders);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cancel = async () => {
    setCancelling(true);
    try {
      const { order } = await api(`/api/orders/${cancelId}`, { method: "PATCH", body: { orderStatus: "Cancelled" } });
      setOrders((prev) => prev.map((o) => (o._id === order._id ? order : o)));
      toast.success("Order cancelled");
      setCancelId(null);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (orders.length === 0)
    return <EmptyState icon={Package} title="No orders yet" text="When you place an order it will show up here." action={<Link href="/shop" className="btn-primary">Start shopping</Link>} />;

  return (
    <>
      {placed && (
        <div className="mb-6 rounded-3xl bg-emerald-50 p-5 text-emerald-800">
          <p className="font-semibold">Thank you — your order has been placed!</p>
          <p className="text-sm">We'll start baking as soon as it's confirmed. Pay cash on delivery.</p>
        </div>
      )}
      <div className="space-y-4">
        {orders.map((o) => {
          const open = openId === o._id;
          const canCancel = ["Pending", "Confirmed"].includes(o.orderStatus);
          return (
            <div key={o._id} className="card overflow-hidden">
              <button onClick={() => setOpenId(open ? null : o._id)} className="flex w-full items-center justify-between gap-4 p-5 text-left">
                <div>
                  <p className="font-display text-lg text-cocoa-900">Order #{o._id.slice(-6).toUpperCase()}</p>
                  <p className="text-xs text-cocoa-400">{formatDateTime(o.createdAt)} · {o.items.length} item{o.items.length !== 1 && "s"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <OrderBadge status={o.orderStatus} />
                  <span className="hidden font-bold text-cocoa-900 sm:block">{formatINR(o.totalAmount)}</span>
                  <ChevronDown className={cn("h-5 w-5 text-cocoa-300 transition", open && "rotate-180")} />
                </div>
              </button>

              {open && (
                <div className="space-y-6 border-t border-cream-200 p-5">
                  <Tracker status={o.orderStatus} />
                  <ul className="space-y-3">
                    {o.items.map((it) => (
                      <li key={it.productId} className="flex items-center gap-3">
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-cream-100">
                          <Image src={it.image || FALLBACK_IMG} alt={it.name} fill sizes="56px" className="object-cover" />
                        </div>
                        <div className="flex-1 text-sm">
                          <p className="font-medium text-cocoa-900">{it.name}</p>
                          <p className="text-cocoa-400">{formatINR(it.price)} × {it.quantity}</p>
                        </div>
                        <span className="text-sm font-semibold">{formatINR(it.price * it.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="grid gap-4 text-sm sm:grid-cols-2">
                    <div>
                      <p className="font-semibold text-cocoa-900">Delivery address</p>
                      <p className="text-cocoa-500">{o.customerName} · {o.phone}</p>
                      <p className="text-cocoa-500">{o.deliveryAddress}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(o.subtotal)}</span></div>
                      {o.discount > 0 && <div className="flex justify-between text-emerald-700"><span>Discount ({o.couponCode})</span><span>− {formatINR(o.discount)}</span></div>}
                      <div className="flex justify-between font-bold text-cocoa-900"><span>Total</span><span>{formatINR(o.totalAmount)}</span></div>
                      <div className="flex items-center justify-between pt-1"><span>Payment ({o.paymentMethod})</span><PaymentBadge status={o.paymentStatus} /></div>
                    </div>
                  </div>
                  {canCancel && (
                    <button className="btn-outline btn-sm !border-red-200 !text-red-600 hover:!bg-red-50" onClick={() => setCancelId(o._id)}>
                      Cancel order
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={!!cancelId}
        onClose={() => setCancelId(null)}
        onConfirm={cancel}
        busy={cancelling}
        title="Cancel this order?"
        message="The items will be returned to stock and any coupon will be released. This can't be undone."
        confirmLabel="Yes, cancel order"
      />
    </>
  );
}

export default function OrdersPage() {
  return (
    <div className="container-x py-10">
      <h1 className="mb-8 text-4xl md:text-5xl">My orders</h1>
      <Suspense fallback={<PageLoader />}>
        <OrdersInner />
      </Suspense>
    </div>
  );
}
