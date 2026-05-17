import { NextResponse } from "next/server";
import { getProfile, getShortFormIdea, getShortFormScript, saveShortFormIdea, saveShortFormScript } from "@/lib/kv";
import { callJson } from "@/lib/anthropic";
import { CHAT_SYSTEM_BASE, buildShortFormScriptPrompt } from "@/lib/prompts";
import type { ShortFormScript } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const script = await getShortFormScript(id);
  return NextResponse.json({ script: script ?? null });
}

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const idea = await getShortFormIdea(id);
  if (!idea) return NextResponse.json({ error: "idea not found" }, { status: 404 });

  const profile = await getProfile();
  const prompt = buildShortFormScriptPrompt(idea, profile);

  const raw = await callJson<{ hook: string; body: string; close: string }>({
    system: CHAT_SYSTEM_BASE,
    userPrompt: prompt,
    cacheSystem: true,
    maxTokens: 2000,
  });

  const script: ShortFormScript = {
    ideaId: id,
    hook: raw.hook,
    body: raw.body,
    close: raw.close,
    generatedAt: Date.now(),
  };
  await saveShortFormScript(script);

  idea.status = "scripted";
  idea.scriptAt = Date.now();
  await saveShortFormIdea(idea);

  return NextResponse.json({ script });
}
