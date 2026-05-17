import { NextResponse } from "next/server";
import { disconnectYouTube } from "@/lib/youtube";

export const runtime = "nodejs";

export async function POST() {
  await disconnectYouTube();
  return NextResponse.json({ ok: true });
}
