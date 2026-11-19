import mongoose from "mongoose";

const InventoryLogSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    productName: { type: String, default: "" },
    changeType: { type: String, enum: ["add", "remove", "set", "order", "cancel"], required: true },
    quantityChanged: { type: Number, required: true },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    reason: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.models.InventoryLog || mongoose.model("InventoryLog", InventoryLogSchema);
