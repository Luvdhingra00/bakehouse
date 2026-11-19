"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Minus, Plus, ShoppingBag, Star } from "lucide-react";
import ProductCard from "@/components/customer/ProductCard";
import { ErrorState, PageLoader } from "@/components/ui/States";
import { StockBadge } from "@/components/ui/Badges";
import { useCart } from "@/hooks/useCart";
import { api, formatINR, formatDate, FALLBACK_IMG } from "@/lib/utils";

export default function ProductDetailPage({ params }) {
  const { add } = useCart();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setProduct(null);
    setError("");
    setQty(1);
    api(`/api/products/${params.id}`)
      .then(async ({ product }) => {
        if (!alive) return;
        setProduct(product);
        const { products } = await api(`/api/products?category=${product.category}&limit=5`);
        if (alive) setRelated(products.filter((p) => p._id !== product._id).slice(0, 4));
      })
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [params.id]);

  if (error) return <div className="container-x py-16"><ErrorState message={error} /></div>;
  if (!product) return <PageLoader />;

  const soldOut = product.stock <= 0 || !product.isAvailable;

  return (
    <div className="container-x py-10">
      <Link href="/shop" className="mb-6 inline-flex items-center gap-2 text-sm text-cocoa-400 hover:text-cocoa-900">
        <ArrowLeft className="h-4 w-4" /> Back to shop
      </Link>

      <div className="grid gap-10 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-[2rem] bg-cream-100 shadow-soft">
          <Image src={product.image || FALLBACK_IMG} alt={product.name} fill priority sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
        </div>

        <div className="flex flex-col justify-center">
          <span className="badge-pink w-fit">{product.category}</span>
          <h1 className="mt-3 text-4xl md:text-5xl">{product.name}</h1>
          <div className="mt-3 flex items-center gap-3 text-sm text-cocoa-500">
            <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {product.rating?.toFixed(1)}</span>
            <StockBadge product={product} />
          </div>
          <p className="mt-5 text-cocoa-500">{product.description || "Freshly baked in small batches."}</p>
          <p className="mt-6 text-4xl font-bold text-cocoa-900">{formatINR(product.price)}</p>
          {product.expiryDate && <p className="mt-2 text-xs text-cocoa-400">Best before {formatDate(product.expiryDate)}</p>}

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div className="flex items-center rounded-full border border-cream-200 bg-white">
              <button className="p-3 hover:text-blush-500 disabled:opacity-40" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={soldOut} aria-label="Decrease"><Minus className="h-4 w-4" /></button>
              <span className="w-10 text-center font-semibold">{qty}</span>
              <button className="p-3 hover:text-blush-500 disabled:opacity-40" onClick={() => setQty((q) => Math.min(product.stock, q + 1))} disabled={soldOut} aria-label="Increase"><Plus className="h-4 w-4" /></button>
            </div>
            <button className="btn-primary flex-1 sm:flex-none" disabled={soldOut} onClick={() => add(product, qty)}>
              <ShoppingBag className="h-4 w-4" /> {soldOut ? "Sold out" : "Add to cart"}
            </button>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-6 text-3xl">You might also like</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
