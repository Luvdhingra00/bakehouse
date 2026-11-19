import { z } from "zod";
import { connectDB } from "@/lib/db";
import Message from "@/models/Message";
import { handler, ok, readJson } from "@/lib/api";

export const POST = handler(async (req) => {
  const data = z
    .object({
      name: z.string().trim().min(2, "Name is required").max(80),
      email: z.string().trim().email("Enter a valid email"),
      message: z.string().trim().min(10, "Message is too short").max(1000),
    })
    .parse(await readJson(req));
  await connectDB();
  await Message.create(data);
  return ok({ success: true }, 201);
});
