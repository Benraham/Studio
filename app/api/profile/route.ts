import { NextResponse } from "next/server";
import { getProfile, setProfile } from "@/lib/kv";
import { callJson } from "@/lib/anthropic";
import { buildProfileSummaryPrompt, ONBOARDING_QUESTIONS } from "@/lib/prompts";
import type { Profile } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  const profile = await getProfile();
  return NextResponse.json({ profile });
}

interface PutBody {
  answers: string[];
}

export async function PUT(req: Request) {
  const body = (await req.json()) as PutBody;
  if (!Array.isArray(body.answers)) {
    return NextResponse.json({ error: "answers required" }, { status: 400 });
  }

  const rawAnswers = ONBOARDING_QUESTIONS.map((q, i) => ({
    q,
    a: (body.answers[i] ?? "").trim(),
  })).filter((p) => p.a.length > 0);

  if (rawAnswers.length === 0) {
    return NextResponse.json({ error: "at least one answer required" }, { status: 400 });
  }

  const summary = await callJson<{
    background: string;
    expertise: string;
    hotTakes: string;
    voice: string;
    audience: string;
  }>({
    system:
      "You synthesize user-provided answers into a tight profile JSON. Output JSON only.",
    userPrompt: buildProfileSummaryPrompt(rawAnswers),
  });

  const profile: Profile = {
    ...summary,
    completedAt: Date.now(),
    rawAnswers,
  };
  await setProfile(profile);
  return NextResponse.json({ profile });
}
