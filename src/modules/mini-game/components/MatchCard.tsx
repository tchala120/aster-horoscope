"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { CardBack } from "@/foundation/ui/components/CardBack";

interface MatchCardProps {
  image: string;
  name: string;
  /** Position in the grid — used to stagger the deal-in. */
  index: number;
  faceUp: boolean;
  matched: boolean;
  /** True while a mismatched pair is shown (triggers a shake). */
  wrong: boolean;
  disabled: boolean;
  reducedMotion: boolean;
  onFlip: () => void;
}

/**
 * A flippable board tile. Deals in with a stagger, lifts on hover, pops + glows
 * when matched, and shakes on a mismatch. The flip itself is a 3D rotateY.
 * All motion is disabled under reduced motion (the flip becomes instant).
 */
export function MatchCard({
  image,
  name,
  index,
  faceUp,
  matched,
  wrong,
  disabled,
  reducedMotion,
  onFlip,
}: MatchCardProps) {
  const interactive = !disabled && !reducedMotion;

  return (
    <motion.button
      type="button"
      onClick={onFlip}
      disabled={disabled}
      aria-label={faceUp ? name : "Hidden card"}
      className={`relative aspect-[2/3] w-full rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-teal-400 ${
        matched ? "opacity-90" : ""
      }`}
      initial={reducedMotion ? false : { opacity: 0, scale: 0.55, y: -18 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={
        reducedMotion
          ? { duration: 0 }
          : { delay: index * 0.045, type: "spring", stiffness: 260, damping: 20 }
      }
      whileHover={interactive ? { y: -5 } : undefined}
      whileTap={interactive ? { scale: 0.95 } : undefined}
    >
      {/* Match pop / mismatch shake layer */}
      <motion.div
        className="relative h-full w-full"
        animate={
          reducedMotion
            ? undefined
            : wrong
              ? { x: [0, -7, 7, -5, 5, 0] }
              : matched
                ? { scale: [1, 1.14, 1] }
                : { x: 0, scale: 1 }
        }
        transition={{ duration: 0.45, ease: "easeInOut" }}
      >
        {/* 3D flip layer */}
        <motion.div
          className="relative h-full w-full"
          style={{ transformStyle: "preserve-3d", transformPerspective: 800 }}
          animate={{ rotateY: faceUp ? 180 : 0 }}
          transition={reducedMotion ? { duration: 0 } : { duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Back — same artwork as the daily-draw spread */}
          <CardBack rounded="rounded-xl" />

          {/* Front (artwork) */}
          <div
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              boxShadow: matched ? "0 0 22px rgba(51,204,173,0.7)" : undefined,
            }}
            className={`absolute inset-0 overflow-hidden rounded-xl ring-1 ${
              matched ? "ring-2 ring-aster-teal-400" : "ring-white/20"
            }`}
          >
            <Image src={image} alt={name} fill sizes="8rem" className="object-cover" />
          </div>
        </motion.div>
      </motion.div>
    </motion.button>
  );
}
