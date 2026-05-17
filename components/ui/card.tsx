import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export function Card({ className = "", interactive, ...rest }: CardProps) {
  return (
    <div
      className={`glass-card rounded-[14px] p-5 ${interactive ? "interactive cursor-pointer" : ""} ${className}`}
      {...rest}
    />
  );
}
