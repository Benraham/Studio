import { NextResponse } from "next/server";
import { deleteShortFormIdea, getShortFormIdea, saveShortFormIdea } from "@/lib/kv";
import type { ShortFormStatus } from "@/lib/types";

export const runtime = "nodejs";

interface PatchBody {
  status?: ShortFormStatus;
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const idea = await getShortFormIdea(id);
  if (!idea) return NextResponse.json({ error: "not found" }, { status: 404 });
  const body = (await req.json()) as PatchBody;
  if (body.status) idea.status = body.status;
  await saveShortFormIdea(idea);
  return NextResponse.json({ idea });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  await deleteShortFormIdea(id);
  return NextResponse.json({ ok: true });
}
