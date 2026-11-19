import crypto from "crypto";
import { handler, ok, fail } from "@/lib/api";

// Optional Cloudinary upload. If the env vars are missing the UI falls back to pasting an image URL.
export const POST = handler(
  async (req) => {
    const cloud = process.env.CLOUDINARY_CLOUD_NAME;
    const key = process.env.CLOUDINARY_API_KEY;
    const secret = process.env.CLOUDINARY_API_SECRET;
    if (!cloud || !key || !secret) return fail("Image upload isn't configured. Paste an image URL instead.", 501);

    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") return fail("No file provided", 400);
    if (!file.type?.startsWith("image/")) return fail("Only image files are allowed", 400);
    if (file.size > 5 * 1024 * 1024) return fail("Image must be under 5 MB", 400);

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = "bakehouse";
    const signature = crypto.createHash("sha1").update(`folder=${folder}&timestamp=${timestamp}${secret}`).digest("hex");

    const body = new FormData();
    body.append("file", file);
    body.append("api_key", key);
    body.append("timestamp", String(timestamp));
    body.append("folder", folder);
    body.append("signature", signature);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: "POST", body });
    const data = await res.json();
    if (!res.ok) return fail(data?.error?.message || "Upload failed", 502);
    return ok({ url: data.secure_url });
  },
  { role: "admin" }
);
