"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IdeaCard } from "@/components/idea-card";
import type { Idea, IdeaStatus } from "@/lib/types";

const filters: { label: string; value: IdeaStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Idea", value: "idea" },
  { label: "Interviewing", value: "interviewing" },
  { label: "Ready", value: "ready" },
  { label: "Recorded", value: "recorded" },
  { label: "Posted", value: "posted" },
];

export default function IdeasPage() {
  const router = useRouter();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<IdeaStatus | "all">("all");
  const [busy, setBusy] = useState<"create" | "batch" | null>(null);
  const [focus, setFocus] = useState("");
  const [showFocus, setShowFocus] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch("/api/ideas");
    const data = await r.json();
    setIdeas(data.ideas ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/profile");
      const data = await r.json();
      if (!data.profile) router.replace("/onboarding");
    })();
  }, [router]);

  async function createOne() {
    setBusy("create");
    const r = await fetch("/api/ideas/create-one", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ focus: focus || undefined }),
    });
    const data = await r.json();
    setBusy(null);
    if (data.interviewUrl) {
      router.push(data.interviewUrl);
    } else {
      void load();
    }
  }

  async function generateBatch() {
    setBusy("batch");
    await fetch("/api/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count: 8, focus: focus || undefined }),
    });
    setBusy(null);
    setShowFocus(false);
    setFocus("");
    void load();
  }

  const visible = filter === "all" ? ideas : ideas.filter((i) => i.status === filter);

  return (
    <AppShell>
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.02em]">Ideas</h1>
          <p className="text-[14px] text-[--text-muted] mt-1">
            Your video pipeline. Two new videos a week, none of them generic.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setShowFocus((s) => !s)}
            disabled={busy !== null}
          >
            {showFocus ? "Cancel" : "Add focus"}
          </Button>
          <Button
            variant="secondary"
            onClick={generateBatch}
            loading={busy === "batch"}
            disabled={busy !== null}
          >
            Generate 8 ideas
          </Button>
          <Button onClick={createOne} loading={busy === "create"} disabled={busy !== null}>
            Create a video
          </Button>
        </div>
      </div>

      {showFocus ? (
        <div className="mb-6 slide-up">
          <Input
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder="Optional focus — e.g. creative testing, scaling past $50k/mo, attribution after iOS 14"
            autoFocus
          />
        </div>
      ) : null}

      <div
        className="flex items-center gap-0.5 mb-6 px-1"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}
      >
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-2 text-[13px] -mb-px border-b-2 rounded-t-[4px] transition-all duration-150 font-medium ${
              filter === f.value
                ? "text-[--accent] border-[--accent] bg-[--accent-quiet]"
                : "text-[--text-muted] border-transparent hover:text-[--text] hover:bg-black/[0.03]"
            }`}
          >
            {f.label}
            {f.value !== "all" ? (
              <span className="ml-1.5 text-[11px] text-[--text-dim] nums">
                {ideas.filter((i) => i.status === f.value).length}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 grid place-items-center">
          <span className="spinner" />
        </div>
      ) : visible.length === 0 ? (
        <div className="py-16 text-center text-[--text-muted] fade-in">
          {ideas.length === 0
            ? "No ideas yet. Hit \"Create a video\" or \"Generate 8 ideas\" to start."
            : "No ideas match this filter."}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 stagger">
          {visible.map((idea) => (
            <div key={idea.id} className="slide-up">
              <IdeaCard idea={idea} onChange={load} />
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
