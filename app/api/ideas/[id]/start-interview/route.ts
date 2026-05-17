import { NextResponse } from "next/server";
import { runTool } from "@/lib/tools";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const result = (await runTool("start_video_interview", { ideaId: id })) as {
    interviewUrl?: string;
    error?: string;
  };
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  if (!result.interviewUrl) {
    return NextResponse.json({ error: "no interview created" }, { status: 500 });
  }
  const interviewId = result.interviewUrl.split("/").pop() ?? "";
  return NextResponse.json({ interviewId, interviewUrl: result.interviewUrl });
}
