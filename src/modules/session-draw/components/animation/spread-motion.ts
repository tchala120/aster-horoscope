import type { Variants } from "framer-motion";
import { durations, easings } from "@/foundation/ui/motion";

/** Container orchestrates the staggered fan-out of the spread. */
export const containerVariants: Variants = {
  hidden: {},
  shown: {
    transition: {
      delayChildren: durations.shuffle * 0.4,
      staggerChildren: durations.stagger,
    },
  },
};

/** Per-card entrance + pick/reject states. `custom` = card index. */
export const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.92 },
  shown: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * durations.stagger, duration: durations.spread, ease: easings.out },
  }),
  picked: {
    scale: 1.12,
    y: -28,
    transition: { duration: durations.pick, ease: easings.inOut },
  },
  rejected: {
    opacity: 0.3,
    scale: 0.9,
    transition: { duration: durations.hover, ease: easings.out },
  },
};

/** Hover/focus lift (applied via whileHover/whileFocus). */
export const hoverLift = { y: -12, scale: 1.05 };

/** Resting position of a single card within the fanned arc (px + degrees). */
export interface FanTransform {
  x: number;
  y: number;
  rotate: number;
  /** How far the card rises on hover / when picked (px). */
  lift: number;
  /** Position within its own row — the entrance stagger keys off this (not
   *  the flat spread index) so every row deals in parallel. */
  staggerIndex: number;
}

/**
 * Per-card variants for the fanned-arc layout. Cards start stacked at center
 * (a deck) and fan out to their arc slot; picking lifts + centers the card.
 * The resting `x`/`y` fan offset lives on the (unanimated) `<li>` wrapper —
 * see FannedSpread — so these are all *relative* to that resting slot rather
 * than absolute from the stage center. `shown` cancels out to the slot
 * itself; `hidden` offsets backward by the full fan vector so the card still
 * visually starts stacked at center.
 */
export function fanCardVariants(fan: FanTransform, staggerEntrance = true): Variants {
  return {
    hidden: { opacity: 0, scale: 0.5, x: -fan.x, y: -fan.y, rotate: -fan.rotate },
    shown: {
      opacity: 1,
      scale: 1,
      x: 0,
      y: 0,
      rotate: fan.rotate,
      zIndex: 0,
      transition: {
        delay: staggerEntrance ? fan.staggerIndex * durations.stagger : 0,
        duration: durations.spread,
        ease: easings.out,
      },
    },
    // Rises straight up and mostly straightens. Driven by `isHovered` from the
    // stable `<li>` wrapper — see FannedSpread — rather than this element's own
    // pointer events, so the lift can't move the card out from under the cursor
    // mid-hover.
    hover: {
      opacity: 1,
      x: 0,
      y: -fan.lift,
      rotate: fan.rotate * 0.28,
      scale: 1.06,
      zIndex: 50,
      transition: { duration: durations.hover, ease: easings.out },
    },
    picked: {
      opacity: 1,
      x: -fan.x,
      y: -fan.lift * 1.4 - fan.y,
      rotate: 0,
      scale: 1.16,
      zIndex: 60,
      transition: { duration: durations.pick, ease: easings.inOut },
    },
    rejected: {
      opacity: 0.25,
      x: 0,
      y: 0,
      rotate: fan.rotate,
      scale: 0.9,
      zIndex: 0,
      transition: { duration: durations.hover, ease: easings.out },
    },
  };
}
