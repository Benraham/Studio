"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/input";

export interface InterviewRunnerProps {
  questions: { q: string; a?: string }[];
  startIndex?: number;
  onAnswer?: (index: number, answer: string) => Promise<void> | void;
  onFinalize: (answers: string[]) => Promise<void>;
  finalizeLabel?: string;
  exitHref?: string;
  onExit?: () => void;
  title?: string;
}

export function InterviewRunner({
  questions,
  startIndex = 0,
  onAnswer,
  onFinalize,
  finalizeLabel = "Finish",
  onExit,
  title,
}: InterviewRunnerProps) {
  const [index, setIndex] = useState(startIndex);
  const [answers, setAnswers] = useState<string[]>(() =>
    questions.map((q) => q.a ?? ""),
  );
  const [busy, setBusy] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    taRef.current?.focus();
  }, [index]);

  const total = questions.length;
  const isLast = index === total - 1;
  const current = answers[index] ?? "";

  function setCurrent(val: string) {
    setAnswers((prev) => prev.map((a, i) => (i === index ? val : a)));
  }

  async function persist() {
    if (onAnswer) {
      try {
        await onAnswer(index, current);
      } catch (e) {
        console.error("Failed to persist answer", e);
      }
    }
  }

  async function next() {
    setBusy(true);
    await persist();
    setBusy(false);
    setIndex((i) => Math.min(i + 1, total - 1));
  }

  async function back() {
    setBusy(true);
    await persist();
    setBusy(false);
    setIndex((i) => Math.max(i - 1, 0));
  }

  async function finish() {
    setFinalizing(true);
    await persist();
    try {
      await onFinalize(answers);
    } catch (e) {
      console.error("Finalize failed", e);
      setFinalizing(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header
        className="px-10 py-5 flex items-center justify-between"
        style={{
          background: "rgba(255,255,255,0.82)",
          backdropFilter: "blur(20px) saturate(1.8)",
          WebkitBackdropFilter: "blur(20px) saturate(1.8)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <div className="text-[15px] font-bold tracking-[-0.02em]">
          Studio<span className="text-[--accent]">.</span>
          {title ? (
            <span className="ml-3 text-[--text-muted] font-normal text-[14px]">{title}</span>
          ) : null}
        </div>
        <div className="flex items-center gap-4">
          <ProgressDots total={total} current={index} />
          {onExit ? (
            <button
              onClick={onExit}
              className="text-[12px] text-[--text-muted] hover:text-[--text] transition-colors"
            >
              Save & exit
            </button>
          ) : null}
        </div>
      </header>

      <div className="flex-1 grid place-items-center px-10 pb-16">
        <div key={index} className="w-full max-w-[760px] slide-up">
          <div className="text-[12px] uppercase tracking-wide text-[--text-dim] mb-3 nums font-medium">
            Question {index + 1} of {total}
          </div>
          <h1 className="text-[30px] leading-tight font-semibold mb-8 tracking-[-0.02em]">
            {questions[index].q}
          </h1>
          <Textarea
            ref={taRef}
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            placeholder="Type as much as you want. Be specific — your real answers go straight into the deck."
            rows={9}
            className="text-[15px]"
          />
          <div className="mt-6 flex items-center justify-between">
            <Button variant="ghost" onClick={back} disabled={index === 0 || busy}>
              ← Back
            </Button>
            {isLast ? (
              <Button onClick={finish} loading={finalizing}>
                {finalizeLabel}
              </Button>
            ) : (
              <Button onClick={next} disabled={busy}>
                Next →
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i < current
              ? "w-1.5 bg-[--text-dim]"
              : i === current
              ? "w-6 bg-[--accent]"
              : "w-1.5 bg-black/[0.10]"
          }`}
        />
      ))}
    </div>
  );
}
