"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, Clock, IndianRupee, Package, ShoppingCart, Users } from "lucide-react";
import { Panel, StatCard } from "@/components/admin/ui";
import { OrderBadge } from "@/components/ui/Badges";
import { ErrorState, PageLoader } from "@/components/ui/States";
import { api, formatDateTime, formatINR } from "@/lib/utils";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = () => {
    setError("");
    api("/api/admin/stats").then(setData).catch((e) => setError(e.message));
  };
  useEffect(load, []);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <PageLoader />;

  const { stats, sales, recentOrders, topProducts, lowStock, activity } = data;
  const chart = sales.map((s) => ({ ...s, day: new Date(s.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={Package} label="Total products" value={stats.totalProducts} tone="brown" />
        <StatCard icon={ShoppingCart} label="Total orders" value={stats.totalOrders} tone="blue" />
        <StatCard icon={IndianRupee} label="Total revenue" value={formatINR(stats.totalRevenue)} tone="green" hint="Excludes cancelled orders" />
        <StatCard icon={Clock} label="Pending orders" value={stats.pendingOrders} tone="amber" />
        <StatCard icon={AlertTriangle} label="Low stock products" value={stats.lowStockCount} tone="red" />
        <StatCard icon={Users} label="Total customers" value={stats.totalCustomers} tone="pink" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Sales overview" className="xl:col-span-2" action={<span className="text-xs text-cocoa-400">Last 14 days</span>}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e56b8a" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#e56b8a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4ead9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#9a6f52" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#9a6f52" }} tickLine={false} axisLine={false} width={55} tickFormatter={(v) => `₹${v}`} />
                <Tooltip formatter={(v, n) => (n === "revenue" ? formatINR(v) : v)} contentStyle={{ borderRadius: 16, border: "1px solid #f4ead9" }} />
                <Area type="monotone" dataKey="revenue" stroke="#e56b8a" strokeWidth={2.5} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Low-stock alerts" action={<Link href="/admin/inventory" className="text-xs font-semibold text-blush-500 hover:underline">Manage</Link>}>
          {lowStock.length === 0 ? (
            <p className="py-8 text-center text-sm text-cocoa-400">All products are well stocked 🎉</p>
          ) : (
            <ul className="space-y-3">
              {lowStock.map((p) => (
                <li key={p._id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-medium text-cocoa-900">{p.name}</span>
                  <span className={p.stock <= 0 ? "badge-red" : "badge-amber"}>{p.stock <= 0 ? "Out of stock" : `${p.stock} left`}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Recent orders" className="xl:col-span-2" action={<Link href="/admin/orders" className="text-xs font-semibold text-blush-500 hover:underline">View all</Link>}>
          {recentOrders.length === 0 ? (
            <p className="py-8 text-center text-sm text-cocoa-400">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead><tr><th className="th">Order</th><th className="th">Customer</th><th className="th">Total</th><th className="th">Status</th></tr></thead>
                <tbody className="divide-y divide-cream-200">
                  {recentOrders.map((o) => (
                    <tr key={o._id}>
                      <td className="td font-medium">#{o._id.slice(-6).toUpperCase()}<div className="text-xs font-normal text-cocoa-400">{formatDateTime(o.createdAt)}</div></td>
                      <td className="td">{o.customerName}</td>
                      <td className="td font-semibold">{formatINR(o.totalAmount)}</td>
                      <td className="td"><OrderBadge status={o.orderStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title="Top selling">
            {topProducts.length === 0 ? (
              <p className="py-4 text-center text-sm text-cocoa-400">No sales yet.</p>
            ) : (
              <ol className="space-y-3">
                {topProducts.map((p, i) => (
                  <li key={p._id} className="flex items-center gap-3 text-sm">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blush-100 text-xs font-bold text-blush-500">{i + 1}</span>
                    <span className="flex-1 truncate font-medium text-cocoa-900">{p.name}</span>
                    <span className="text-cocoa-400">{p.soldCount} sold</span>
                  </li>
                ))}
              </ol>
            )}
          </Panel>

          <Panel title="Recent activity">
            {activity.length === 0 ? (
              <p className="py-4 text-center text-sm text-cocoa-400">No activity yet.</p>
            ) : (
              <ul className="space-y-3">
                {activity.map((a) => (
                  <li key={a._id} className="text-sm">
                    <p className="text-cocoa-900">
                      <span className="font-medium">{a.productName || "Product"}</span>{" "}
                      <span className={a.quantityChanged < 0 ? "text-red-600" : "text-emerald-600"}>{a.quantityChanged > 0 ? "+" : ""}{a.quantityChanged}</span>
                    </p>
                    <p className="text-xs text-cocoa-400">{a.reason} · {formatDateTime(a.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
