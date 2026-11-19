"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Eye, Package, Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { StockBadge } from "@/components/ui/Badges";
import { EmptyState, ErrorState, PageLoader } from "@/components/ui/States";
import { TableWrap } from "@/components/admin/ui";
import { api, formatINR, FALLBACK_IMG } from "@/lib/utils";
import { CATEGORIES } from "@/lib/validators";

const schema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  description: z.string().trim().max(1000).optional(),
  price: z.coerce.number({ invalid_type_error: "Enter a price" }).min(0, "Price must be 0 or more"),
  category: z.enum(CATEGORIES),
  image: z.string().trim().optional(),
  stock: z.coerce.number({ invalid_type_error: "Enter stock" }).int("Whole numbers only").min(0, "Stock cannot be negative"),
  minimumStock: z.coerce.number().int().min(0),
  expiryDate: z.string().optional(),
  isAvailable: z.boolean(),
});

const EMPTY = { name: "", description: "", price: "", category: "Cakes", image: "", stock: 0, minimumStock: 5, expiryDate: "", isAvailable: true };

function ProductForm({ product, onSaved, onClose }) {
  const [uploading, setUploading] = useState(false);
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: product
      ? { ...EMPTY, ...product, expiryDate: product.expiryDate ? product.expiryDate.slice(0, 10) : "" }
      : EMPTY,
  });
  const image = watch("image");

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setValue("image", data.url, { shouldDirty: true });
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const onSubmit = async (form) => {
    try {
      const body = { ...form, expiryDate: form.expiryDate || null };
      const { product: saved } = await api(product ? `/api/products/${product._id}` : "/api/products", {
        method: product ? "PUT" : "POST",
        body,
      });
      toast.success(product ? "Product updated" : "Product added");
      onSaved(saved);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const err = (k) => errors[k] && <p className="field-error">{errors[k].message}</p>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Name</label>
        <input className="input" {...register("name")} />
        {err("name")}
      </div>
      <div>
        <label className="label">Description</label>
        <textarea rows={3} className="input" {...register("description")} />
        {err("description")}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Price (₹)</label>
          <input type="number" step="0.01" className="input" {...register("price")} />
          {err("price")}
        </div>
        <div>
          <label className="label">Category</label>
          <select className="input" {...register("category")}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Stock quantity</label>
          <input type="number" className="input" {...register("stock")} />
          {err("stock")}
        </div>
        <div>
          <label className="label">Minimum stock alert</label>
          <input type="number" className="input" {...register("minimumStock")} />
          {err("minimumStock")}
        </div>
        <div>
          <label className="label">Expiry date</label>
          <input type="date" className="input" {...register("expiryDate")} />
        </div>
        <label className="flex items-center gap-3 self-end rounded-2xl border border-cream-200 bg-cream-50 px-4 py-2.5 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-blush-500" {...register("isAvailable")} />
          Available for sale
        </label>
      </div>

      <div>
        <label className="label">Image</label>
        <div className="flex items-center gap-3">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-cream-100">
            <Image src={image || FALLBACK_IMG} alt="Preview" fill sizes="64px" className="object-cover" />
          </div>
          <input className="input" placeholder="Paste image URL" {...register("image")} />
          <label className="btn-outline btn-sm shrink-0 cursor-pointer">
            <Upload className="h-4 w-4" /> {uploading ? "..." : "Upload"}
            <input type="file" accept="image/*" className="hidden" onChange={upload} disabled={uploading} />
          </label>
        </div>
        <p className="mt-1 text-xs text-cocoa-400">Upload needs Cloudinary keys in .env.local; otherwise paste an image URL.</p>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
        <button className="btn-primary" disabled={isSubmitting || uploading}>{isSubmitting ? "Saving..." : product ? "Save changes" : "Add product"}</button>
      </div>
    </form>
  );
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("newest");
  const [editing, setEditing] = useState(null); // null | "new" | product
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const qs = new URLSearchParams({ all: "1", sort, category, q });
      const { products } = await api(`/api/products?${qs}`);
      setProducts(products);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [q, category, sort]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const remove = async () => {
    setBusy(true);
    try {
      await api(`/api/products/${deleting._id}`, { method: "DELETE" });
      toast.success("Product deleted");
      setDeleting(null);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative sm:max-w-xs sm:flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cocoa-300" />
            <input className="input !pl-11" placeholder="Search products..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className="input sm:!w-44" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option>All</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select className="input sm:!w-44" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="name">Name A–Z</option>
            <option value="price-asc">Price ↑</option>
            <option value="price-desc">Price ↓</option>
            <option value="stock-asc">Stock ↑</option>
            <option value="popular">Best selling</option>
          </select>
        </div>
        <button className="btn-primary" onClick={() => setEditing("new")}><Plus className="h-4 w-4" /> Add product</button>
      </div>

      {loading ? <PageLoader /> : error ? <ErrorState message={error} onRetry={load} /> : products.length === 0 ? (
        <EmptyState icon={Package} title="No products found" text="Add your first product or adjust the filters." action={<button className="btn-primary" onClick={() => setEditing("new")}>Add product</button>} />
      ) : (
        <TableWrap>
          <thead className="bg-cream-50">
            <tr><th className="th">Product</th><th className="th">Category</th><th className="th">Price</th><th className="th">Stock</th><th className="th">Status</th><th className="th text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-cream-200">
            {products.map((p) => (
              <tr key={p._id} className="hover:bg-cream-50">
                <td className="td">
                  <div className="flex items-center gap-3">
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-cream-100">
                      <Image src={p.image || FALLBACK_IMG} alt={p.name} fill sizes="44px" className="object-cover" />
                    </div>
                    <span className="font-medium text-cocoa-900">{p.name}</span>
                  </div>
                </td>
                <td className="td">{p.category}</td>
                <td className="td font-semibold">{formatINR(p.price)}</td>
                <td className="td">{p.stock}</td>
                <td className="td"><StockBadge product={p} /></td>
                <td className="td">
                  <div className="flex justify-end gap-1">
                    <Link href={`/shop/${p._id}`} target="_blank" className="rounded-full p-2 text-cocoa-400 hover:bg-cream-200" aria-label="View"><Eye className="h-4 w-4" /></Link>
                    <button className="rounded-full p-2 text-cocoa-400 hover:bg-cream-200" onClick={() => setEditing(p)} aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                    <button className="rounded-full p-2 text-cocoa-400 hover:bg-red-50 hover:text-red-600" onClick={() => setDeleting(p)} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === "new" ? "Add product" : "Edit product"} wide>
        {editing && (
          <ProductForm
            product={editing === "new" ? null : editing}
            onClose={() => setEditing(null)}
            onSaved={() => { setEditing(null); load(); }}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        busy={busy}
        title="Delete product?"
        message={`“${deleting?.name}” will be permanently removed. Past orders keep their own copy of the item details.`}
      />
    </div>
  );
}
