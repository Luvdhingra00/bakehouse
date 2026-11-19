"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Users } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { OrderBadge } from "@/components/ui/Badges";
import { EmptyState, ErrorState, PageLoader, Spinner } from "@/components/ui/States";
import { TableWrap } from "@/components/admin/ui";
import { api, formatDate, formatDateTime, formatINR } from "@/lib/utils";

function History({ customer }) {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/orders")
      .then(({ orders }) => setOrders(orders.filter((o) => String(o.userId) === String(customer.id))))
      .catch((e) => setError(e.message));
  }, [customer.id]);

  return (
    <div className="space-y-4 text-sm">
      <div className="rounded-2xl bg-cream-50 p-4">
        <p className="font-semibold text-cocoa-900">{customer.name}</p>
        <p className="text-cocoa-500">{customer.email}{customer.phone ? ` · ${customer.phone}` : ""}</p>
        {customer.address && <p className="text-cocoa-500">{customer.address}</p>}
      </div>
      {error ? <p className="text-red-600">{error}</p> : !orders ? <div className="flex justify-center py-6"><Spinner /></div> : orders.length === 0 ? (
        <p className="py-6 text-center text-cocoa-400">No orders yet.</p>
      ) : (
        <ul className="divide-y divide-cream-200 rounded-2xl border border-cream-200">
          {orders.map((o) => (
            <li key={o._id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="font-medium">#{o._id.slice(-6).toUpperCase()} · {formatINR(o.totalAmount)}</p>
                <p className="text-xs text-cocoa-400">{formatDateTime(o.createdAt)} · {o.items.length} item{o.items.length !== 1 && "s"}</p>
              </div>
              <OrderBadge status={o.orderStatus} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const { customers } = await api("/api/admin/customers");
      setCustomers(customers);
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

  const term = q.trim().toLowerCase();
  const shown = customers.filter((c) => !term || [c.name, c.email, c.phone].some((v) => v?.toLowerCase().includes(term)));

  return (
    <div className="space-y-5">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cocoa-300" />
        <input className="input !pl-11" placeholder="Search customers..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {shown.length === 0 ? (
        <EmptyState icon={Users} title="No customers found" text="Registered customers will appear here." />
      ) : (
        <TableWrap>
          <thead className="bg-cream-50">
            <tr><th className="th">Customer</th><th className="th">Contact</th><th className="th">Joined</th><th className="th">Orders</th><th className="th">Total spent</th><th className="th text-right">History</th></tr>
          </thead>
          <tbody className="divide-y divide-cream-200">
            {shown.map((c) => (
              <tr key={c.id} className="hover:bg-cream-50">
                <td className="td font-medium text-cocoa-900">{c.name}</td>
                <td className="td">{c.email}<div className="text-xs text-cocoa-400">{c.phone || "—"}</div></td>
                <td className="td">{formatDate(c.joined)}</td>
                <td className="td">{c.totalOrders}</td>
                <td className="td font-semibold">{formatINR(c.totalSpent)}</td>
                <td className="td text-right"><button className="btn-outline btn-sm" onClick={() => setView(c)}>View orders</button></td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}

      <Modal open={!!view} onClose={() => setView(null)} title="Customer orders" wide>
        {view && <History customer={view} />}
      </Modal>
    </div>
  );
}
