import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCode } from "@/lib/youtube";
import { setYtTokens } from "@/lib/kv";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const store = await cookies();
  const storedState = store.get("yt_oauth_state")?.value;
  store.delete("yt_oauth_state");

  const baseRedirect = (path: string) => {
    const u = new URL(path, url.origin);
    return NextResponse.redirect(u);
  };

  if (error) {
    return baseRedirect(`/settings?yt_error=${encodeURIComponent(error)}`);
  }
  if (!code || !state || state !== storedState) {
    return baseRedirect("/settings?yt_error=bad_state");
  }
  try {
    const tokens = await exchangeCode(code);
    await setYtTokens(tokens);
    return baseRedirect("/settings?yt_connected=1");
  } catch (e) {
    console.error("OAuth callback failed", e);
    const msg = e instanceof Error ? e.message : "exchange_failed";
    return baseRedirect(`/settings?yt_error=${encodeURIComponent(msg)}`);
  }
}
