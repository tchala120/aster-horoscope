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
