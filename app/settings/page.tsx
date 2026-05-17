"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import type { Profile } from "@/lib/types";

interface YtStatus {
  connected: boolean;
  channelTitle?: string;
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="py-20 grid place-items-center">
            <span className="spinner" />
          </div>
        </AppShell>
      }
    >
      <SettingsInner />
    </Suspense>
  );
}

function SettingsInner() {
  const sp = useSearchParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [yt, setYt] = useState<YtStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  const ytConnectedFlag = sp.get("yt_connected");
  const ytErrorFlag = sp.get("yt_error");

  useEffect(() => {
    void load();
  }, [ytConnectedFlag]);

  async function load() {
    setLoading(true);
    const [pRes, sRes] = await Promise.all([
      fetch("/api/profile"),
      fetch("/api/youtube/stats"),
    ]);
    const p = await pRes.json();
    const s = await sRes.json();
    setProfile(p.profile);
    setYt({ connected: !!s.connected, channelTitle: s.channelTitle });
    setLoading(false);
  }

  async function disconnect() {
    if (!confirm("Disconnect YouTube?")) return;
    setDisconnecting(true);
    await fetch("/api/youtube/disconnect", { method: "POST" });
    setDisconnecting(false);
    void load();
  }

  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-[28px] font-semibold tracking-tight">Settings</h1>
        <p className="text-[14px] text-[--text-muted] mt-1">
          Connections and your profile.
        </p>
      </div>

      {ytErrorFlag ? (
        <div className="mb-6 p-3 rounded-[10px] border border-[--accent] text-[--accent] text-[13px]">
          YouTube connection error: {ytErrorFlag}
        </div>
      ) : null}
      {ytConnectedFlag ? (
        <div className="mb-6 p-3 rounded-[10px] border border-[--border-strong] text-[14px]">
          YouTube connected.
        </div>
      ) : null}

      {loading ? (
        <div className="py-20 grid place-items-center">
          <span className="spinner" />
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <div className="text-[16px] font-semibold">YouTube channel</div>
                <div className="text-[13px] text-[--text-muted] mt-0.5">
                  Read-only access to your stats and published video titles.
                </div>
              </div>
              {yt?.connected ? (
                <Pill tone="accent">Connected</Pill>
              ) : (
                <Pill>Not connected</Pill>
              )}
            </div>
            <div className="mt-4 flex items-center gap-3">
              {yt?.connected ? (
                <>
                  <div className="text-[14px]">
                    <span className="text-[--text-muted]">Channel:</span>{" "}
                    <span className="font-medium">{yt.channelTitle ?? "—"}</span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={disconnect}
                    loading={disconnecting}
                  >
                    Disconnect
                  </Button>
                </>
              ) : (
                <a href="/api/youtube/auth/start">
                  <Button>Connect YouTube</Button>
                </a>
              )}
            </div>
          </Card>

          <Card>
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <div className="text-[16px] font-semibold">Profile</div>
                <div className="text-[13px] text-[--text-muted] mt-0.5">
                  What Studio knows about you. Re-run onboarding to update.
                </div>
              </div>
              <a href="/onboarding">
                <Button variant="secondary" size="sm">
                  Re-run onboarding
                </Button>
              </a>
            </div>
            {profile ? (
              <dl className="mt-4 space-y-3 text-[14px]">
                <ProfileField label="Background" value={profile.background} />
                <ProfileField label="Expertise" value={profile.expertise} />
                <ProfileField label="Hot takes" value={profile.hotTakes} />
                <ProfileField label="Voice" value={profile.voice} />
                <ProfileField label="Audience" value={profile.audience} />
              </dl>
            ) : (
              <div className="mt-4 text-[14px] text-[--text-muted]">
                No profile yet. <a href="/onboarding" className="text-[--accent]">Run onboarding →</a>
              </div>
            )}
          </Card>
        </div>
      )}
    </AppShell>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-[--text-dim] mb-1">
        {label}
      </dt>
      <dd className="text-[14px] text-[--text]">{value}</dd>
    </div>
  );
}
