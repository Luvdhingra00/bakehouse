"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Cake, LogOut, Menu, ShoppingBag, User, X } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  const active = (href) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const onLogout = async () => {
    await logout();
    toast.success("Logged out");
    setOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-cream-200 bg-cream-50/85 backdrop-blur-lg">
      <div className="container-x flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-display text-2xl font-bold text-cocoa-900">
          <span className="rounded-full bg-blush-100 p-1.5 text-blush-500">
            <Cake className="h-5 w-5" />
          </span>
          BakeHouse
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition",
                active(l.href) ? "bg-blush-100 text-blush-500" : "hover:bg-cream-200"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/cart" className="btn-ghost relative !px-3" aria-label="Cart">
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-blush-500 px-1 text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <>
                {user.role === "admin" ? (
                  <Link href="/admin" className="btn-outline btn-sm">
                    Admin
                  </Link>
                ) : (
                  <Link href="/orders" className="btn-outline btn-sm">
                    My Orders
                  </Link>
                )}
                <button onClick={onLogout} className="btn-ghost btn-sm" aria-label="Log out">
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-ghost btn-sm">
                  Log in
                </Link>
                <Link href="/register" className="btn-primary btn-sm">
                  Sign up
                </Link>
              </>
            )}
          </div>

          <button className="btn-ghost !px-3 md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-cream-200 bg-cream-50 md:hidden">
          <div className="container-x flex flex-col gap-1 py-3">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-2xl px-4 py-2.5 text-sm font-medium hover:bg-cream-200">
                {l.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link href={user.role === "admin" ? "/admin" : "/orders"} onClick={() => setOpen(false)} className="rounded-2xl px-4 py-2.5 text-sm font-medium hover:bg-cream-200">
                  {user.role === "admin" ? "Admin dashboard" : "My orders"}
                </Link>
                <button onClick={onLogout} className="rounded-2xl px-4 py-2.5 text-left text-sm font-medium hover:bg-cream-200">
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className="rounded-2xl px-4 py-2.5 text-sm font-medium hover:bg-cream-200">
                  Log in
                </Link>
                <Link href="/register" onClick={() => setOpen(false)} className="btn-primary mt-1">
                  <User className="h-4 w-4" /> Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
