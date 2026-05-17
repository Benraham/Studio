import { NextResponse } from "next/server";
import { getOverview, getRecentVideos, isYouTubeConnected } from "@/lib/youtube";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const days = Math.min(Math.max(parseInt(url.searchParams.get("days") ?? "28", 10) || 28, 1), 365);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") ?? "10", 10) || 10, 1), 25);
  const status = await isYouTubeConnected();
  if (!status.connected) {
    return NextResponse.json({ connected: false });
  }
  const [overview, videos] = await Promise.all([getOverview(days), getRecentVideos(limit)]);
  return NextResponse.json({
    connected: true,
    channelTitle: status.channelTitle,
    overview,
    videos,
  });
}
