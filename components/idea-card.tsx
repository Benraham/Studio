"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Pill } from "./ui/pill";
import type { Idea, IdeaStatus } from "@/lib/types";

const statusLabel: Record<IdeaStatus, string> = {
  idea: "Idea",
  interviewing: "Interviewing",
  ready: "Ready",
  recorded: "Recorded",
  posted: "Posted",
};

const statusTone = (s: IdeaStatus) => (s === "ready" || s === "posted" ? "accent" : "neutral");

interface Props {
  idea: Idea;
  onChange: () => void;
}

export function IdeaCard({ idea, onChange }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function startInterview() {
    setBusy("interview");
    if (idea.interviewId && idea.status === "interviewing") {
      router.push(`/interview/${idea.interviewId}`);
      return;
    }
    const res = await fetch(`/api/ideas/${idea.id}/start-interview`, { method: "POST" });
    const data = await res.json();
    setBusy(null);
    if (data.interviewId) {
      router.push(`/interview/${data.interviewId}`);
    } else {
      onChange();
    }
  }

  async function generateDeck() {
    setBusy("deck");
    const res = await fetch(`/api/slides/${idea.id}`, { method: "POST" });
    const data = await res.json();
    setBusy(null);
    if (data.slideUrl) {
      router.push(data.slideUrl);
    } else {
      onChange();
    }
  }

  async function setStatus(status: IdeaStatus) {
    setBusy("status");
    await fetch(`/api/ideas/${idea.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(null);
    onChange();
  }

  async function remove() {
    if (!confirm("Delete this idea?")) return;
    setBusy("delete");
    await fetch(`/api/ideas/${idea.id}`, { method: "DELETE" });
    setBusy(null);
    onChange();
  }

  function viewDeck() {
    router.push(`/v/${idea.id}`);
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-4 mb-3">
        <Pill tone={statusTone(idea.status)}>{statusLabel[idea.status]}</Pill>
        <button
          onClick={remove}
          disabled={busy === "delete"}
          className="text-[12px] text-[--text-dim] hover:text-[--text-muted]"
        >
          Delete
        </button>
      </div>

      <h3 className="text-[16px] font-semibold leading-snug mb-2">{idea.title}</h3>
      <div className="text-[13px] text-[--text-muted] mb-2">
        <span className="text-[--text-dim] uppercase tracking-wide text-[11px] mr-2">Hook</span>
        {idea.hook}
      </div>
      <div className="text-[13px] text-[--text-muted] mb-5">
        <span className="text-[--text-dim] uppercase tracking-wide text-[11px] mr-2">Angle</span>
        {idea.angle}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {idea.status === "ready" || idea.status === "recorded" || idea.status === "posted" ? (
          <Button size="sm" onClick={viewDeck}>
            View deck
          </Button>
        ) : null}
        {idea.status === "idea" ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={startInterview}
            loading={busy === "interview"}
          >
            Start interview
          </Button>
        ) : null}
        {idea.status === "interviewing" ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={startInterview}
            loading={busy === "interview"}
          >
            Resume interview
          </Button>
        ) : null}
        {idea.status === "ready" ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setStatus("recorded")}
            loading={busy === "status"}
          >
            Mark recorded
          </Button>
        ) : null}
        {idea.status === "recorded" ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setStatus("posted")}
            loading={busy === "status"}
          >
            Mark posted
          </Button>
        ) : null}
        {idea.status === "interviewing" ||
        (idea.status === "idea" && idea.interviewId) ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={generateDeck}
            loading={busy === "deck"}
          >
            Generate deck now
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
