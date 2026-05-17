"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

interface OverviewStats {
  views: number;
  watchTimeMinutes: number;
  subscribersGained: number;
  averageViewDuration: number;
  impressions?: number;
  ctr?: number;
  days: number;
}

interface RecentVideo {
  id: string;
  title: string;
  publishedAt: string;
  views?: number;
  likes?: number;
}

interface StatsResponse {
  connected: boolean;
  channelTitle?: string;
  overview?: OverviewStats | null;
  videos?: RecentVideo[];
}

const dayOptions = [7, 28, 90, 365];

function formatNumber(n: number | undefined): string {
  if (n === undefined || n === null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return Math.round(n).toString();
}

function formatHours(min: number | undefined): string {
  if (min === undefined) return "—";
  return `${(min / 60).toFixed(1)}h`;
}

function formatDuration(seconds: number | undefined): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function ChannelPage() {
  const [data, setData] = useState<StatsResponse | null>(null);
  const [days, setDays] = useState(28);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const r = await fetch(`/api/youtube/stats?days=${days}&limit=10`);
      const json = (await r.json()) as StatsResponse;
      if (!cancelled) {
        setData(json);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [days]);

  return (
    <AppShell>
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.02em]">Channel</h1>
          <p className="text-[14px] text-[--text-muted] mt-1">
            {data?.connected
              ? data.channelTitle ?? "Connected"
              : "Connect YouTube to see your stats."}
          </p>
        </div>
        <div
          className="flex items-center gap-0.5 p-1 rounded-[10px]"
          style={{
            background: "rgba(255,255,255,0.75)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.55)",
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          }}
        >
          {dayOptions.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-[12px] rounded-[7px] font-medium transition-all duration-150 ${
                days === d
                  ? "bg-white text-[--text] shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
                  : "text-[--text-muted] hover:text-[--text] hover:bg-white/60"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 grid place-items-center">
          <span className="spinner" />
        </div>
      ) : !data?.connected ? (
        <Card className="text-center py-12">
          <div className="text-[--text-muted] mb-4">YouTube isn&apos;t connected yet.</div>
          <Link href="/settings" className="text-[--accent] hover:text-[--accent-hover] transition-colors">
            Go to settings →
          </Link>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 stagger">
            <Stat label="Views"       value={formatNumber(data.overview?.views)} />
            <Stat label="Watch time"  value={formatHours(data.overview?.watchTimeMinutes)} />
            <Stat label="Subs gained" value={formatNumber(data.overview?.subscribersGained)} />
            <Stat label="Avg view"    value={formatDuration(data.overview?.averageViewDuration)} />
          </div>

          <h2 className="text-[16px] font-semibold mb-3 tracking-[-0.01em]">Recent videos</h2>
          {data.videos && data.videos.length > 0 ? (
            <div className="space-y-2 stagger">
              {data.videos.map((v) => (
                <Card key={v.id} interactive className="slide-up">
                  <a
                    href={`https://youtube.com/watch?v=${v.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="text-[14.5px] font-medium truncate">{v.title}</div>
                      <div className="text-[12px] text-[--text-dim] mt-0.5">
                        {v.publishedAt ? new Date(v.publishedAt).toLocaleDateString() : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Pill>{formatNumber(v.views)} views</Pill>
                      <Pill tone="muted">{formatNumber(v.likes)} likes</Pill>
                    </div>
                  </a>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-8 text-[--text-muted]">No videos yet.</Card>
          )}
        </>
      )}
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="glass-card rounded-[14px] p-4 slide-up"
    >
      <div className="text-[11px] uppercase tracking-[0.06em] text-[--text-dim] mb-2 font-medium">
        {label}
      </div>
      <div className="text-[26px] font-bold nums tracking-[-0.02em]">{value}</div>
    </div>
  );
}
