// Run with: npm run seed
// Creates the admin account, a demo customer, products, and sample coupons.
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js";

const img = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;
const inDays = (n) => new Date(Date.now() + n * 86400000);

const products = [
  { name: "Classic Chocolate Truffle Cake", category: "Cakes", price: 899, stock: 12, minimumStock: 4, image: img("photo-1578985545062-69928b1d9587"), description: "Rich layers of dark chocolate sponge with silky truffle ganache.", rating: 4.9, soldCount: 140 },
  { name: "Red Velvet Cake", category: "Cakes", price: 949, stock: 8, minimumStock: 4, image: img("photo-1586788680434-30d324b2d46f"), description: "Velvety crimson sponge with cream cheese frosting.", rating: 4.8, soldCount: 98 },
  { name: "Butter Croissant", category: "Pastries", price: 95, stock: 40, minimumStock: 10, image: img("photo-1555507036-ab1f4038808a"), description: "Flaky, golden and baked fresh every morning.", rating: 4.7, soldCount: 210 },
  { name: "Strawberry Tart", category: "Pastries", price: 160, stock: 18, minimumStock: 6, image: img("photo-1488477181946-6428a0291777"), description: "Crisp tart shell, vanilla custard and fresh strawberries.", rating: 4.6, soldCount: 64 },
  { name: "Vanilla Bean Cupcake", category: "Cupcakes", price: 85, stock: 30, minimumStock: 10, image: img("photo-1426869884541-df7117556757"), description: "Soft vanilla sponge topped with buttercream swirl.", rating: 4.5, soldCount: 120 },
  { name: "Pink Velvet Cupcake", category: "Cupcakes", price: 99, stock: 4, minimumStock: 8, image: img("photo-1614707267537-b85aaf00c4b7"), description: "Pastel pink sponge with sweet vanilla frosting.", rating: 4.7, soldCount: 87 },
  { name: "Choco Chip Cookies (6 pc)", category: "Cookies", price: 220, stock: 25, minimumStock: 8, image: img("photo-1499636136210-6f4ee915583e"), description: "Chewy centres, crisp edges, loaded with chocolate chunks.", rating: 4.8, soldCount: 180 },
  { name: "Oatmeal Raisin Cookies (6 pc)", category: "Cookies", price: 200, stock: 0, minimumStock: 8, image: img("photo-1558961363-fa8fdf82db35"), description: "Wholesome oats, juicy raisins and a hint of cinnamon.", rating: 4.3, soldCount: 52 },
  { name: "Sourdough Loaf", category: "Breads", price: 180, stock: 14, minimumStock: 5, image: img("photo-1509440159596-0249088772ff"), description: "Slow-fermented, crusty outside and tangy inside.", rating: 4.7, soldCount: 76 },
  { name: "Garlic Butter Bread", category: "Breads", price: 120, stock: 22, minimumStock: 6, image: img("photo-1549931319-a545dcf3bc73"), description: "Warm, buttery and packed with roasted garlic.", rating: 4.4, soldCount: 70 },
  { name: "Glazed Donut", category: "Donuts", price: 70, stock: 35, minimumStock: 10, image: img("photo-1551024601-bec78aea704b"), description: "Light, fluffy and finished with a sweet sugar glaze.", rating: 4.5, soldCount: 160 },
  { name: "Chocolate Sprinkle Donut", category: "Donuts", price: 85, stock: 28, minimumStock: 10, image: img("photo-1527515545081-5db817172677"), description: "Chocolate icing with rainbow sprinkles.", rating: 4.6, soldCount: 130 },
  { name: "Fudgy Walnut Brownie", category: "Brownies", price: 110, stock: 32, minimumStock: 10, image: img("photo-1606313564200-e75d5e30476c"), description: "Dense, gooey and rich with toasted walnuts.", rating: 4.9, soldCount: 205 },
  { name: "Salted Caramel Brownie", category: "Brownies", price: 125, stock: 6, minimumStock: 8, image: img("photo-1564355808539-22fda35bed7e"), description: "Fudgy brownie swirled with salted caramel.", rating: 4.8, soldCount: 91 },
].map((p, i) => ({ ...p, expiryDate: inDays(2 + (i % 5)), isAvailable: true }));

const coupons = [
  { code: "BAKE10", discountType: "percentage", discountValue: 10, minimumOrderAmount: 200, maximumDiscount: 150, usageLimit: 0, expiryDate: inDays(90) },
  { code: "SWEET20", discountType: "percentage", discountValue: 20, minimumOrderAmount: 500, maximumDiscount: 300, usageLimit: 100, expiryDate: inDays(60) },
  { code: "FIRST50", discountType: "fixed", discountValue: 50, minimumOrderAmount: 150, maximumDiscount: 0, usageLimit: 0, expiryDate: inDays(180) },
];

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI missing — create .env.local from .env.example");
  await mongoose.connect(process.env.MONGODB_URI);

  const adminEmail = (process.env.ADMIN_EMAIL || "admin@bakehouse.com").toLowerCase();
  const adminPass = process.env.ADMIN_PASSWORD || "Admin@12345";
  const hashed = await bcrypt.hash(adminPass, 12);

  await User.findOneAndUpdate(
    { email: adminEmail },
    { name: "BakeHouse Admin", email: adminEmail, password: hashed, role: "admin" },
    { upsert: true, new: true }
  );
  console.log(`Admin ready: ${adminEmail}`);

  const demoEmail = "customer@bakehouse.com";
  await User.findOneAndUpdate(
    { email: demoEmail },
    { name: "Demo Customer", email: demoEmail, password: await bcrypt.hash("Customer@123", 12), role: "customer", phone: "9876543210", address: "12 Rose Lane, Model Town, Ludhiana, Punjab" },
    { upsert: true }
  );
  console.log(`Demo customer: ${demoEmail} / Customer@123`);

  if ((await Product.countDocuments()) === 0) {
    await Product.insertMany(products);
    console.log(`Inserted ${products.length} products`);
  } else console.log("Products already exist, skipping");

  for (const c of coupons) await Coupon.findOneAndUpdate({ code: c.code }, c, { upsert: true });
  console.log("Coupons ready: BAKE10, SWEET20, FIRST50");

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
