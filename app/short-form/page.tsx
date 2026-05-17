"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShortFormIdeaCard } from "@/components/short-form-idea-card";
import type { ShortFormIdea, ShortFormStatus } from "@/lib/types";

const filters: { label: string; value: ShortFormStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Idea", value: "idea" },
  { label: "Scripted", value: "scripted" },
  { label: "Filmed", value: "filmed" },
  { label: "Posted", value: "posted" },
];

export default function ShortFormPage() {
  const [ideas, setIdeas] = useState<ShortFormIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState<ShortFormStatus | "all">("all");
  const [focus, setFocus] = useState("");
  const [showFocus, setShowFocus] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch("/api/short-form-ideas");
    const data = await r.json();
    setIdeas(data.ideas ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function generate() {
    setGenerating(true);
    await fetch("/api/short-form-ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count: 30, focus: focus || undefined }),
    });
    setGenerating(false);
    setShowFocus(false);
    setFocus("");
    void load();
  }

  const visible = filter === "all" ? ideas : ideas.filter((i) => i.status === filter);

  return (
    <AppShell>
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.02em]">Short Form</h1>
          <p className="text-[14px] mt-1" style={{ color: "#6B7280" }}>
            Instagram Reels ideas — 3 a day, every day. Generate a week&apos;s worth at once.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setShowFocus((s) => !s)}
            disabled={generating}
          >
            {showFocus ? "Cancel" : "Add focus"}
          </Button>
          <Button onClick={generate} loading={generating} disabled={generating}>
            Generate 30 ideas
          </Button>
        </div>
      </div>

      {showFocus ? (
        <div className="mb-6 slide-up">
          <Input
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder="Optional focus — e.g. creative testing, scaling past $50k/mo, Meta vs TikTok"
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
                ? "border-[--accent] bg-[--accent-quiet]"
                : "border-transparent hover:bg-black/[0.03]"
            }`}
            style={{ color: filter === f.value ? "#E5484D" : "#6B7280" }}
          >
            {f.label}
            {f.value !== "all" ? (
              <span className="ml-1.5 text-[11px] nums" style={{ color: "#9CA3AF" }}>
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
        <div className="py-16 text-center fade-in" style={{ color: "#6B7280" }}>
          {ideas.length === 0
            ? "No ideas yet. Hit \"Generate 30 ideas\" to fill your week."
            : "No ideas match this filter."}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 stagger">
          {visible.map((idea) => (
            <div key={idea.id} className="slide-up">
              <ShortFormIdeaCard idea={idea} onChange={load} />
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
