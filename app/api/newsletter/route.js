import { z } from "zod";
import { connectDB } from "@/lib/db";
import Subscriber from "@/models/Subscriber";
import { handler, ok, readJson } from "@/lib/api";

export const POST = handler(async (req) => {
  const { email } = z.object({ email: z.string().trim().toLowerCase().email("Enter a valid email") }).parse(await readJson(req));
  await connectDB();
  await Subscriber.updateOne({ email }, { email }, { upsert: true });
  return ok({ success: true });
});
