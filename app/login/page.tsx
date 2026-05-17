"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Login failed");
        setLoading(false);
        return;
      }
      const profileRes = await fetch("/api/profile");
      const data = await profileRes.json();
      router.replace(data.profile ? "/" : "/onboarding");
      router.refresh();
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-6">
      <div className="w-full max-w-[380px] scale-in">
        <form
          onSubmit={(e) => void onSubmit(e)}
          className="rounded-[20px] p-8"
          style={{
            background: "rgba(255, 255, 255, 0.88)",
            backdropFilter: "blur(32px) saturate(2)",
            WebkitBackdropFilter: "blur(32px) saturate(2)",
            border: "1px solid rgba(255, 255, 255, 0.70)",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.05), 0 16px 56px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.95)",
          }}
        >
          <div className="mb-8">
            <div className="text-[22px] font-bold tracking-[-0.03em] mb-1">
              Studio<span className="text-[--accent]">.</span>
            </div>
            <div className="text-[13px] text-[--text-muted]">Sign in to continue.</div>
          </div>

          <label className="block text-[11px] uppercase tracking-[0.06em] text-[--text-dim] font-medium mb-2">
            Password
          </label>
          <Input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          {error ? (
            <div className="mt-3 text-[13px] text-[--accent] fade-in">{error}</div>
          ) : null}

          <Button type="submit" className="w-full mt-5" loading={loading}>
            Sign in
          </Button>
        </form>

        <p className="text-center text-[12px] text-[--text-dim] mt-5">
          Your personal YouTube content studio.
        </p>
      </div>
    </div>
  );
}
