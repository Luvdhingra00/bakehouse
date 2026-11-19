import { stockStatus } from "@/lib/utils";

const ORDER_TONES = {
  Pending: "badge-amber",
  Confirmed: "badge-blue",
  Preparing: "badge-pink",
  "Out for Delivery": "badge-blue",
  Delivered: "badge-green",
  Cancelled: "badge-red",
};

// Full class names so Tailwind doesn't purge them
const STOCK_TONES = { green: "badge-green", amber: "badge-amber", red: "badge-red", gray: "badge-gray" };
const PAY_TONES = { Paid: "badge-green", Pending: "badge-amber", Failed: "badge-red", Refunded: "badge-gray" };

export function OrderBadge({ status }) {
  return <span className={ORDER_TONES[status] || "badge-gray"}>{status}</span>;
}

export function StockBadge({ product }) {
  const s = stockStatus(product);
  return <span className={STOCK_TONES[s.tone]}>{s.label}</span>;
}

export function PaymentBadge({ status }) {
  return <span className={PAY_TONES[status] || "badge-gray"}>{status}</span>;
}
