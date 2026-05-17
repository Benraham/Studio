import { NextResponse } from "next/server";
import { checkPassword, setAuthCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { password?: string };
  try {
    body = (await req.json()) as { password?: string };
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const password = body.password ?? "";
  if (!checkPassword(password)) {
    return NextResponse.json({ error: "incorrect password" }, { status: 401 });
  }
  await setAuthCookie();
  return NextResponse.json({ ok: true });
}
