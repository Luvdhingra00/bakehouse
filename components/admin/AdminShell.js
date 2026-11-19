"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  BarChart3, Boxes, Cake, ExternalLink, LayoutDashboard, LogOut, Menu, Package, Settings, ShoppingCart, Tag, Users, X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminShell({ admin, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);

  const isActive = (href) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  const current = NAV.find((n) => isActive(n.href))?.label || "Admin";

  const onLogout = async () => {
    await logout();
    toast.success("Logged out");
    router.push("/login");
    router.refresh();
  };

  const sidebar = (
    <div className="flex h-full flex-col bg-cocoa-900 text-cream-100">
      <Link href="/admin" className="flex items-center gap-2 px-6 py-6 font-display text-2xl font-bold text-white">
        <span className="rounded-full bg-blush-500/20 p-1.5 text-blush-200"><Cake className="h-5 w-5" /></span>
        BakeHouse
      </Link>
      <nav className="flex-1 space-y-1 px-3">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium transition",
              isActive(href) ? "bg-blush-500 text-white shadow-soft" : "text-cream-200/80 hover:bg-white/10 hover:text-white"
            )}
          >
            <Icon className="h-4 w-4" /> {label}
          </Link>
        ))}
      </nav>
      <div className="space-y-1 border-t border-white/10 p-3">
        <Link href="/" className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm text-cream-200/80 hover:bg-white/10 hover:text-white">
          <ExternalLink className="h-4 w-4" /> View store
        </Link>
        <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-sm text-cream-200/80 hover:bg-white/10 hover:text-white">
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream-100">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-cocoa-900/50" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-64">{sidebar}</aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-cream-200 bg-cream-50/90 px-4 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <button className="btn-ghost !px-2.5 lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <h1 className="font-display text-2xl">{current}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-cocoa-900">{admin.name}</p>
              <p className="text-xs text-cocoa-400">Administrator</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blush-100 font-bold text-blush-500">
              {admin.name?.[0]?.toUpperCase() || "A"}
            </div>
          </div>
        </header>
        <main className="p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
