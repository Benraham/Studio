import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { buildAuthUrl } from "@/lib/youtube";

export const runtime = "nodejs";

export async function GET() {
  const state = randomBytes(16).toString("hex");
  const store = await cookies();
  store.set({
    name: "yt_oauth_state",
    value: state,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  const url = buildAuthUrl(state);
  return NextResponse.redirect(url);
}
