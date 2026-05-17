"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Pill } from "./ui/pill";
import type { ShortFormIdea, ShortFormScript, ShortFormStatus } from "@/lib/types";

const statusLabel: Record<ShortFormStatus, string> = {
  idea: "Idea",
  scripted: "Scripted",
  filmed: "Filmed",
  posted: "Posted",
};

const statusTone = (s: ShortFormStatus) =>
  s === "idea" ? "neutral" : "accent";

interface Props {
  idea: ShortFormIdea;
  onChange: () => void;
}

export function ShortFormIdeaCard({ idea, onChange }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [script, setScript] = useState<ShortFormScript | null>(null);
  const [scriptOpen, setScriptOpen] = useState(false);

  async function writeScript() {
    setBusy("script");
    const r = await fetch(`/api/short-form-ideas/${idea.id}/script`, { method: "POST" });
    const data = await r.json();
    setBusy(null);
    if (data.script) {
      setScript(data.script as ShortFormScript);
      setScriptOpen(true);
      onChange();
    }
  }

  async function viewScript() {
    if (script) { setScriptOpen((v) => !v); return; }
    setBusy("loadScript");
    const r = await fetch(`/api/short-form-ideas/${idea.id}/script`);
    const data = await r.json();
    setBusy(null);
    if (data.script) {
      setScript(data.script as ShortFormScript);
      setScriptOpen(true);
    }
  }

  async function setStatus(status: ShortFormStatus) {
    setBusy("status");
    await fetch(`/api/short-form-ideas/${idea.id}`, {
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
    await fetch(`/api/short-form-ideas/${idea.id}`, { method: "DELETE" });
    setBusy(null);
    onChange();
  }

  return (
    <div className="glass-card rounded-[14px] p-5 flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Pill tone={statusTone(idea.status)}>{statusLabel[idea.status]}</Pill>
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-[10.5px] font-medium border"
            style={{ background: "rgba(0,0,0,0.04)", borderColor: "rgba(0,0,0,0.06)", color: "#6B7280" }}
          >
            {idea.duration}s
          </span>
        </div>
        <button
          onClick={remove}
          disabled={busy === "delete"}
          className="text-[12px] transition-colors"
          style={{ color: "#9CA3AF" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#6B7280")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#9CA3AF")}
        >
          Delete
        </button>
      </div>

      {/* Title */}
      <h3 className="text-[16px] font-semibold leading-snug">{idea.title}</h3>

      {/* Hook + Angle */}
      <div className="space-y-1.5">
        <div className="text-[13px]" style={{ color: "#6B7280" }}>
          <span
            className="uppercase tracking-wide text-[10.5px] font-medium mr-2"
            style={{ color: "#9CA3AF" }}
          >
            Hook
          </span>
          <span className="italic">&ldquo;{idea.hook}&rdquo;</span>
        </div>
        <div className="text-[13px]" style={{ color: "#6B7280" }}>
          <span
            className="uppercase tracking-wide text-[10.5px] font-medium mr-2"
            style={{ color: "#9CA3AF" }}
          >
            Angle
          </span>
          {idea.angle}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {idea.status === "idea" ? (
          <Button size="sm" onClick={writeScript} loading={busy === "script"} disabled={busy !== null}>
            Get outline
          </Button>
        ) : null}
        {idea.status === "scripted" || (idea.status !== "idea" && idea.scriptAt) ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={viewScript}
            loading={busy === "loadScript"}
            disabled={busy !== null}
          >
            {scriptOpen ? "Hide outline" : "View outline"}
          </Button>
        ) : null}
        {idea.status === "scripted" ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setStatus("filmed")}
            loading={busy === "status"}
            disabled={busy !== null}
          >
            Mark filmed
          </Button>
        ) : null}
        {idea.status === "filmed" ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setStatus("posted")}
            loading={busy === "status"}
            disabled={busy !== null}
          >
            Mark posted
          </Button>
        ) : null}
      </div>

      {/* Script reveal */}
      {scriptOpen && script ? (
        <div
          className="mt-1 rounded-[10px] p-4 space-y-3 fade-in"
          style={{
            background: "rgba(0,0,0,0.03)",
            border: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <ScriptSection label="Open with" text={script.hook} />
          <ScriptSection label="Cover" text={script.body} />
          <ScriptSection label="Wrap with" text={script.close} />
        </div>
      ) : null}
    </div>
  );
}

function ScriptSection({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <div
        className="text-[10.5px] uppercase tracking-[0.06em] font-medium mb-1"
        style={{ color: "#9CA3AF" }}
      >
        {label}
      </div>
      <div
        className="text-[13px] leading-relaxed whitespace-pre-wrap"
        style={{ color: "#374151", fontFamily: "inherit" }}
      >
        {text}
      </div>
    </div>
  );
}
