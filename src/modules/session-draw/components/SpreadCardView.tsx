"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { playHoverChime } from "@/foundation/ui/sound";
import { cardVariants, fanCardVariants, hoverLift, type FanTransform } from "./animation/spread-motion";

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
  /** Hover state from the stable (non-transformed) wrapper — see FannedSpread. */
  isHovered?: boolean;
  /** Apply the per-card entrance delay (true for the initial deal; false when
   *  un-hovering or a reroll re-slots an already-visible card, so it settles
   *  immediately instead of waiting on a stale index-based delay). Defaults
   *  to true. */
  staggerEntrance?: boolean;
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
  isHovered,
  staggerEntrance = true,
  onSelect,
}: SpreadCardViewProps) {
  const interactive = !(disabled || rejected);
  const animate = picked
    ? "picked"
    : rejected
      ? "rejected"
      : fan && isHovered && interactive
        ? "hover"
        : "shown";
  const lastChime = useRef(0);

  const handleHoverStart = () => {
    // Sound is a sensory extra — skip it for reduced-motion users.
    if (reducedMotion || !interactive) return;
    const now = performance.now();
    if (now - lastChime.current < HOVER_SOUND_THROTTLE_MS) return;
    lastChime.current = now;
    playHoverChime();
  };

  // Reduced motion: no animation. The fan's x/y offset already lives on the
  // (unanimated) <li> wrapper — see FannedSpread — so only rotation is needed
  // here. Otherwise drive the entrance / hover / pick states via variants. In
  // the fan case, hover is driven externally by `isHovered` (see FannedSpread)
  // rather than `whileHover` on this element — this element moves on hover,
  // and tracking hover on a moving target causes it to flicker in and out of
  // its own hit-box, making it hard to reliably pick a card (or never fire at
  // all — before the fix, every card's `<li>` sat in the exact same
  // dead-center spot, so a hovered card's own hit-box could be silently
  // covered by an unrelated sibling and never receive the hover at all).
  const motionProps = reducedMotion
    ? { style: fan ? { rotate: fan.rotate } : undefined }
    : fan
      ? {
          custom: index,
          variants: fanCardVariants(fan, staggerEntrance),
          initial: "hidden" as const,
          animate,
          whileFocus: disabled ? undefined : "hover",
        }
      : {
          custom: index,
          variants: cardVariants,
          initial: "hidden" as const,
          animate,
          whileHover: disabled ? undefined : hoverLift,
          whileFocus: disabled ? undefined : hoverLift,
        };

  // In the fan case, the glow/shadow tracks `isHovered` (from FannedSpread)
  // instead of the CSS `:hover` pseudo-class — a browser can match `:hover`
  // for a card that just appeared under an already-stationary cursor (e.g.
  // right after clicking "Draw a Card", which sits where the fan's center
  // card ends up), so raw CSS hover styling could glow without the user
  // ever having moved the mouse. (Class strings kept literal so Tailwind's
  // static scan picks them up.)
  const hoverClass = fan
    ? isHovered && interactive
      ? "shadow-[0_18px_50px_-10px_rgba(51,204,173,0.6)] ring-aster-teal-400/50"
      : ""
    : "enabled:hover:shadow-[0_18px_50px_-10px_rgba(51,204,173,0.6)] enabled:hover:ring-aster-teal-400/50";

  return (
    <motion.button
      type="button"
      {...motionProps}
      onHoverStart={handleHoverStart}
      disabled={disabled || rejected}
      onClick={onSelect}
      aria-label={`Tarot card ${index + 1}, face down`}
      className={`relative aspect-[2/3] w-full overflow-hidden rounded-xl ring-1 ring-white/10 shadow-lg transition-shadow duration-300 ${hoverClass} enabled:focus-visible:shadow-[0_18px_50px_-10px_rgba(51,204,173,0.6)] disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-sky-300`}
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
