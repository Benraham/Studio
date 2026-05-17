import { NextResponse } from "next/server";
import { listIdeas } from "@/lib/kv";
import { runTool } from "@/lib/tools";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  const ideas = await listIdeas();
  return NextResponse.json({ ideas });
}

interface PostBody {
  count?: number;
  focus?: string;
}

export async function POST(req: Request) {
  let body: PostBody = {};
  try {
    body = (await req.json()) as PostBody;
  } catch {
    /* empty body is fine */
  }
  const count = Math.min(Math.max(Number(body.count ?? 8), 1), 12);
  const result = await runTool("generate_video_ideas", {
    count,
    focus: body.focus,
  });
  return NextResponse.json(result);
}
