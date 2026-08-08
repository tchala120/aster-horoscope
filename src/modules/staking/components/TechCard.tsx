import type { ReactNode } from "react";

interface TechCardProps {
  children: ReactNode;
  className?: string;
}

/** Shared "tech HUD" chrome for staking panels: faint circuit grid, glowing
 * corner brackets, and a scanning highlight along the top edge. Wraps the
 * app's standard glass-panel surface (bg-grey-900/70 + ring + blur). */
export function TechCard({ children, className = "" }: TechCardProps) {
  return (
    <section
      className={`relative overflow-hidden rounded-3xl bg-grey-900/70 ring-1 ring-white/8 backdrop-blur-xl ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-tech-grid opacity-[0.12]"
        aria-hidden
      />

      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden"
        aria-hidden
      >
        <div className="h-full w-1/3 animate-tech-scan bg-gradient-to-r from-transparent via-aster-teal-400 to-transparent" />
      </div>

      <span
        className="pointer-events-none absolute left-0 top-0 h-4 w-4 rounded-tl-lg border-l-2 border-t-2 border-aster-teal-400/50"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute right-0 top-0 h-4 w-4 rounded-tr-lg border-r-2 border-t-2 border-aster-sky-400/50"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute bottom-0 left-0 h-4 w-4 rounded-bl-lg border-b-2 border-l-2 border-aster-sky-400/50"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute bottom-0 right-0 h-4 w-4 rounded-br-lg border-b-2 border-r-2 border-aster-teal-400/50"
        aria-hidden
      />

      <div className="relative">{children}</div>
    </section>
  );
}
