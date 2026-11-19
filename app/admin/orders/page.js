"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ShoppingCart } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { OrderBadge, PaymentBadge } from "@/components/ui/Badges";
import { EmptyState, ErrorState, PageLoader } from "@/components/ui/States";
import { TableWrap } from "@/components/admin/ui";
import { api, cn, formatDateTime, formatINR } from "@/lib/utils";
import { ORDER_STATUSES } from "@/lib/validators";

const NEXT = {
  Pending: ["Confirmed", "Cancelled"],
  Confirmed: ["Preparing", "Cancelled"],
  Preparing: ["Out for Delivery", "Cancelled"],
  "Out for Delivery": ["Delivered", "Cancelled"],
  Delivered: [],
  Cancelled: [],
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState(null);
  const [updating, setUpdating] = useState(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const { orders } = await api(`/api/orders?status=${encodeURIComponent(status)}`);
      setOrders(orders);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const patch = async (id, body) => {
    setUpdating(id);
    try {
      const { order } = await api(`/api/orders/${id}`, { method: "PATCH", body });
      setOrders((prev) => prev.map((o) => (o._id === id ? order : o)));
      setView((v) => (v && v._id === id ? order : v));
      toast.success("Order updated");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setUpdating(null);
    }
  };

  const StatusSelect = ({ o }) => {
    const options = NEXT[o.orderStatus];
    if (options.length === 0) return <span className="text-xs text-cocoa-300">Final</span>;
    return (
      <select
        className="input !w-auto !rounded-full !py-1.5 text-xs"
        value=""
        disabled={updating === o._id}
        onChange={(e) => e.target.value && patch(o._id, { orderStatus: e.target.value })}
      >
        <option value="">Update status…</option>
        {options.map((s) => <option key={s}>{s}</option>)}
      </select>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["All", ...ORDER_STATUSES].map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={cn("shrink-0 rounded-full border px-4 py-2 text-sm font-medium", status === s ? "border-cocoa-700 bg-cocoa-700 text-white" : "border-cream-200 bg-white")}>{s}</button>
        ))}
      </div>

      {loading ? <PageLoader /> : error ? <ErrorState message={error} onRetry={load} /> : orders.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="No orders" text="Orders matching this filter will appear here." />
      ) : (
        <TableWrap>
          <thead className="bg-cream-50">
            <tr><th className="th">Order</th><th className="th">Customer</th><th className="th">Items</th><th className="th">Total</th><th className="th">Payment</th><th className="th">Status</th><th className="th">Update</th></tr>
          </thead>
          <tbody className="divide-y divide-cream-200">
            {orders.map((o) => (
              <tr key={o._id} className="hover:bg-cream-50">
                <td className="td">
                  <button className="font-semibold text-blush-500 hover:underline" onClick={() => setView(o)}>#{o._id.slice(-6).toUpperCase()}</button>
                  <div className="text-xs text-cocoa-400">{formatDateTime(o.createdAt)}</div>
                </td>
                <td className="td">{o.customerName}<div className="text-xs text-cocoa-400">{o.phone}</div></td>
                <td className="td max-w-[220px] truncate text-cocoa-500">{o.items.map((i) => `${i.name} ×${i.quantity}`).join(", ")}</td>
                <td className="td font-semibold">{formatINR(o.totalAmount)}</td>
                <td className="td"><div className="text-xs text-cocoa-400">{o.paymentMethod}</div><PaymentBadge status={o.paymentStatus} /></td>
                <td className="td"><OrderBadge status={o.orderStatus} /></td>
                <td className="td"><StatusSelect o={o} /></td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}

      <Modal open={!!view} onClose={() => setView(null)} title={view ? `Order #${view._id.slice(-6).toUpperCase()}` : ""} wide>
        {view && (
          <div className="space-y-5 text-sm">
            <div className="flex flex-wrap items-center gap-3">
              <OrderBadge status={view.orderStatus} /><PaymentBadge status={view.paymentStatus} />
              <span className="text-cocoa-400">{formatDateTime(view.createdAt)}</span>
            </div>
            <div>
              <p className="font-semibold text-cocoa-900">{view.customerName} · {view.phone}</p>
              <p className="text-cocoa-500">{view.deliveryAddress}</p>
            </div>
            <ul className="divide-y divide-cream-200 rounded-2xl border border-cream-200">
              {view.items.map((i) => (
                <li key={i.productId} className="flex justify-between px-4 py-3"><span>{i.name} × {i.quantity}</span><span className="font-semibold">{formatINR(i.price * i.quantity)}</span></li>
              ))}
            </ul>
            <div className="space-y-1">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(view.subtotal)}</span></div>
              {view.discount > 0 && <div className="flex justify-between text-emerald-700"><span>Discount ({view.couponCode})</span><span>− {formatINR(view.discount)}</span></div>}
              <div className="flex justify-between text-base font-bold text-cocoa-900"><span>Total ({view.paymentMethod})</span><span>{formatINR(view.totalAmount)}</span></div>
            </div>
            <div className="flex flex-wrap items-center gap-3 border-t border-cream-200 pt-4">
              <StatusSelect o={view} />
              {view.orderStatus !== "Cancelled" && (
                <select className="input !w-auto !rounded-full !py-1.5 text-xs" value={view.paymentStatus} onChange={(e) => patch(view._id, { paymentStatus: e.target.value })}>
                  {["Pending", "Paid", "Failed", "Refunded"].map((s) => <option key={s}>{s}</option>)}
                </select>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
