import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      required: true,
      enum: ["Cakes", "Pastries", "Cupcakes", "Cookies", "Breads", "Donuts", "Brownies"],
    },
    image: { type: String, default: "" },
    stock: { type: Number, required: true, min: 0, default: 0 },
    minimumStock: { type: Number, default: 5, min: 0 },
    expiryDate: { type: Date, default: null },
    isAvailable: { type: Boolean, default: true },
    rating: { type: Number, default: 4.5, min: 0, max: 5 },
    soldCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ProductSchema.index({ name: "text", description: "text" });
ProductSchema.index({ category: 1, price: 1 });

export default mongoose.models.Product || mongoose.model("Product", ProductSchema);
