import CopyCoupon from "@/components/customer/CopyCoupon";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, Leaf, Star, Truck } from "lucide-react";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import Coupon from "@/models/Coupon";
import ProductCard from "@/components/customer/ProductCard";
import NewsletterForm from "@/components/customer/NewsletterForm";
import { CATEGORIES } from "@/lib/validators";
import { formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";

const CATEGORY_IMAGES = {
  Cakes: "photo-1578985545062-69928b1d9587",
  Pastries: "photo-1555507036-ab1f4038808a",
  Cupcakes: "photo-1426869884541-df7117556757",
  Cookies: "photo-1499636136210-6f4ee915583e",
  Breads: "photo-1509440159596-0249088772ff",
  Donuts: "photo-1551024601-bec78aea704b",
  Brownies: "photo-1606313564200-e75d5e30476c",
};

const TESTIMONIALS = [
  { name: "Aarav S.", text: "The chocolate truffle cake was the star of my sister's birthday. Fresh, rich and delivered right on time.", rating: 5 },
  { name: "Simran K.", text: "Best croissants in town. Flaky, buttery and still warm when they arrived. Ordering again this weekend!", rating: 5 },
  { name: "Rohan M.", text: "Easy ordering, great coupons and the brownies are unreal. My office now orders every Friday.", rating: 4 },
];

const plain = (x) => JSON.parse(JSON.stringify(x));

export default async function HomePage() {
  await connectDB();
  const [featured, bestSellers, coupons] = await Promise.all([
    Product.find({ isAvailable: true }).sort({ rating: -1, createdAt: -1 }).limit(4).lean(),
    Product.find({ isAvailable: true }).sort({ soldCount: -1 }).limit(4).lean(),
    Coupon.find({ isActive: true, $or: [{ expiryDate: null }, { expiryDate: { $gt: new Date() } }] }).sort({ createdAt: -1 }).limit(3).lean(),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blush-50 via-cream-50 to-cream-100">
        <div className="container-x grid items-center gap-10 py-14 md:grid-cols-2 md:py-24">
          <div className="fade-up">
            <span className="badge-pink">Baked fresh every morning</span>
            <h1 className="mt-5 text-5xl font-bold leading-[1.05] md:text-6xl">
              Sweet moments, <span className="text-blush-500">baked with love.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-cocoa-500">
              Handcrafted cakes, pastries, cookies and breads from our oven to your door. Order online in minutes.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="btn-primary">
                Shop now <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/about" className="btn-outline">Our story</Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-6 text-sm text-cocoa-500">
              <span className="flex items-center gap-2"><Truck className="h-4 w-4 text-blush-500" /> Doorstep delivery</span>
              <span className="flex items-center gap-2"><Leaf className="h-4 w-4 text-blush-500" /> Fresh ingredients</span>
              <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-blush-500" /> Baked daily</span>
            </div>
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-md">
            <div className="absolute inset-4 rounded-[3rem] bg-blush-200/60 blur-2xl" />
            <div className="relative h-full w-full overflow-hidden rounded-[3rem] shadow-lift">
              <Image
                src="https://images.unsplash.com/photo-1587536848939-c7e58de4b792?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D"
                alt="Chocolate cake"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container-x mt-20">
        <SectionHead title="Shop by category" sub="Something for every craving" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          {CATEGORIES.map((c) => (
            <Link key={c} href={`/shop?category=${c}`} className="group text-center">
              <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-full border-4 border-white shadow-soft transition group-hover:shadow-lift">
                <Image
                  src={`https://images.unsplash.com/${CATEGORY_IMAGES[c]}?auto=format&fit=crop&w=300&q=80`}
                  alt={c}
                  fill
                  sizes="160px"
                  className="object-cover transition duration-500 group-hover:scale-110"
                />
              </div>
              <p className="mt-3 font-medium group-hover:text-blush-500">{c}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="container-x mt-24">
        <SectionHead title="Featured bakes" sub="Hand-picked favourites" href="/shop" />
        <Grid products={plain(featured)} />
      </section>

      {/* Offers */}
      {coupons.length > 0 && (
        <section className="container-x mt-24">
          <SectionHead title="Special offers" sub="Apply at checkout" />
          <div className="grid gap-4 md:grid-cols-3">
            {coupons.map((c) => (
              <div key={c._id} className="card relative overflow-hidden bg-gradient-to-br from-blush-100 to-cream-100 p-6">
                <p className="text-sm font-semibold uppercase tracking-wide text-blush-500">
                  {c.discountType === "percentage" ? `${c.discountValue}% off` : `${formatINR(c.discountValue)} off`}
                </p>
                <p className="mt-2 font-display text-3xl font-bold text-cocoa-900">{c.code}</p>
                <p className="mt-2 text-sm text-cocoa-500">
                  {c.minimumOrderAmount > 0 ? `On orders above ${formatINR(c.minimumOrderAmount)}` : "On any order"}
                </p>
                <CopyCoupon code={c.code} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Best sellers */}
      <section className="container-x mt-24">
        <SectionHead title="Best sellers" sub="What everyone is ordering" href="/shop?sort=popular" />
        <Grid products={plain(bestSellers)} />
      </section>

      {/* Testimonials */}
      <section className="container-x mt-24">
        <SectionHead title="Loved by our customers" sub="Kind words from happy tables" />
        <div className="grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="card p-6">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < t.rating ? "fill-amber-400 text-amber-400" : "text-cream-200"}`} />
                ))}
              </div>
              <blockquote className="mt-3 text-cocoa-500">“{t.text}”</blockquote>
              <figcaption className="mt-4 font-semibold text-cocoa-900">{t.name}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="container-x mt-24">
        <div className="rounded-[2.5rem] bg-blush-100 px-6 py-14 text-center">
          <h2 className="text-3xl md:text-4xl">Get fresh offers in your inbox</h2>
          <p className="mt-2 text-cocoa-500">New bakes, seasonal specials and member-only discounts.</p>
          <NewsletterForm />
        </div>
      </section>
    </>
  );
}

function SectionHead({ title, sub, href }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-3xl md:text-4xl">{title}</h2>
        <p className="mt-1 text-cocoa-400">{sub}</p>
      </div>
      {href && (
        <Link href={href} className="hidden items-center gap-1 text-sm font-semibold text-blush-500 hover:underline sm:flex">
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

function Grid({ products }) {
  if (!products.length) return <p className="text-cocoa-400">No products yet. Run the seed script to add some.</p>;
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p._id} product={p} />
      ))}
    </div>
  );
}
