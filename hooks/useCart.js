"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

const CartContext = createContext(null);
const KEY = "bakehouse_cart_v1";

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "[]");
      if (Array.isArray(saved)) setItems(saved);
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items, ready]);

  const add = (product, qty = 1) => {
    if (product.stock <= 0) return toast.error("Sorry, this item is out of stock");
    const existing = items.find((i) => i.productId === product._id);
    const nextQty = Math.min((existing?.quantity || 0) + qty, product.stock);
    if (existing && nextQty === existing.quantity) {
      return toast.error(`Only ${product.stock} available`);
    }

    if (existing) {
      setItems(items.map((i) => (i.productId === product._id ? { ...i, quantity: nextQty, stock: product.stock } : i)));
    } else {
      setItems([
        ...items,
        { productId: product._id, name: product.name, price: product.price, image: product.image, stock: product.stock, quantity: nextQty },
      ]);
    }
    toast.success(`${product.name} added to cart`);
  };

  const setQty = (productId, quantity) =>
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock || 50)) } : i))
    );
  const remove = (productId) => setItems((prev) => prev.filter((i) => i.productId !== productId));
  const clear = () => setItems([]);

  const { count, subtotal } = useMemo(
    () => ({
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotal: items.reduce((n, i) => n + i.price * i.quantity, 0),
    }),
    [items]
  );

  return (
    <CartContext.Provider value={{ items, ready, add, setQty, remove, clear, count, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
