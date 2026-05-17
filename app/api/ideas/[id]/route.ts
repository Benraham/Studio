import { NextResponse } from "next/server";
import { deleteIdea, getIdea, saveIdea } from "@/lib/kv";
import type { IdeaStatus } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const idea = await getIdea(id);
  if (!idea) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ idea });
}

interface PatchBody {
  status?: IdeaStatus;
  title?: string;
  hook?: string;
  angle?: string;
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const idea = await getIdea(id);
  if (!idea) return NextResponse.json({ error: "not found" }, { status: 404 });
  const body = (await req.json()) as PatchBody;
  if (body.status) idea.status = body.status;
  if (typeof body.title === "string") idea.title = body.title;
  if (typeof body.hook === "string") idea.hook = body.hook;
  if (typeof body.angle === "string") idea.angle = body.angle;
  await saveIdea(idea);
  return NextResponse.json({ idea });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  await deleteIdea(id);
  return NextResponse.json({ ok: true });
}
