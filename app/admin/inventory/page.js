"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { AlertTriangle, Boxes, CalendarClock, PackageX } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { StockBadge } from "@/components/ui/Badges";
import { ErrorState, PageLoader } from "@/components/ui/States";
import { Panel, StatCard, TableWrap } from "@/components/admin/ui";
import { api, cn, formatDate, formatDateTime } from "@/lib/utils";

const daysLeft = (d) => (d ? Math.ceil((new Date(d) - Date.now()) / 86400000) : null);

function StockModal({ product, onClose, onSaved }) {
  const [mode, setMode] = useState("add");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api(`/api/products/${product._id}/stock`, {
        method: "PATCH",
        body: { mode, quantity: Number(quantity), reason: reason || (mode === "add" ? "Restocked" : mode === "remove" ? "Stock removed (waste/damage)" : "Stock count correction") },
      });
      toast.success("Stock updated");
      onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-cocoa-500">Current stock: <span className="font-bold text-cocoa-900">{product.stock}</span></p>
      <div className="grid grid-cols-3 gap-2">
        {[["add", "Add"], ["remove", "Remove"], ["set", "Set to"]].map(([v, l]) => (
          <button key={v} type="button" onClick={() => setMode(v)} className={cn("rounded-2xl border px-3 py-2 text-sm font-medium", mode === v ? "border-cocoa-700 bg-cocoa-700 text-white" : "border-cream-200 bg-white")}>{l}</button>
        ))}
      </div>
      <div>
        <label className="label">Quantity</label>
        <input type="number" min="0" required className="input" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
      </div>
      <div>
        <label className="label">Reason (optional)</label>
        <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Morning bake" />
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
        <button className="btn-primary" disabled={busy || quantity === ""}>{busy ? "Saving..." : "Update stock"}</button>
      </div>
    </form>
  );
}

export default function AdminInventory() {
  const [products, setProducts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const [p, l] = await Promise.all([api("/api/products?all=1&sort=stock-asc&limit=200"), api("/api/admin/inventory-logs")]);
      setProducts(p.products);
      setLogs(l.logs);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const out = products.filter((p) => p.stock <= 0);
  const low = products.filter((p) => p.stock > 0 && p.stock <= p.minimumStock);
  const expiring = products.filter((p) => p.expiryDate && daysLeft(p.expiryDate) <= 2);
  const shown = filter === "out" ? out : filter === "low" ? low : filter === "expiring" ? expiring : products;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Boxes} label="Total products" value={products.length} tone="brown" />
        <StatCard icon={PackageX} label="Out of stock" value={out.length} tone="red" />
        <StatCard icon={AlertTriangle} label="Low stock" value={low.length} tone="amber" />
        <StatCard icon={CalendarClock} label="Expiring ≤ 2 days" value={expiring.length} tone="pink" />
      </div>

      {(out.length > 0 || low.length > 0) && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          <p className="mb-1 font-semibold">Stock alerts</p>
          {out.length > 0 && <p><b>Out of stock:</b> {out.map((p) => p.name).join(", ")}</p>}
          {low.length > 0 && <p><b>Running low:</b> {low.map((p) => `${p.name} (${p.stock})`).join(", ")}</p>}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {[["all", "All"], ["low", "Low stock"], ["out", "Out of stock"], ["expiring", "Expiring soon"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} className={cn("rounded-full border px-4 py-2 text-sm font-medium", filter === v ? "border-cocoa-700 bg-cocoa-700 text-white" : "border-cream-200 bg-white")}>{l}</button>
        ))}
      </div>

      <TableWrap>
        <thead className="bg-cream-50">
          <tr><th className="th">Product</th><th className="th">Stock</th><th className="th">Min. threshold</th><th className="th">Expiry</th><th className="th">Status</th><th className="th text-right">Action</th></tr>
        </thead>
        <tbody className="divide-y divide-cream-200">
          {shown.length === 0 && <tr><td colSpan={6} className="td py-10 text-center text-cocoa-400">Nothing in this view.</td></tr>}
          {shown.map((p) => {
            const d = daysLeft(p.expiryDate);
            return (
              <tr key={p._id} className="hover:bg-cream-50">
                <td className="td font-medium text-cocoa-900">{p.name}<div className="text-xs font-normal text-cocoa-400">{p.category}</div></td>
                <td className="td text-lg font-bold">{p.stock}</td>
                <td className="td">{p.minimumStock}</td>
                <td className="td">{formatDate(p.expiryDate)}{d !== null && d <= 2 && <span className={cn("ml-2", d < 0 ? "badge-red" : "badge-amber")}>{d < 0 ? "Expired" : `${d}d left`}</span>}</td>
                <td className="td"><StockBadge product={p} /></td>
                <td className="td text-right"><button className="btn-outline btn-sm" onClick={() => setEditing(p)}>Update stock</button></td>
              </tr>
            );
          })}
        </tbody>
      </TableWrap>

      <Panel title="Recent stock movements">
        {logs.length === 0 ? <p className="py-6 text-center text-sm text-cocoa-400">No movements yet.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead><tr><th className="th">When</th><th className="th">Product</th><th className="th">Type</th><th className="th">Change</th><th className="th">Stock</th><th className="th">Reason</th></tr></thead>
              <tbody className="divide-y divide-cream-200">
                {logs.map((l) => (
                  <tr key={l._id}>
                    <td className="td text-cocoa-400">{formatDateTime(l.createdAt)}</td>
                    <td className="td font-medium">{l.productName}</td>
                    <td className="td capitalize">{l.changeType}</td>
                    <td className={cn("td font-semibold", l.quantityChanged < 0 ? "text-red-600" : "text-emerald-600")}>{l.quantityChanged > 0 ? "+" : ""}{l.quantityChanged}</td>
                    <td className="td">{l.previousStock} → {l.newStock}</td>
                    <td className="td text-cocoa-500">{l.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing ? `Update stock — ${editing.name}` : ""}>
        {editing && <StockModal product={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
      </Modal>
    </div>
  );
}
