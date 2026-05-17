import { NextResponse } from "next/server";
import { getIdea, getInterview, saveIdea, saveInterview, saveSlides } from "@/lib/kv";
import { callJson } from "@/lib/anthropic";
import { CHAT_SYSTEM_BASE, buildSlideDeckPrompt } from "@/lib/prompts";
import { getProfile } from "@/lib/kv";
import type { Slide } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const interview = await getInterview(id);
  if (!interview) return NextResponse.json({ error: "not found" }, { status: 404 });
  const idea = await getIdea(interview.ideaId);
  return NextResponse.json({ interview, idea });
}

interface PatchBody {
  index: number;
  answer: string;
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const interview = await getInterview(id);
  if (!interview) return NextResponse.json({ error: "not found" }, { status: 404 });
  const body = (await req.json()) as PatchBody;
  if (
    !Number.isInteger(body.index) ||
    body.index < 0 ||
    body.index >= interview.questions.length
  ) {
    return NextResponse.json({ error: "invalid index" }, { status: 400 });
  }
  interview.questions[body.index].a = body.answer;
  if (body.index >= interview.currentIndex) {
    interview.currentIndex = Math.min(body.index + 1, interview.questions.length);
  }
  await saveInterview(interview);
  return NextResponse.json({ interview });
}

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const interview = await getInterview(id);
  if (!interview) return NextResponse.json({ error: "not found" }, { status: 404 });
  const idea = await getIdea(interview.ideaId);
  if (!idea) return NextResponse.json({ error: "idea not found" }, { status: 404 });

  interview.completedAt = Date.now();
  await saveInterview(interview);

  const profile = await getProfile();
  const deck = await callJson<{ slides: Slide[] }>({
    system: CHAT_SYSTEM_BASE,
    userPrompt: buildSlideDeckPrompt(idea, interview.questions, profile),
    cacheSystem: true,
    maxTokens: 6000,
  });

  await saveSlides(idea.id, { slides: deck.slides, generatedAt: Date.now() });
  idea.status = "ready";
  idea.slidesAt = Date.now();
  await saveIdea(idea);

  return NextResponse.json({
    ok: true,
    slideUrl: `/v/${idea.id}`,
    slideCount: deck.slides.length,
  });
}
