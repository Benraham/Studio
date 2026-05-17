import type { HTMLAttributes } from "react";

type Tone = "neutral" | "accent" | "muted";

interface PillProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

const tones: Record<Tone, string> = {
  neutral: "bg-black/[0.05] text-[--text-muted] border-black/[0.06]",
  accent:  "bg-[--accent-quiet] text-[--accent] border-transparent",
  muted:   "bg-transparent text-[--text-dim] border-black/[0.06]",
};

export function Pill({ tone = "neutral", className = "", children, ...rest }: PillProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-[6px] text-[10.5px] uppercase tracking-[0.06em] font-medium border ${tones[tone]} ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
}
