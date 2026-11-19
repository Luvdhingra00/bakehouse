import { z } from "zod";

export const CATEGORIES = ["Cakes", "Pastries", "Cupcakes", "Cookies", "Breads", "Donuts", "Brownies"];
export const ORDER_STATUSES = ["Pending", "Confirmed", "Preparing", "Out for Delivery", "Delivered", "Cancelled"];

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
  phone: z.string().trim().max(20).optional().default(""),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const productSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  description: z.string().trim().max(1000).optional().default(""),
  price: z.coerce.number().min(0, "Price must be 0 or more"),
  category: z.enum(CATEGORIES),
  image: z.string().trim().max(500).optional().default(""),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative"),
  minimumStock: z.coerce.number().int().min(0).optional().default(5),
  expiryDate: z.preprocess((v) => (v ? v : null), z.coerce.date().nullable()).optional(),
  isAvailable: z.coerce.boolean().optional().default(true),
});

export const stockUpdateSchema = z.object({
  mode: z.enum(["add", "remove", "set"]),
  quantity: z.coerce.number().int().min(0, "Quantity cannot be negative"),
  reason: z.string().trim().max(200).optional().default("Manual adjustment"),
});

export const couponSchema = z
  .object({
    code: z.string().trim().toUpperCase().min(3, "Code is too short").max(30),
    discountType: z.enum(["percentage", "fixed"]),
    discountValue: z.coerce.number().positive("Discount must be greater than 0"),
    minimumOrderAmount: z.coerce.number().min(0).optional().default(0),
    maximumDiscount: z.coerce.number().min(0).optional().default(0),
    expiryDate: z.preprocess((v) => (v ? v : null), z.coerce.date().nullable()).optional(),
    usageLimit: z.coerce.number().int().min(0).optional().default(0),
    isActive: z.coerce.boolean().optional().default(true),
  })
  .refine((d) => d.discountType !== "percentage" || d.discountValue <= 100, {
    message: "Percentage discount cannot exceed 100",
    path: ["discountValue"],
  });

export const orderSchema = z.object({
  items: z
    .array(z.object({ productId: z.string().min(1), quantity: z.coerce.number().int().min(1).max(50) }))
    .min(1, "Your cart is empty"),
  couponCode: z.string().trim().toUpperCase().optional().default(""),
  customerName: z.string().trim().min(2, "Name is required").max(80),
  phone: z.string().trim().regex(/^[0-9+\-\s]{7,15}$/, "Enter a valid phone number"),
  deliveryAddress: z.string().trim().min(10, "Please enter a full delivery address").max(300),
  paymentMethod: z.enum(["COD"]).default("COD"),
});

export const orderStatusSchema = z.object({
  orderStatus: z.enum(ORDER_STATUSES).optional(),
  paymentStatus: z.enum(["Pending", "Paid", "Failed", "Refunded"]).optional(),
});
