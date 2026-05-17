import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getProfile, listShortFormIdeas, saveShortFormIdea } from "@/lib/kv";
import { callJson } from "@/lib/anthropic";
import { CHAT_SYSTEM_BASE, buildShortFormIdeaPrompt } from "@/lib/prompts";
import type { ShortFormIdea } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function GET() {
  const ideas = await listShortFormIdeas();
  return NextResponse.json({ ideas });
}

interface PostBody {
  count?: number;
  focus?: string;
}

interface RawShortFormIdea {
  title: string;
  hook: string;
  angle: string;
  duration: number;
}

export async function POST(req: Request) {
  let body: PostBody = {};
  try {
    body = (await req.json()) as PostBody;
  } catch {
    /* empty body ok */
  }
  const count = Math.min(Math.max(Number(body.count ?? 30), 1), 30);

  const profile = await getProfile();
  const existing = await listShortFormIdeas();
  const existingTitles = existing.map((i) => i.title);

  const prompt = buildShortFormIdeaPrompt(profile, existingTitles, count, body.focus);
  const raw = await callJson<RawShortFormIdea[]>({
    system: CHAT_SYSTEM_BASE,
    userPrompt: prompt,
    cacheSystem: true,
    maxTokens: 8000,
  });

  const now = Date.now();
  let saved = 0;
  for (const r of raw) {
    const dur = [15, 30, 45, 60, 90].includes(r.duration)
      ? (r.duration as ShortFormIdea["duration"])
      : 60;
    const idea: ShortFormIdea = {
      id: nanoid(10),
      title: String(r.title).slice(0, 100),
      hook: String(r.hook),
      angle: String(r.angle),
      duration: dur,
      status: "idea",
      createdAt: now,
    };
    await saveShortFormIdea(idea, true);
    saved++;
  }

  return NextResponse.json({ count: saved });
}
