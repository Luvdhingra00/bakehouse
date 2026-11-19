"use client";

import { useCallback, useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { Boxes, IndianRupee, PackageX, AlertTriangle } from "lucide-react";
import { Panel, StatCard } from "@/components/admin/ui";
import { ErrorState, PageLoader } from "@/components/ui/States";
import { api, cn, formatDate, formatINR } from "@/lib/utils";

const STATUS_COLORS = {
  Pending: "#f59e0b",
  Confirmed: "#0ea5e9",
  Preparing: "#e56b8a",
  "Out for Delivery": "#7b523a",
  Delivered: "#10b981",
  Cancelled: "#ef4444",
};
const axis = { fontSize: 12, fill: "#9a6f52" };
const tip = { borderRadius: 16, border: "1px solid #f4ead9" };

export default function AdminAnalytics() {
  const [range, setRange] = useState("daily");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setError("");
    api(`/api/admin/analytics?range=${range}`).then(setData).catch((e) => setError(e.message));
  }, [range]);

  useEffect(load, [load]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <PageLoader />;

  const { series, statusCounts, bestSellers, inventory, expiring } = data;
  const totalRevenue = series.reduce((n, s) => n + s.revenue, 0);
  const totalOrders = series.reduce((n, s) => n + s.orders, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={IndianRupee} label={`Revenue (${range === "daily" ? "30 days" : "12 months"})`} value={formatINR(totalRevenue)} tone="green" />
        <StatCard icon={Boxes} label="Stock value" value={formatINR(inventory.stockValue)} hint={`${inventory.totalUnits} units on hand`} tone="brown" />
        <StatCard icon={AlertTriangle} label="Low stock" value={inventory.lowStock} tone="amber" />
        <StatCard icon={PackageX} label="Out of stock" value={inventory.outOfStock} tone="red" />
      </div>

      <Panel
        title="Revenue"
        action={
          <div className="flex rounded-full bg-cream-100 p-1">
            {["daily", "monthly"].map((r) => (
              <button key={r} onClick={() => setRange(r)} className={cn("rounded-full px-4 py-1.5 text-xs font-semibold capitalize", range === r ? "bg-white text-cocoa-900 shadow-soft" : "text-cocoa-400")}>{r}</button>
            ))}
          </div>
        }
      >
        {series.length === 0 ? <p className="py-16 text-center text-sm text-cocoa-400">No sales in this period yet.</p> : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4ead9" vertical={false} />
                <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} />
                <YAxis tick={axis} tickLine={false} axisLine={false} width={55} tickFormatter={(v) => `₹${v}`} />
                <Tooltip formatter={(v) => formatINR(v)} contentStyle={tip} />
                <Bar dataKey="revenue" name="Revenue" fill="#e56b8a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title={`Orders per ${range === "daily" ? "day" : "month"}`} action={<span className="text-xs text-cocoa-400">{totalOrders} total</span>}>
          {series.length === 0 ? <p className="py-16 text-center text-sm text-cocoa-400">No orders yet.</p> : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4ead9" vertical={false} />
                  <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={axis} tickLine={false} axisLine={false} width={35} />
                  <Tooltip contentStyle={tip} />
                  <Line type="monotone" dataKey="orders" name="Orders" stroke="#7b523a" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel title="Order statistics">
          {statusCounts.length === 0 ? <p className="py-16 text-center text-sm text-cocoa-400">No orders yet.</p> : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusCounts} dataKey="count" nameKey="status" innerRadius={55} outerRadius={90} paddingAngle={3}>
                    {statusCounts.map((s) => <Cell key={s.status} fill={STATUS_COLORS[s.status] || "#b99478"} />)}
                  </Pie>
                  <Tooltip contentStyle={tip} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Best-selling products">
          {bestSellers.length === 0 ? <p className="py-10 text-center text-sm text-cocoa-400">No sales yet.</p> : (
            <div style={{ height: Math.max(200, bestSellers.length * 40) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bestSellers} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4ead9" horizontal={false} />
                  <XAxis type="number" tick={axis} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={axis} tickLine={false} axisLine={false} width={150} />
                  <Tooltip contentStyle={tip} />
                  <Bar dataKey="soldCount" name="Units sold" fill="#e56b8a" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel title="Inventory report">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt>Units in stock</dt><dd className="font-semibold">{inventory.totalUnits}</dd></div>
            <div className="flex justify-between"><dt>Estimated stock value</dt><dd className="font-semibold">{formatINR(inventory.stockValue)}</dd></div>
            <div className="flex justify-between"><dt>Low stock products</dt><dd className="font-semibold">{inventory.lowStock}</dd></div>
            <div className="flex justify-between"><dt>Out of stock products</dt><dd className="font-semibold">{inventory.outOfStock}</dd></div>
          </dl>
          <h3 className="mb-2 mt-6 font-sans text-sm font-semibold text-cocoa-900">Expiring within 3 days</h3>
          {expiring.length === 0 ? <p className="text-sm text-cocoa-400">Nothing expiring soon.</p> : (
            <ul className="space-y-2 text-sm">
              {expiring.map((p) => (
                <li key={p._id} className="flex justify-between"><span>{p.name} <span className="text-cocoa-400">({p.stock} in stock)</span></span><span className="badge-amber">{formatDate(p.expiryDate)}</span></li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
