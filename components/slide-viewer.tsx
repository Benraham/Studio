"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Slide } from "@/lib/types";

const BG = "#F8F7F4";
const TEXT = "#111111";
const MUTED = "#6B7280";
const DIM = "#9CA3AF";
const ACCENT = "#E5484D";
const TRACK = "#E5E7EB";

interface Props {
  slides: Slide[];
  title?: string;
}

export function SlideViewer({ slides, title }: Props) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showChrome, setShowChrome] = useState(true);

  const exit = useCallback(() => router.push("/"), [router]);

  const advance = useCallback(() => {
    setIndex((i) => {
      if (i >= slides.length - 1) { setShowToast(true); return i; }
      return i + 1;
    });
  }, [slides.length]);

  const back = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  useEffect(() => {
    if (!showToast) return;
    const t = setTimeout(() => setShowToast(false), 1400);
    return () => clearTimeout(t);
  }, [showToast]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const reveal = () => {
      setShowChrome(true);
      clearTimeout(timer);
      timer = setTimeout(() => setShowChrome(false), 2500);
    };
    reveal();
    window.addEventListener("mousemove", reveal);
    window.addEventListener("keydown", reveal);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousemove", reveal);
      window.removeEventListener("keydown", reveal);
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === " " || e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault(); advance();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault(); back();
      } else if (e.key === "Escape") {
        exit();
      } else if (e.key === "n") {
        setShowNotes((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, back, exit]);

  const slide = slides[index];

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: BG, color: TEXT }}
    >
      {/* Toolbar */}
      <div
        className={`absolute top-0 left-0 right-0 px-8 py-4 flex items-center justify-between z-10 transition-opacity duration-300 ${
          showChrome ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background: "rgba(255,255,255,0.80)",
          backdropFilter: "blur(20px) saturate(1.8)",
          WebkitBackdropFilter: "blur(20px) saturate(1.8)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <div className="text-[13px]" style={{ color: MUTED }}>
          {title ? (
            <span className="truncate max-w-[460px] inline-block align-bottom">{title}</span>
          ) : (
            "Studio"
          )}
        </div>
        <div className="flex items-center gap-5 text-[12.5px]">
          <button
            onClick={() => setShowNotes((v) => !v)}
            style={{ color: MUTED }}
            className="hover:opacity-70 transition-opacity"
          >
            {showNotes ? "Hide notes" : "Show notes"}{" "}
            <span style={{ color: DIM }}>(N)</span>
          </button>
          <button
            onClick={exit}
            style={{ color: MUTED }}
            className="hover:opacity-70 transition-opacity"
          >
            Exit <span style={{ color: DIM }}>(Esc)</span>
          </button>
        </div>
      </div>

      {/* Slide content */}
      <div className="min-h-screen flex flex-col items-center justify-center px-16 py-28">
        <div
          key={index}
          className="w-full max-w-[1000px] fade-in"
        >
          <SlideContent slide={slide} />
        </div>
      </div>

      {/* Counter */}
      <div
        className={`absolute bottom-6 right-8 text-[14px] nums transition-opacity duration-300 ${
          showChrome ? "opacity-100" : "opacity-0"
        }`}
      >
        <span style={{ color: ACCENT, fontWeight: 600 }}>{index + 1}</span>
        <span style={{ color: DIM }}> / {slides.length}</span>
      </div>

      {/* Speaker notes */}
      {showNotes && slide.speakerNotes ? (
        <div
          className="absolute bottom-16 left-8 right-8 max-w-[760px] rounded-[12px] p-4 text-[14px] fade-in"
          style={{
            background: "rgba(255,255,255,0.88)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(0,0,0,0.08)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            color: MUTED,
          }}
        >
          <div
            className="text-[10.5px] uppercase tracking-wide mb-1 font-medium"
            style={{ color: DIM }}
          >
            Speaker notes
          </div>
          {slide.speakerNotes}
        </div>
      ) : null}

      {/* End-of-deck toast */}
      {showToast ? (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-[8px] px-4 py-2 text-[13px] fade-in"
          style={{
            background: "rgba(255,255,255,0.92)",
            border: "1px solid rgba(0,0,0,0.09)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            color: MUTED,
          }}
        >
          End of deck
        </div>
      ) : null}
    </div>
  );
}

/* ── Layout router ── */

function SlideContent({ slide }: { slide: Slide }) {
  switch (slide.layout) {
    case "stat":   return <StatLayout slide={slide} />;
    case "chart":  return <ChartLayout slide={slide} />;
    case "steps":  return <StepsLayout slide={slide} />;
    case "quote":  return <QuoteLayout slide={slide} />;
    default:       return <DefaultLayout slide={slide} />;
  }
}

/* ── Default text slide ── */
function DefaultLayout({ slide }: { slide: Slide }) {
  return (
    <div>
      <h2
        className="text-[44px] leading-tight font-bold tracking-[-0.02em] mb-8"
        style={{ color: TEXT }}
      >
        {slide.title}
      </h2>
      {slide.body ? (
        <p
          className="text-[22px] leading-relaxed mb-6 whitespace-pre-wrap"
          style={{ color: TEXT }}
        >
          {slide.body}
        </p>
      ) : null}
      {slide.bullets && slide.bullets.length > 0 ? (
        <ul className="space-y-3.5">
          {slide.bullets.map((b, i) => (
            <li
              key={i}
              className="text-[22px] leading-snug pl-6 relative"
              style={{ color: TEXT }}
            >
              <span
                className="absolute left-0"
                style={{ color: ACCENT }}
              >
                —
              </span>
              {b}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/* ── Stat slide ── */
function StatLayout({ slide }: { slide: Slide }) {
  const stat = slide.stat;
  if (!stat) return <DefaultLayout slide={slide} />;
  return (
    <div className="text-center">
      <div
        className="text-[14px] uppercase tracking-[0.08em] font-medium mb-8"
        style={{ color: DIM }}
      >
        {slide.title}
      </div>
      <div
        className="font-bold tracking-tight leading-none mb-5"
        style={{ color: ACCENT, fontSize: "clamp(72px, 12vw, 112px)" }}
      >
        {stat.value}
      </div>
      <div className="text-[22px] font-medium mb-3" style={{ color: TEXT }}>
        {stat.label}
      </div>
      {stat.context ? (
        <div className="text-[15px] italic" style={{ color: MUTED }}>
          {stat.context}
        </div>
      ) : null}
    </div>
  );
}

/* ── Chart slide ── */
function ChartLayout({ slide }: { slide: Slide }) {
  const chart = slide.chart;
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 80);
    return () => clearTimeout(t);
  }, []);

  if (!chart) return <DefaultLayout slide={slide} />;

  const max = chart.maxValue ?? Math.max(...chart.items.map((i) => i.value), 1);

  return (
    <div>
      <h2
        className="text-[38px] leading-tight font-bold tracking-[-0.02em] mb-10"
        style={{ color: TEXT }}
      >
        {slide.title}
      </h2>
      <div className="space-y-5">
        {chart.items.map((item, i) => (
          <div key={i} className="flex items-center gap-5">
            <div
              className="text-[16px] text-right shrink-0"
              style={{ color: MUTED, width: "160px" }}
            >
              {item.label}
            </div>
            <div
              className="flex-1 rounded-full overflow-hidden"
              style={{ background: TRACK, height: "12px" }}
            >
              <div
                className="h-full rounded-full transition-all ease-out"
                style={{
                  background: ACCENT,
                  width: animated ? `${(item.value / max) * 100}%` : "0%",
                  transitionDuration: `${600 + i * 100}ms`,
                }}
              />
            </div>
            <div
              className="text-[16px] font-semibold shrink-0 nums"
              style={{ color: TEXT, width: "60px" }}
            >
              {item.value}{chart.unit ?? ""}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Steps slide ── */
function StepsLayout({ slide }: { slide: Slide }) {
  const steps = slide.steps?.steps;
  if (!steps || steps.length === 0) return <DefaultLayout slide={slide} />;

  return (
    <div>
      <h2
        className="text-[38px] leading-tight font-bold tracking-[-0.02em] mb-10"
        style={{ color: TEXT }}
      >
        {slide.title}
      </h2>
      <div>
        {steps.map((step, i) => (
          <div key={i}>
            <div className="flex items-start gap-5">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-[15px] font-bold shrink-0"
                style={{ background: ACCENT, color: "#fff" }}
              >
                {i + 1}
              </div>
              <div
                className="text-[22px] leading-snug pt-1.5"
                style={{ color: TEXT }}
              >
                {step}
              </div>
            </div>
            {i < steps.length - 1 ? (
              <div
                className="ml-5 my-2"
                style={{
                  width: "2px",
                  height: "32px",
                  background: TRACK,
                  marginLeft: "19px",
                }}
              />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Quote slide ── */
function QuoteLayout({ slide }: { slide: Slide }) {
  if (!slide.quote) return <DefaultLayout slide={slide} />;
  return (
    <div className="text-center max-w-[860px] mx-auto">
      <div
        className="font-serif leading-none mb-2 select-none"
        style={{ color: ACCENT, fontSize: "80px", lineHeight: 1 }}
        aria-hidden
      >
        &ldquo;
      </div>
      <div
        className="text-[30px] font-semibold leading-snug tracking-[-0.01em] mb-8"
        style={{ color: TEXT }}
      >
        {slide.quote}
      </div>
      {slide.title ? (
        <div className="text-[16px]" style={{ color: MUTED }}>
          — {slide.title}
        </div>
      ) : null}
    </div>
  );
}
