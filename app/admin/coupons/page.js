"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Pencil, Plus, Tag, Trash2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { EmptyState, ErrorState, PageLoader } from "@/components/ui/States";
import { TableWrap } from "@/components/admin/ui";
import { api, cn, formatDate, formatINR } from "@/lib/utils";

const schema = z
  .object({
    code: z.string().trim().min(3, "Code must be at least 3 characters").max(30),
    discountType: z.enum(["percentage", "fixed"]),
    discountValue: z.coerce.number({ invalid_type_error: "Enter a value" }).positive("Must be greater than 0"),
    minimumOrderAmount: z.coerce.number().min(0),
    maximumDiscount: z.coerce.number().min(0),
    expiryDate: z.string().optional(),
    usageLimit: z.coerce.number().int().min(0),
    isActive: z.boolean(),
  })
  .refine((d) => d.discountType !== "percentage" || d.discountValue <= 100, { message: "Percentage can't exceed 100", path: ["discountValue"] });

const EMPTY = { code: "", discountType: "percentage", discountValue: "", minimumOrderAmount: 0, maximumDiscount: 0, expiryDate: "", usageLimit: 0, isActive: true };

function CouponForm({ coupon, onSaved, onClose }) {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: coupon ? { ...EMPTY, ...coupon, expiryDate: coupon.expiryDate ? coupon.expiryDate.slice(0, 10) : "" } : EMPTY,
  });
  const type = watch("discountType");
  const err = (k) => errors[k] && <p className="field-error">{errors[k].message}</p>;

  const onSubmit = async (form) => {
    try {
      await api(coupon ? `/api/coupons/${coupon._id}` : "/api/coupons", {
        method: coupon ? "PUT" : "POST",
        body: { ...form, code: form.code.toUpperCase(), expiryDate: form.expiryDate || null },
      });
      toast.success(coupon ? "Coupon updated" : "Coupon created");
      onSaved();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Coupon code</label>
          <input className="input uppercase" {...register("code")} />
          {err("code")}
        </div>
        <div>
          <label className="label">Discount type</label>
          <select className="input" {...register("discountType")}>
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed amount (₹)</option>
          </select>
        </div>
        <div>
          <label className="label">Discount value {type === "percentage" ? "(%)" : "(₹)"}</label>
          <input type="number" step="0.01" className="input" {...register("discountValue")} />
          {err("discountValue")}
        </div>
        <div>
          <label className="label">Minimum order (₹)</label>
          <input type="number" className="input" {...register("minimumOrderAmount")} />
          {err("minimumOrderAmount")}
        </div>
        <div>
          <label className="label">Max discount (₹, 0 = no cap)</label>
          <input type="number" className="input" {...register("maximumDiscount")} />
        </div>
        <div>
          <label className="label">Usage limit (0 = unlimited)</label>
          <input type="number" className="input" {...register("usageLimit")} />
        </div>
        <div>
          <label className="label">Expiry date</label>
          <input type="date" className="input" {...register("expiryDate")} />
        </div>
        <label className="flex items-center gap-3 self-end rounded-2xl border border-cream-200 bg-cream-50 px-4 py-2.5 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-blush-500" {...register("isActive")} /> Active
        </label>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
        <button className="btn-primary" disabled={isSubmitting}>{isSubmitting ? "Saving..." : coupon ? "Save changes" : "Create coupon"}</button>
      </div>
    </form>
  );
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const { coupons } = await api("/api/coupons");
      setCoupons(coupons);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (c) => {
    try {
      const { coupon } = await api(`/api/coupons/${c._id}`, { method: "PUT", body: { isActive: !c.isActive } });
      setCoupons((prev) => prev.map((x) => (x._id === c._id ? coupon : x)));
      toast.success(coupon.isActive ? "Coupon activated" : "Coupon deactivated");
    } catch (e) {
      toast.error(e.message);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api(`/api/coupons/${deleting._id}`, { method: "DELETE" });
      toast.success("Coupon deleted");
      setDeleting(null);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => setEditing("new")}><Plus className="h-4 w-4" /> New coupon</button>
      </div>

      {coupons.length === 0 ? (
        <EmptyState icon={Tag} title="No coupons yet" text="Create a discount code for your customers." action={<button className="btn-primary" onClick={() => setEditing("new")}>Create coupon</button>} />
      ) : (
        <TableWrap>
          <thead className="bg-cream-50">
            <tr><th className="th">Code</th><th className="th">Discount</th><th className="th">Min. order</th><th className="th">Usage</th><th className="th">Expires</th><th className="th">Active</th><th className="th text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-cream-200">
            {coupons.map((c) => {
              const expired = c.expiryDate && new Date(c.expiryDate) < new Date();
              return (
                <tr key={c._id} className="hover:bg-cream-50">
                  <td className="td font-mono font-bold text-cocoa-900">{c.code}</td>
                  <td className="td">
                    {c.discountType === "percentage" ? `${c.discountValue}%` : formatINR(c.discountValue)}
                    {c.maximumDiscount > 0 && <div className="text-xs text-cocoa-400">max {formatINR(c.maximumDiscount)}</div>}
                  </td>
                  <td className="td">{c.minimumOrderAmount ? formatINR(c.minimumOrderAmount) : "—"}</td>
                  <td className="td">{c.usedCount}{c.usageLimit > 0 ? ` / ${c.usageLimit}` : " / ∞"}</td>
                  <td className="td">{formatDate(c.expiryDate)}{expired && <span className="badge-red ml-2">Expired</span>}</td>
                  <td className="td">
                    <button
                      role="switch"
                      aria-checked={c.isActive}
                      onClick={() => toggle(c)}
                      className={cn("relative h-6 w-11 rounded-full transition", c.isActive ? "bg-emerald-500" : "bg-cocoa-300/50")}
                    >
                      <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", c.isActive ? "left-[22px]" : "left-0.5")} />
                    </button>
                  </td>
                  <td className="td">
                    <div className="flex justify-end gap-1">
                      <button className="rounded-full p-2 text-cocoa-400 hover:bg-cream-200" onClick={() => setEditing(c)} aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                      <button className="rounded-full p-2 text-cocoa-400 hover:bg-red-50 hover:text-red-600" onClick={() => setDeleting(c)} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === "new" ? "New coupon" : "Edit coupon"} wide>
        {editing && <CouponForm coupon={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
      </Modal>

      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={remove} busy={busy} title="Delete coupon?" message={`Coupon ${deleting?.code} will be permanently deleted. Existing orders are not affected.`} />
    </div>
  );
}
