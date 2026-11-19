# 🧁 BakeHouse — Bakery Inventory & Online Ordering System

A full-stack bakery platform: customers browse and order online, and the owner manages products, inventory, orders, coupons and analytics from a protected admin dashboard.

**Stack:** Next.js 14 (App Router) · React · JavaScript · Tailwind CSS · MongoDB + Mongoose · JWT auth (`jose` + httpOnly cookie) · React Hook Form + Zod · Recharts · Lucide icons · Cloudinary (optional)

## Features

**Customer site** — home page (hero, categories, featured, offers, best sellers, testimonials, newsletter), shop with search / category filter / price sorting, product details, cart with live coupon validation, checkout (Cash on Delivery), order history with status tracker, order cancellation, about and contact pages.

**Admin dashboard** (`/admin`) — stats overview and sales chart, product CRUD with image upload, inventory (low/out-of-stock alerts, thresholds, expiry dates, stock updates, movement log), order management with status workflow, coupon CRUD with activate/deactivate, customer list with order history and spend, analytics (daily/monthly revenue, best sellers, order stats, inventory report), settings.

## Requirements

- Node.js **20.6 or newer** (the seed script uses `--env-file`)
- MongoDB — local install or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

## Installation

```bash
cd bakehouse
npm install
cp .env.example .env.local     # Windows: copy .env.example .env.local
```

Edit `.env.local`:

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | Your MongoDB connection string |
| `JWT_SECRET` | Long random string (`openssl rand -base64 32`) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Credentials for the seeded admin account |
| `CLOUDINARY_*` | Optional — enables image uploads in the product form |

## Database setup

```bash
npm run seed
```

This creates:

- the **admin account** from `ADMIN_EMAIL` / `ADMIN_PASSWORD` (default `admin@bakehouse.com` / `Admin@12345`)
- a demo customer: `customer@bakehouse.com` / `Customer@123`
- 14 sample products across all 7 categories
- coupons `BAKE10` (10%, min ₹200, max ₹150), `SWEET20` (20%, min ₹500, max ₹300), `FIRST50` (₹50, min ₹150)

Re-running it is safe: it won't duplicate products, and it resets the admin password to the one in `.env.local`.

## Run

```bash
npm run dev
```

Open <http://localhost:3000>. Log in at `/login` with the admin account to reach `/admin`.

## Admin accounts

Public registration **always creates customers**. Admins are created only by the seed script. To add another admin, change `ADMIN_EMAIL` and run `npm run seed` again, or set `role: "admin"` on a user in MongoDB.

## How the important parts work

- **Auth & access control** — passwords are hashed with bcrypt; the JWT lives in an httpOnly cookie. `middleware.js` and `app/admin/layout.js` guard admin pages, and every admin API route re-checks the role server-side, so customers can't reach admin pages or APIs.
- **Stock safety** — stock is deducted at order placement with an atomic `findOneAndUpdate({ stock: { $gte: qty } }, { $inc: ... })`, so simultaneous orders can't oversell. If any line fails, everything already deducted is restored. Cancelling an order puts the stock and the coupon use back. Every change is written to `InventoryLog`.
- **Pricing & coupons** — prices and discounts are always recomputed on the server from database values; the client's numbers are never trusted. Coupon usage limits are claimed atomically.
- **Order workflow** — Pending → Confirmed → Preparing → Out for Delivery → Delivered; cancellation is possible until delivery. Customers can cancel their own Pending/Confirmed orders.

## Folder structure

```
app/
  (auth)/        login, register
  (customer)/    home, shop, cart, checkout, orders, about, contact
  admin/         dashboard, products, inventory, orders, coupons, customers, analytics, settings
  api/           auth, products, orders, coupons, admin, upload, newsletter, contact
components/      ui/ · customer/ · admin/
models/          User, Product, Order, Coupon, InventoryLog, Subscriber, Message
lib/             db, auth, api helpers, validators, coupon rules, utils
hooks/           useAuth, useCart
scripts/         seed.js
```

## Notes & next steps

- Product images use `next/image`; allowed hosts are `images.unsplash.com` and `res.cloudinary.com` (see `next.config.mjs`). Add other hosts there if you paste images from elsewhere.
- Only Cash on Delivery is implemented; the `paymentMethod` / `paymentStatus` fields are ready for Razorpay or Stripe.
- Ideas for extension: delivery fees and slots, email/SMS order notifications, product reviews, password reset, rate limiting on auth routes.
