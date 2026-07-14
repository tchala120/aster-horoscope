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
}

/**
 * Per-card variants for the fanned-arc layout. Cards start stacked at center
 * (a deck) and fan out to their arc slot; picking lifts + centers the card.
 */
export function fanCardVariants(fan: FanTransform, index: number): Variants {
  return {
    hidden: { opacity: 0, scale: 0.5, x: 0, y: 0, rotate: 0 },
    shown: {
      opacity: 1,
      scale: 1,
      x: fan.x,
      y: fan.y,
      rotate: fan.rotate,
      transition: {
        delay: index * durations.stagger,
        duration: durations.spread,
        ease: easings.out,
      },
    },
    picked: {
      x: 0,
      y: -fan.lift * 1.4,
      rotate: 0,
      scale: 1.16,
      zIndex: 60,
      transition: { duration: durations.pick, ease: easings.inOut },
    },
    rejected: {
      opacity: 0.25,
      x: fan.x,
      y: fan.y,
      rotate: fan.rotate,
      scale: 0.9,
      transition: { duration: durations.hover, ease: easings.out },
    },
  };
}

/** Hover/focus state for a fanned card: rises straight up and mostly straightens. */
export function fanHoverState(fan: FanTransform) {
  return {
    x: fan.x,
    y: fan.y - fan.lift,
    rotate: fan.rotate * 0.28,
    scale: 1.06,
    zIndex: 50,
  };
}
