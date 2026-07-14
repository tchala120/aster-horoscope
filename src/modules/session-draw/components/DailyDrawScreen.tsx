"use client";

import { type ReactNode } from "react";
import type { Spread } from "@/shared";
import { Countdown } from "@/foundation/ui/components/Countdown";
import { CelestialBackground } from "@/foundation/ui/components/CelestialBackground";
import { primeAudio } from "@/foundation/ui/sound";
import { FannedSpread } from "./FannedSpread";

interface DailyDrawScreenProps {
  spread: Spread;
  drawable: boolean;
  resetAt: string;
  reducedMotion?: boolean;
  onDraw: () => void;
  onReroll: () => void;
  onPick: (cardId: string) => void;
}

/**
 * Presentational daily-draw view. Parent (container) supplies state + handlers.
 * States: drawable -> draw CTA; has spread -> animated spread; else -> locked.
 * All states sit over a shared celestial backdrop for a mystical feel.
 */
export function DailyDrawScreen({
  spread,
  drawable,
  resetAt,
  reducedMotion,
  onDraw,
  onReroll,
  onPick,
}: DailyDrawScreenProps) {
  let content: ReactNode;

  if (drawable) {
    content = (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-12 text-center">
        <span className="text-text-sm font-semibold uppercase tracking-[0.3em] text-aster-teal-300/80">
          A new day, a new fate
        </span>
        <h1 className="text-display-sm font-bold drop-shadow-[0_2px_24px_rgba(51,204,173,0.3)]">
          <span className="bg-brand-gradient bg-clip-text text-transparent">Your cards await</span>
        </h1>
        <p className="max-w-sm text-text-md text-grey-400">
          Draw your daily spread and pick one card to receive today&apos;s mission.
        </p>
        <button
          type="button"
          onClick={() => {
            primeAudio();
            onDraw();
          }}
          className="mt-2 rounded-full bg-brand-gradient px-9 py-3.5 text-text-md font-semibold text-grey-950 shadow-[0_10px_40px_-8px_rgba(51,204,173,0.6)] transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-sky-300"
        >
          Draw a Card
        </button>
      </div>
    );
  } else if (spread.length > 0) {
    content = (
      <div className="relative flex flex-1 flex-col items-center justify-center gap-10 px-6 py-12">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="text-text-sm font-semibold uppercase tracking-[0.3em] text-aster-teal-300/80">
            The spread is cast
          </span>
          <h2 className="text-display-sm font-bold drop-shadow-[0_2px_24px_rgba(51,204,173,0.3)]">
            <span className="bg-brand-gradient bg-clip-text text-transparent">Pick your card</span>
          </h2>
          <p className="max-w-md text-text-md text-grey-400">
            Breathe, hold your question close, and let intuition draw you to the card meant for today.
          </p>
        </div>

        <div className="relative w-full max-w-4xl">
          {/* Soft brand halo behind the spread */}
          <div
            aria-hidden
            className="absolute -inset-8 rounded-[2.5rem] blur-3xl"
            style={{
              background:
                "radial-gradient(60% 60% at 50% 40%, rgba(51,204,173,0.18), transparent 70%)",
            }}
          />
          <FannedSpread spread={spread} reducedMotion={reducedMotion} onPick={onPick} />
        </div>

        {/* Reshuffle the spread — bottom-right corner */}
        <button
          type="button"
          onClick={onReroll}
          aria-label="Reshuffle the spread"
          className="group absolute bottom-6 right-6 inline-flex items-center gap-2 rounded-full bg-white/8 px-4 py-2.5 text-text-sm font-semibold text-grey-200 ring-1 ring-white/16 backdrop-blur transition-colors hover:bg-white/16 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-sky-300"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="transition-transform duration-500 group-hover:-rotate-180"
          >
            <path d="M23 4v6h-6" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          Reshuffle
        </button>
      </div>
    );
  } else {
    content = (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
        <span className="text-text-sm font-semibold uppercase tracking-[0.3em] text-aster-sky-300/80">
          The veil is drawn
        </span>
        <h2 className="text-heading-lg font-bold drop-shadow-[0_2px_24px_rgba(51,161,204,0.3)]">
          <span className="bg-brand-gradient bg-clip-text text-transparent">Come back tomorrow</span>
        </h2>
        <p className="text-text-md text-grey-400">Your next draw unlocks in</p>
        <Countdown targetIso={resetAt} />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-1 flex-col overflow-hidden">
      <CelestialBackground />
      <div className="relative z-10 flex flex-1 flex-col">{content}</div>
    </div>
  );
}
