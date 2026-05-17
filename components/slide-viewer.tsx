"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Slide } from "@/lib/types";

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
      if (i >= slides.length - 1) {
        setShowToast(true);
        return i;
      }
      return i + 1;
    });
  }, [slides.length]);

  const back = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  useEffect(() => {
    if (!showToast) return;
    const t = setTimeout(() => setShowToast(false), 1400);
    return () => clearTimeout(t);
  }, [showToast]);

  // Auto-hide toolbar after idle
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
        e.preventDefault();
        advance();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        back();
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
    <div className="min-h-screen bg-[--bg] text-[--text] relative overflow-hidden">
      <div
        className={`absolute top-0 left-0 right-0 px-8 py-5 flex items-center justify-between z-10 transition-opacity duration-300 ${
          showChrome ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="text-[13px] text-[--text-muted]">
          {title ? <span className="truncate max-w-[460px] inline-block align-bottom">{title}</span> : "Studio"}
        </div>
        <div className="flex items-center gap-4 text-[12.5px]">
          <button
            onClick={() => setShowNotes((v) => !v)}
            className="text-[--text-muted] hover:text-[--text]"
          >
            {showNotes ? "Hide notes" : "Show notes"}{" "}
            <span className="text-[--text-dim]">(N)</span>
          </button>
          <button onClick={exit} className="text-[--text-muted] hover:text-[--text]">
            Exit <span className="text-[--text-dim]">(Esc)</span>
          </button>
        </div>
      </div>

      <div className="min-h-screen grid place-items-center px-16 py-24">
        <div className="w-full max-w-[1100px] fade-in" key={index}>
          <h2 className="text-[44px] leading-tight font-semibold tracking-tight mb-8">
            {slide.title}
          </h2>
          {slide.body ? (
            <p className="text-[22px] leading-relaxed text-[--text] mb-6 whitespace-pre-wrap">
              {slide.body}
            </p>
          ) : null}
          {slide.bullets && slide.bullets.length > 0 ? (
            <ul className="space-y-3.5">
              {slide.bullets.map((b, i) => (
                <li
                  key={i}
                  className="text-[22px] leading-snug pl-6 relative before:content-['—'] before:absolute before:left-0 before:text-[--accent]"
                >
                  {b}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <div
        className={`absolute bottom-6 right-8 text-[14px] nums transition-opacity duration-300 ${
          showChrome ? "opacity-100" : "opacity-0"
        }`}
      >
        <span className="text-[--accent] font-semibold">{index + 1}</span>
        <span className="text-[--text-dim]"> / {slides.length}</span>
      </div>

      {showNotes && slide.speakerNotes ? (
        <div className="absolute bottom-20 left-8 right-8 max-w-[760px] bg-[--surface] border border-[--border] rounded-[10px] p-4 text-[14px] text-[--text-muted] fade-in">
          <div className="text-[10.5px] uppercase tracking-wide text-[--text-dim] mb-1">
            Speaker notes
          </div>
          {slide.speakerNotes}
        </div>
      ) : null}

      {showToast ? (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[--surface] border border-[--border-strong] rounded-[8px] px-4 py-2 text-[13px] text-[--text-muted] fade-in">
          End of deck
        </div>
      ) : null}
    </div>
  );
}
