"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { cardVariants, hoverLift } from "./animation/spread-motion";

/** Shared card-back artwork shown on every face-down card. */
const CARD_BACK_SRC = "/cards/backside-card/backside_card.png";

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
      className="relative aspect-[2/3] w-full overflow-hidden rounded-xl ring-1 ring-white/16 shadow-lg disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-sky-300"
    >
      <span className="sr-only">Pick this card</span>
      <Image
        src={CARD_BACK_SRC}
        alt=""
        fill
        className="object-cover"
        sizes="(max-width: 640px) 30vw, 18vw"
      />
    </motion.button>
  );
}
