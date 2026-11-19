import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { handler, ok, fail, readJson } from "@/lib/api";
import { registerSchema } from "@/lib/validators";
import { signToken, setAuthCookie } from "@/lib/auth";
import { NextResponse } from "next/server";

export const POST = handler(async (req) => {
  const data = registerSchema.parse(await readJson(req));
  await connectDB();

  if (await User.findOne({ email: data.email })) return fail("An account with this email already exists", 409);

  // Role is ALWAYS "customer" here — admins are created with the seed script.
  const user = await User.create({
    name: data.name,
    email: data.email,
    phone: data.phone,
    password: await bcrypt.hash(data.password, 12),
    role: "customer",
  });

  const token = await signToken({ id: user._id.toString(), role: user.role, name: user.name, email: user.email });
  const res = NextResponse.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } }, { status: 201 });
  return setAuthCookie(res, token);
});
