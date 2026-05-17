import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "studio_auth";
const SESSION_DAYS = 30;

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set");
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export function makeToken(): string {
  const issued = Date.now().toString(36);
  const sig = sign(issued);
  return `${issued}.${sig}`;
}

export function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const [issued, sig] = token.split(".");
  if (!issued || !sig) return false;
  const expectedSig = sign(issued);
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

export function checkPassword(submitted: string): boolean {
  const expected = process.env.APP_PASSWORD;
  if (!expected) return false;
  const a = Buffer.from(submitted);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function setAuthCookie(): Promise<void> {
  const store = await cookies();
  store.set({
    name: COOKIE_NAME,
    value: makeToken(),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearAuthCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function isAuthed(): Promise<boolean> {
  const store = await cookies();
  return verifyToken(store.get(COOKIE_NAME)?.value);
}

export const AUTH_COOKIE = COOKIE_NAME;
