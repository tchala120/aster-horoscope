"use client";

import { motion } from "framer-motion";
import { cardVariants, hoverLift } from "./animation/spread-motion";

interface SpreadCardViewProps {
  index: number;
  picked: boolean;
  rejected: boolean;
  disabled?: boolean;
  reducedMotion?: boolean;
  onSelect: () => void;
}

/**
 * Presentational face-down tarot card. No business logic, no data access.
 * Motion variants are driven by props so the component stays pure/testable.
 */
export function SpreadCardView({
  index,
  picked,
  rejected,
  disabled,
  reducedMotion,
  onSelect,
}: SpreadCardViewProps) {
  const animate = picked ? "picked" : rejected ? "rejected" : "shown";

  return (
    <motion.button
      type="button"
      custom={index}
      variants={reducedMotion ? undefined : cardVariants}
      initial={reducedMotion ? false : "hidden"}
      animate={reducedMotion ? undefined : animate}
      whileHover={reducedMotion || disabled ? undefined : hoverLift}
      whileFocus={reducedMotion || disabled ? undefined : hoverLift}
      disabled={disabled || rejected}
      onClick={onSelect}
      aria-label={`Tarot card ${index + 1}, face down`}
      className="aspect-[2/3] w-full rounded-xl bg-brand-gradient ring-1 ring-white/16 shadow-lg disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-sky-300"
    >
      <span className="sr-only">Pick this card</span>
      <span aria-hidden className="block h-full w-full rounded-xl bg-grey-950/30" />
    </motion.button>
  );
}
