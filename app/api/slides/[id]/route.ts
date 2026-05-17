import { NextResponse } from "next/server";
import { getIdea, getInterview, getSlides, saveIdea, saveSlides } from "@/lib/kv";
import { callJson } from "@/lib/anthropic";
import { CHAT_SYSTEM_BASE, buildSlideDeckPrompt } from "@/lib/prompts";
import { getProfile } from "@/lib/kv";
import type { Slide } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const idea = await getIdea(id);
  if (!idea) return NextResponse.json({ error: "idea not found" }, { status: 404 });
  const deck = await getSlides(id);
  if (!deck) return NextResponse.json({ error: "no deck yet" }, { status: 404 });
  return NextResponse.json({ idea, deck });
}

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const idea = await getIdea(id);
  if (!idea) return NextResponse.json({ error: "idea not found" }, { status: 404 });
  const interview = idea.interviewId ? await getInterview(idea.interviewId) : null;
  const profile = await getProfile();

  const qa = interview?.questions ?? [];

  const deck = await callJson<{ slides: Slide[] }>({
    system: CHAT_SYSTEM_BASE,
    userPrompt: buildSlideDeckPrompt(idea, qa, profile),
    cacheSystem: true,
    maxTokens: 6000,
  });

  await saveSlides(idea.id, { slides: deck.slides, generatedAt: Date.now() });
  idea.status = "ready";
  idea.slidesAt = Date.now();
  await saveIdea(idea);

  return NextResponse.json({ ok: true, slideUrl: `/v/${idea.id}`, slideCount: deck.slides.length });
}
