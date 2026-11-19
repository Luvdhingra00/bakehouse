import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { handler, fail, readJson } from "@/lib/api";
import { loginSchema } from "@/lib/validators";
import { signToken, setAuthCookie } from "@/lib/auth";

export const POST = handler(async (req) => {
  const { email, password } = loginSchema.parse(await readJson(req));
  await connectDB();

  const user = await User.findOne({ email }).select("+password");
  // Same message for unknown email and wrong password
  if (!user || !(await bcrypt.compare(password, user.password))) return fail("Invalid email or password", 401);

  const token = await signToken({ id: user._id.toString(), role: user.role, name: user.name, email: user.email });
  const res = NextResponse.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  return setAuthCookie(res, token);
});
