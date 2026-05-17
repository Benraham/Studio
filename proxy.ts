import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "studio_auth";
const SESSION_DAYS = 30;

function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const secret = process.env.AUTH_SECRET;
  if (!secret) return false;
  const [issued, sig] = token.split(".");
  if (!issued || !sig) return false;
  const expectedSig = createHmac("sha256", secret).update(issued).digest("hex");
  if (sig.length !== expectedSig.length) return false;
  try {
    const ok = timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig));
    if (!ok) return false;
    const issuedMs = parseInt(issued, 36);
    if (!Number.isFinite(issuedMs)) return false;
    const ageDays = (Date.now() - issuedMs) / (1000 * 60 * 60 * 24);
    return ageDays < SESSION_DAYS;
  } catch {
    return false;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow login page, login API, and YouTube OAuth callback
  // (Google has to be able to hit the callback without our cookie.)
  const isPublicRoute =
    pathname === "/login" ||
    pathname === "/api/auth/login" ||
    pathname === "/api/youtube/auth/callback";

  if (isPublicRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!verifyToken(token)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
