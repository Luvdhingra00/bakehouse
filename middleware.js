import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Edge-safe guard for page routes. API routes also re-check roles themselves.
export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("bakehouse_token")?.value;

  let session = null;
  if (token && process.env.JWT_SECRET) {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
      session = payload;
    } catch {}
  }

  const isAdminPage = pathname.startsWith("/admin");
  const needsLogin = pathname.startsWith("/checkout") || pathname.startsWith("/orders");

  if (isAdminPage) {
    if (!session) return NextResponse.redirect(new URL(`/login?next=${pathname}`, req.url));
    if (session.role !== "admin") return NextResponse.redirect(new URL("/", req.url));
  }
  if (needsLogin && !session) {
    return NextResponse.redirect(new URL(`/login?next=${pathname}`, req.url));
  }
  if ((pathname === "/login" || pathname === "/register") && session) {
    return NextResponse.redirect(new URL(session.role === "admin" ? "/admin" : "/", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/checkout/:path*", "/orders/:path*", "/login", "/register"],
};
