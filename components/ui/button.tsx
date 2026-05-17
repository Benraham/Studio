"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-[10px] font-medium transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[--accent]/40 focus-visible:ring-offset-0 active:scale-[0.97]";

const variants: Record<Variant, string> = {
  primary:
    "bg-[--accent] text-white hover:bg-[--accent-hover] shadow-[0_1px_3px_rgba(229,72,77,0.30),0_4px_14px_rgba(229,72,77,0.18)] hover:shadow-[0_2px_6px_rgba(229,72,77,0.38),0_8px_22px_rgba(229,72,77,0.22)]",
  secondary:
    "glass text-[--text] hover:border-[--border-strong] hover:shadow-md",
  ghost:
    "bg-transparent text-[--text-muted] hover:text-[--text] hover:bg-black/[0.04]",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-9 px-4 text-[14px]",
  lg: "h-11 px-5 text-[15px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, className = "", children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <span className="spinner" /> : null}
      {children}
    </button>
  );
});
