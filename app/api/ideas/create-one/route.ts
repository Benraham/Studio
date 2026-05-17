import { NextResponse } from "next/server";
import { runTool } from "@/lib/tools";

export const runtime = "nodejs";
export const maxDuration = 90;

interface PostBody {
  focus?: string;
}

export async function POST(req: Request) {
  let body: PostBody = {};
  try {
    body = (await req.json()) as PostBody;
  } catch {
    /* empty body is fine */
  }
  const result = await runTool("create_one_video_idea", { focus: body.focus });
  return NextResponse.json(result);
}
