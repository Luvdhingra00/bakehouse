import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getSession } from "@/lib/auth";

export const ok = (data, status = 200) => NextResponse.json(data, { status });
export const fail = (message, status = 400, extra = {}) =>
  NextResponse.json({ error: message, ...extra }, { status });

// Wrap a handler with auth + error handling.
// role: undefined = public, "user" = any logged in user, "admin" = admin only
export function handler(fn, { role } = {}) {
  return async (req, ctx) => {
    try {
      let session = null;
      if (role) {
        session = await getSession();
        if (!session) return fail("Please log in to continue", 401);
        if (role === "admin" && session.role !== "admin") return fail("Forbidden", 403);
      }
      return await fn(req, ctx, session);
    } catch (err) {
      if (err instanceof ZodError) {
        return fail(err.issues[0]?.message || "Invalid input", 400, {
          issues: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
        });
      }
      if (err?.code === 11000) return fail("A record with that value already exists", 409);
      if (err?.name === "CastError") return fail("Invalid id", 400);
      console.error(err);
      return fail("Something went wrong on the server", 500);
    }
  };
}

export async function readJson(req) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}
