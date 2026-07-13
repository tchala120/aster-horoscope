"use client";

import { motion } from "framer-motion";
import type { Spread } from "@/shared";
import { Countdown } from "@/foundation/ui/components/Countdown";
import { SpreadCardView } from "./SpreadCardView";
import { containerVariants } from "./animation/spread-motion";

interface DailyDrawScreenProps {
  spread: Spread;
  drawable: boolean;
  resetAt: string;
  reducedMotion?: boolean;
  onDraw: () => void;
  onPick: (cardId: string) => void;
}

/**
 * Presentational daily-draw view. Parent (container) supplies state + handlers.
 * States: drawable -> draw CTA; has spread -> animated spread; else -> locked.
 */
export function DailyDrawScreen({
  spread,
  drawable,
  resetAt,
  reducedMotion,
  onDraw,
  onPick,
}: DailyDrawScreenProps) {
  if (drawable) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
        <h1 className="text-display-sm font-bold text-grey-50">Your cards await</h1>
        <p className="max-w-sm text-text-md text-grey-300">
          Draw your daily spread and pick one card to receive today&apos;s mission.
        </p>
        <button
          type="button"
          onClick={onDraw}
          className="rounded-full bg-brand-gradient px-8 py-3 text-text-md font-semibold text-grey-950 transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-sky-300"
        >
          Draw a Card
        </button>
      </div>
    );
  }

  if (spread.length > 0) {
    return (
      <div className="flex flex-1 flex-col items-center gap-8 p-8">
        <h2 className="text-heading-lg font-semibold text-grey-50">Pick your card</h2>
        <motion.ul
          variants={reducedMotion ? undefined : containerVariants}
          initial={reducedMotion ? false : "hidden"}
          animate={reducedMotion ? undefined : "shown"}
          className="grid w-full max-w-4xl grid-cols-3 gap-4 sm:grid-cols-5"
          aria-label="Daily tarot spread"
        >
          {spread.map((card, i) => (
            <li key={card.cardId}>
              <SpreadCardView
                index={i}
                picked={card.picked}
                rejected={card.rejected}
                reducedMotion={reducedMotion}
                onSelect={() => onPick(card.cardId)}
              />
            </li>
          ))}
        </motion.ul>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-heading-md font-semibold text-grey-50">Come back tomorrow</h2>
      <p className="text-text-md text-grey-300">Your next draw unlocks in</p>
      <Countdown targetIso={resetAt} />
    </div>
  );
}
