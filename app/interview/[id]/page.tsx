"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { InterviewRunner } from "@/components/interview-runner";
import type { Idea, Interview } from "@/lib/types";

export default function InterviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [idea, setIdea] = useState<Idea | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await fetch(`/api/interview/${id}`);
      if (!r.ok) {
        if (!cancelled) setError("Interview not found");
        return;
      }
      const data = await r.json();
      if (!cancelled) {
        setInterview(data.interview);
        setIdea(data.idea);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function persist(index: number, answer: string) {
    await fetch(`/api/interview/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ index, answer }),
    });
  }

  async function finalize(answers: string[]) {
    for (let i = 0; i < answers.length; i++) {
      await persist(i, answers[i]);
    }
    const r = await fetch(`/api/interview/${id}`, { method: "POST" });
    if (!r.ok) {
      throw new Error("Deck generation failed");
    }
    const data = await r.json();
    router.replace(data.slideUrl ?? "/");
  }

  if (error) {
    return (
      <div className="min-h-screen grid place-items-center text-[--text-muted]">
        {error}
      </div>
    );
  }

  if (!interview || !idea) {
    return (
      <div className="min-h-screen grid place-items-center">
        <span className="spinner" />
      </div>
    );
  }

  return (
    <InterviewRunner
      title={idea.title}
      questions={interview.questions}
      startIndex={Math.min(interview.currentIndex, interview.questions.length - 1)}
      onAnswer={persist}
      onFinalize={finalize}
      finalizeLabel="Generate deck"
      onExit={() => router.push("/")}
    />
  );
}
