"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "./ui/button";
import { Textarea } from "./ui/input";
import type { ChatMessage } from "@/lib/types";

const TOOL_LABELS: Record<string, string> = {
  generate_video_ideas: "Generating ideas",
  create_one_video_idea: "Creating a video",
  list_video_ideas: "Reading the pipeline",
  update_idea_status: "Updating status",
  start_video_interview: "Building interview",
  get_youtube_overview: "Pulling channel stats",
  get_recent_videos: "Loading recent videos",
  get_video_stats: "Looking up video stats",
};

function fmtToolName(name: string): string {
  return TOOL_LABELS[name] ?? name.replace(/_/g, " ");
}

export function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [thinking, setThinking] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { void load(); }, []);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/chat");
    const data = await r.json();
    setMessages(data.messages ?? []);
    setLoading(false);
  }

  async function send(e: { preventDefault(): void }) {
    e.preventDefault();
    const text = input.trim();
    if (!text || thinking) return;

    const optimisticUser: ChatMessage = {
      id: `local-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: Date.now(),
    };
    setMessages((m) => [...m, optimisticUser]);
    setInput("");
    setThinking(true);

    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      if (!r.ok) {
        setMessages((m) => [
          ...m,
          { id: `err-${Date.now()}`, role: "assistant", content: "Something went wrong. Try again.", createdAt: Date.now() },
        ]);
        return;
      }
      await load();
    } finally {
      setThinking(false);
    }
  }

  async function clearThread() {
    if (!confirm("Clear the entire chat thread?")) return;
    await fetch("/api/chat", { method: "DELETE" });
    setMessages([]);
  }

  return (
    <div
      className="flex flex-col h-[calc(100vh-80px)] max-h-[900px] rounded-[16px] overflow-hidden"
      style={{
        background: "rgba(255, 255, 255, 0.72)",
        backdropFilter: "blur(20px) saturate(1.8)",
        WebkitBackdropFilter: "blur(20px) saturate(1.8)",
        border: "1px solid rgba(255, 255, 255, 0.58)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
      }}
    >
      <div
        className="px-5 py-3.5 flex items-center justify-between"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
      >
        <div className="text-[13px] text-[--text-muted]">
          Ask for ideas, channel insights, or just say &ldquo;create a video&rdquo;.
        </div>
        <button
          onClick={clearThread}
          className="text-[12px] text-[--text-dim] hover:text-[--text-muted] transition-colors"
        >
          Clear
        </button>
      </div>

      <div ref={scrollerRef} className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
        {loading && messages.length === 0 ? (
          <div className="grid place-items-center py-12">
            <span className="spinner" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-[--text-muted] text-[14px] pt-12 scale-in">
            Try:{" "}
            <span className="text-[--text] font-medium">
              &ldquo;Create a video about creative testing.&rdquo;
            </span>
          </div>
        ) : (
          messages.map((m) => <Bubble key={m.id} m={m} />)
        )}
        {thinking ? (
          <div className="flex items-center gap-2.5 text-[13px] text-[--text-muted] fade-in">
            <ThinkingDots />
            Thinking…
          </div>
        ) : null}
      </div>

      <form
        onSubmit={send}
        className="p-3"
        style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}
      >
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(e);
              }
            }}
            rows={2}
            placeholder="Message…"
            className="flex-1"
            disabled={thinking}
          />
          <Button type="submit" disabled={thinking || !input.trim()}>
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}

function ThinkingDots() {
  return (
    <span className="flex items-center gap-[3px]">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-[5px] h-[5px] rounded-full bg-[--accent]"
          style={{ animation: `pulse-dot 1.2s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}
    </span>
  );
}

interface ToolCallSummary {
  name: string;
  result?: unknown;
}

interface IdeaShape {
  id: string;
  title: string;
}

interface IdeasResultShape {
  ideas?: IdeaShape[];
}

interface InterviewResultShape {
  interviewUrl?: string;
  ideaId?: string;
  title?: string;
}

function Bubble({ m }: { m: ChatMessage }) {
  const isUser = m.role === "user";
  const tools = m.toolCalls as ToolCallSummary[] | undefined;
  return (
    <div className="fade-in">
      <div className="text-[11px] uppercase tracking-wide text-[--text-dim] mb-1.5 font-medium">
        {isUser ? "You" : "Studio"}
      </div>
      {isUser ? (
        <div
          className="inline-block text-[14.5px] leading-relaxed text-[--text] px-4 py-2.5 rounded-[12px] rounded-tl-[4px]"
          style={{
            background: "rgba(255, 255, 255, 0.9)",
            border: "1px solid rgba(0,0,0,0.07)",
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          }}
        >
          {m.content}
        </div>
      ) : (
        <div className="text-[14.5px] leading-relaxed text-[--text] whitespace-pre-wrap">
          {m.content}
        </div>
      )}
      {tools && tools.length > 0 ? (
        <div className="mt-2 space-y-1">
          {tools.map((t, i) => (
            <ToolBadge key={i} tool={t} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ToolBadge({ tool }: { tool: ToolCallSummary }) {
  const result = tool.result as
    | (IdeasResultShape & InterviewResultShape & { count?: number; message?: string })
    | undefined;
  return (
    <div className="text-[12px] text-[--text-muted] flex flex-wrap items-center gap-2 mt-1.5">
      <span
        className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-[--text-dim]"
        style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.06)" }}
      >
        {fmtToolName(tool.name)}
      </span>
      {result?.interviewUrl ? (
        <Link
          href={result.interviewUrl}
          className="text-[--accent] hover:text-[--accent-hover] underline-offset-2 hover:underline transition-colors"
        >
          Open interview →
        </Link>
      ) : null}
      {result?.ideas && result.ideas.length > 0 ? (
        <span className="text-[--text-dim]">
          +{result.ideas.length} idea{result.ideas.length === 1 ? "" : "s"}
        </span>
      ) : null}
    </div>
  );
}
