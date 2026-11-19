"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Star } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { formatINR, FALLBACK_IMG } from "@/lib/utils";

export default function ProductCard({ product }) {
  const { add } = useCart();
  const soldOut = product.stock <= 0 || !product.isAvailable;
  const low = !soldOut && product.stock <= product.minimumStock;

  return (
    <div className="card-hover group flex flex-col overflow-hidden">
      <Link href={`/shop/${product._id}`} className="relative block aspect-[4/3] overflow-hidden bg-cream-100">
        <Image
          src={product.image || FALLBACK_IMG}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="badge-pink absolute left-3 top-3 bg-white/90 backdrop-blur">{product.category}</span>
        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-cocoa-900/50">
            <span className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-cocoa-900">Sold out</span>
          </div>
        )}
        {low && <span className="badge-amber absolute right-3 top-3">Only {product.stock} left</span>}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/shop/${product._id}`} className="font-display text-lg leading-snug text-cocoa-900 hover:text-blush-500">
            {product.name}
          </Link>
          <span className="flex shrink-0 items-center gap-1 text-sm text-cocoa-500">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            {product.rating?.toFixed(1)}
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-cocoa-400">{product.description}</p>

        <div className="mt-auto flex items-center justify-between pt-4">
          <span className="text-xl font-bold text-cocoa-900">{formatINR(product.price)}</span>
          <button className="btn-primary btn-sm" disabled={soldOut} onClick={() => add(product)}>
            <ShoppingBag className="h-4 w-4" />
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
