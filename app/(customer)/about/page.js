import Image from "next/image";
import Link from "next/link";
import { Heart, Leaf, Sparkles } from "lucide-react";

export const metadata = { title: "About — BakeHouse" };

export default function AboutPage() {
  return (
    <div className="container-x py-12">
      <div className="grid items-center gap-10 md:grid-cols-2">
        <div>
          <span className="badge-pink">Our story</span>
          <h1 className="mt-4 text-4xl md:text-5xl">Baking happiness since day one</h1>
          <p className="mt-5 text-cocoa-500">
            BakeHouse started in a tiny home kitchen with one oven and a lot of love. Today we bake small batches every
            morning using real butter, fresh eggs and honest ingredients — no shortcuts, no preservatives.
          </p>
          <p className="mt-4 text-cocoa-500">
            Whether it's a birthday cake, a box of warm cookies or a crusty loaf for dinner, every bake is made to order
            and delivered fresh to your door.
          </p>
          <Link href="/shop" className="btn-primary mt-8">Taste our bakes</Link>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] shadow-lift">
          <Image src="https://images.unsplash.com/photo-1517433670267-08bbd4be890f?auto=format&fit=crop&w=1000&q=80" alt="Baker at work" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
        </div>
      </div>

      <div className="mt-20 grid gap-5 md:grid-cols-3">
        {[
          { icon: Leaf, title: "Fresh ingredients", text: "Real butter, farm eggs and seasonal fruit in everything we make." },
          { icon: Heart, title: "Made with care", text: "Every order is baked by hand in small batches, never mass-produced." },
          { icon: Sparkles, title: "Delivered fresh", text: "Baked in the morning and at your door the same day." },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="card p-6">
            <div className="mb-4 inline-flex rounded-full bg-blush-100 p-3 text-blush-500"><Icon className="h-5 w-5" /></div>
            <h3 className="text-xl">{title}</h3>
            <p className="mt-2 text-sm text-cocoa-500">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
