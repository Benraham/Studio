"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { InterviewRunner } from "@/components/interview-runner";
import { ONBOARDING_QUESTIONS } from "@/lib/prompts";

export default function OnboardingPage() {
  const router = useRouter();
  const [questions] = useState(() => ONBOARDING_QUESTIONS.map((q) => ({ q })));
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await fetch("/api/profile");
      const data = await r.json();
      if (cancelled) return;
      if (data.profile) {
        router.replace("/");
        return;
      }
      setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function finalize(answers: string[]) {
    const r = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    if (!r.ok) {
      throw new Error("Profile save failed");
    }
    router.replace("/");
    router.refresh();
  }

  if (checking) {
    return (
      <div className="min-h-screen grid place-items-center">
        <span className="spinner" />
      </div>
    );
  }

  return (
    <InterviewRunner
      title="Onboarding"
      questions={questions}
      onFinalize={finalize}
      finalizeLabel="Finish setup"
    />
  );
}
