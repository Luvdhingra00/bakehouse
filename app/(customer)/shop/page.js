"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Cookie, Search } from "lucide-react";
import ProductCard from "@/components/customer/ProductCard";
import { EmptyState, ErrorState, Spinner } from "@/components/ui/States";
import { api, cn } from "@/lib/utils";
import { CATEGORIES } from "@/lib/validators";

function ShopInner() {
  const router = useRouter();
  const params = useSearchParams();
  const category = params.get("category") || "All";
  const sort = params.get("sort") || "newest";
  const urlQ = params.get("q") || "";

  const [q, setQ] = useState(urlQ);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const setParam = useCallback(
    (key, value) => {
      const next = new URLSearchParams(params.toString());
      if (!value || value === "All" || (key === "sort" && value === "newest")) next.delete(key);
      else next.set(key, value);
      router.replace(`/shop${next.toString() ? `?${next}` : ""}`, { scroll: false });
    },
    [params, router]
  );

  // Debounce search typing into the URL
  useEffect(() => {
    if (q === urlQ) return;
    const t = setTimeout(() => setParam("q", q.trim()), 350);
    return () => clearTimeout(t);
  }, [q, urlQ, setParam]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams({ category, sort, q: urlQ });
      const { products } = await api(`/api/products?${qs}`);
      setProducts(products);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [category, sort, urlQ]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="container-x py-10">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl">Our bakery</h1>
        <p className="mt-2 text-cocoa-400">Fresh from the oven — pick your favourites.</p>
      </div>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cocoa-300" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search cakes, cookies..." className="input !rounded-full !pl-11" />
        </div>
        <select value={sort} onChange={(e) => setParam("sort", e.target.value)} className="input !w-auto !rounded-full">
          <option value="newest">Newest</option>
          <option value="popular">Most popular</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>
      </div>

      <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
        {["All", ...CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => setParam("category", c)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition",
              category === c ? "border-cocoa-700 bg-cocoa-700 text-cream-50" : "border-cream-200 bg-white hover:border-cocoa-300"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : products.length === 0 ? (
        <EmptyState
          icon={Cookie}
          title="No bakes found"
          text="Try a different search or category."
          action={<button className="btn-outline" onClick={() => { setQ(""); router.replace("/shop"); }}>Clear filters</button>}
        />
      ) : (
        <>
          <p className="mb-4 text-sm text-cocoa-400">{products.length} item{products.length !== 1 && "s"}</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </>
      )}
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>}>
      <ShopInner />
    </Suspense>
  );
}
