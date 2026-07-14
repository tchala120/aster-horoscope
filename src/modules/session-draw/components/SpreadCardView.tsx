"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { playHoverChime } from "@/foundation/ui/sound";
import {
  cardVariants,
  fanCardVariants,
  fanHoverState,
  hoverLift,
  type FanTransform,
} from "./animation/spread-motion";

/** Shared card-back artwork shown on every face-down card. */
const CARD_BACK_SRC = "/cards/backside-card/backside_card.png";

/** Min gap between hover chimes so a fast sweep across cards stays pleasant. */
const HOVER_SOUND_THROTTLE_MS = 70;

interface SpreadCardViewProps {
  index: number;
  picked: boolean;
  rejected: boolean;
  disabled?: boolean;
  reducedMotion?: boolean;
  /** Resting arc position; when set the card is laid out as part of a fan. */
  fan?: FanTransform;
  onSelect: () => void;
}

/**
 * Presentational face-down tarot card. No business logic, no data access.
 * Motion is driven by props; with `fan` set it animates into a fanned arc slot,
 * otherwise it uses the default entrance. Stays pure/testable.
 */
export function SpreadCardView({
  index,
  picked,
  rejected,
  disabled,
  reducedMotion,
  fan,
  onSelect,
}: SpreadCardViewProps) {
  const animate = picked ? "picked" : rejected ? "rejected" : "shown";
  const interactive = !(disabled || rejected);
  const lastChime = useRef(0);

  const handleHoverStart = () => {
    // Sound is a sensory extra — skip it for reduced-motion users.
    if (reducedMotion || !interactive) return;
    const now = performance.now();
    if (now - lastChime.current < HOVER_SOUND_THROTTLE_MS) return;
    lastChime.current = now;
    playHoverChime();
  };

  // Reduced motion: no animation, but still honor the static fan placement.
  // Otherwise drive the entrance / hover / pick states via variants.
  const hover = fan ? fanHoverState(fan) : hoverLift;
  const motionProps = reducedMotion
    ? { style: fan ? { x: fan.x, y: fan.y, rotate: fan.rotate } : undefined }
    : {
        custom: index,
        variants: fan ? fanCardVariants(fan, index) : cardVariants,
        initial: "hidden" as const,
        animate,
        whileHover: disabled ? undefined : hover,
        whileFocus: disabled ? undefined : hover,
      };

  return (
    <motion.button
      type="button"
      {...motionProps}
      onHoverStart={handleHoverStart}
      disabled={disabled || rejected}
      onClick={onSelect}
      aria-label={`Tarot card ${index + 1}, face down`}
      className="relative aspect-[2/3] w-full overflow-hidden rounded-xl ring-1 ring-white/10 shadow-lg transition-shadow duration-300 enabled:hover:shadow-[0_18px_50px_-10px_rgba(51,204,173,0.6)] enabled:hover:ring-aster-teal-400/50 enabled:focus-visible:shadow-[0_18px_50px_-10px_rgba(51,204,173,0.6)] disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-sky-300"
    >
      <span className="sr-only">Pick this card</span>
      <Image
        src={CARD_BACK_SRC}
        alt=""
        fill
        className="object-cover"
        sizes="(max-width: 640px) 22vw, 9rem"
      />
      {/* Subtle glossy top highlight for depth */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/5"
        style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.10), transparent 42%)" }}
      />
    </motion.button>
  );
}
