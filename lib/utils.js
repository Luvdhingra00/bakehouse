export const formatINR = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

export const formatDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";

export const COUPON_KEY = "bakehouse_coupon_v1";

export const cn =(...c) => c.filter(Boolean).join(" ");

export function stockStatus(p) {
  if (!p.isAvailable) return { label: "Unavailable", tone: "gray" };
  if (p.stock <= 0) return { label: "Out of stock", tone: "red" };
  if (p.stock <= p.minimumStock) return { label: "Low stock", tone: "amber" };
  return { label: "In stock", tone: "green" };
}

export const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80";

// Client-side fetch helper that throws with the server's error message
export async function api(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
    body: options.body && typeof options.body !== "string" ? JSON.stringify(options.body) : options.body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}
