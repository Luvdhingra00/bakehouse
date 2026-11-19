import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { handler, ok } from "@/lib/api";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const GET = handler(async () => {
  const session = await getSession();
  if (!session) return ok({ user: null });
  await connectDB();
  const user = await User.findById(session.id).lean();
  if (!user) return ok({ user: null });
  return ok({
    user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, address: user.address },
  });
});

export const PUT = handler(async (req, _ctx, session) => {
  const body = await req.json().catch(() => ({}));
  await connectDB();
  const user = await User.findByIdAndUpdate(
    session.id,
    {
      ...(body.name ? { name: String(body.name).trim().slice(0, 80) } : {}),
      phone: String(body.phone ?? "").slice(0, 20),
      address: String(body.address ?? "").slice(0, 300),
    },
    { new: true }
  ).lean();
  return ok({ user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, address: user.address } });
}, { role: "user" });
