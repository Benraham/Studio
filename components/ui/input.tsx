"use client";

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

const baseInput =
  "w-full bg-white/65 backdrop-blur-sm border border-black/[0.08] rounded-[10px] px-3 py-2.5 text-[14px] text-[--text] placeholder:text-[--text-dim] outline-none transition-all duration-150 focus:border-[--accent]/40 focus:bg-white/85 focus:shadow-[0_0_0_3px_rgba(229,72,77,0.08)]";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = "", ...rest }, ref) {
    return <input ref={ref} className={`${baseInput} ${className}`} {...rest} />;
  },
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className = "", ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      className={`${baseInput} resize-none leading-relaxed ${className}`}
      {...rest}
    />
  );
});
