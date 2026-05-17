"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { SlideViewer } from "@/components/slide-viewer";
import { Button } from "@/components/ui/button";
import type { Idea, SlideDeck } from "@/lib/types";

export default function ViewerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [deck, setDeck] = useState<SlideDeck | null>(null);
  const [idea, setIdea] = useState<Idea | null>(null);
  const [missing, setMissing] = useState(false);
  const [generating, setGenerating] = useState(false);

  async function load() {
    const r = await fetch(`/api/slides/${id}`);
    if (r.status === 404) {
      const data = await r.json().catch(() => ({}));
      // Try to fetch idea metadata
      const ideaRes = await fetch(`/api/ideas/${id}`);
      if (ideaRes.ok) {
        const ideaData = await ideaRes.json();
        setIdea(ideaData.idea);
      }
      if (data.error === "no deck yet") {
        setMissing(true);
      }
      return;
    }
    if (!r.ok) return;
    const data = await r.json();
    setDeck(data.deck);
    setIdea(data.idea);
  }

  useEffect(() => {
    void load();
  }, [id]);

  async function generate() {
    setGenerating(true);
    const r = await fetch(`/api/slides/${id}`, { method: "POST" });
    setGenerating(false);
    if (r.ok) {
      void load();
    }
  }

  if (missing) {
    return (
      <div className="min-h-screen grid place-items-center px-6">
        <div className="max-w-[440px] text-center">
          <h1 className="text-[22px] font-semibold mb-2">No deck yet</h1>
          <p className="text-[14px] text-[--text-muted] mb-6">
            {idea
              ? `"${idea.title}" doesn’t have a deck yet.`
              : "This idea doesn’t have a deck yet."}{" "}
            You can generate one now from the interview answers, or go run the interview first.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button onClick={generate} loading={generating}>
              Generate deck
            </Button>
            <Button variant="secondary" onClick={() => router.push("/")}>
              Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="min-h-screen grid place-items-center">
        <span className="spinner" />
      </div>
    );
  }

  return <SlideViewer slides={deck.slides} title={idea?.title} />;
}
