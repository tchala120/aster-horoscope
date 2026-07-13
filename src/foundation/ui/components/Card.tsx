"use client";

import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
}

/** Presentational surface using Solar grey-gradient + subtle border. No business logic. */
export function Card({ children, className = "", interactive, onClick, ariaLabel }: CardProps) {
  const base =
    "rounded-2xl bg-grey-gradient ring-1 ring-white/8 p-6 text-grey-50 shadow-xl";
  const interactiveCls = interactive
    ? "cursor-pointer transition-transform hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-teal-400"
    : "";

  if (interactive) {
    return (
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={onClick}
        className={`${base} ${interactiveCls} ${className}`}
      >
        {children}
      </button>
    );
  }

  return <div className={`${base} ${className}`}>{children}</div>;
}
