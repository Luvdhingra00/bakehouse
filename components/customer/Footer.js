import Link from "next/link";
import { Cake, Mail, MapPin, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-24 bg-cocoa-900 text-cream-100">
      <div className="container-x grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 font-display text-2xl font-bold text-white">
            <span className="rounded-full bg-blush-500/20 p-1.5 text-blush-200">
              <Cake className="h-5 w-5" />
            </span>
            BakeHouse
          </div>
          <p className="mt-4 max-w-sm text-sm text-cream-200/70">
            Small-batch cakes, pastries and breads, baked fresh every morning and delivered to your door.
          </p>
        </div>
        <div>
          <h4 className="mb-3 font-sans text-sm font-semibold uppercase tracking-wide text-blush-200">Explore</h4>
          <ul className="space-y-2 text-sm text-cream-200/80">
            <li><Link href="/shop" className="hover:text-white">Shop all</Link></li>
            <li><Link href="/about" className="hover:text-white">About us</Link></li>
            <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
            <li><Link href="/orders" className="hover:text-white">My orders</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-sans text-sm font-semibold uppercase tracking-wide text-blush-200">Visit us</h4>
          <ul className="space-y-2 text-sm text-cream-200/80">
            <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" /> 21 Baker Street, Punjab, India</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> +91 9877983038</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> bakery@bakehouse.com</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-cream-200/60">
        © {new Date().getFullYear()} BakeHouse. All rights reserved.
      </div>
    </footer>
  );
}
