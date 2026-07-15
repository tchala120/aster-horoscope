"use client";

import Image from "next/image";
import { motion } from "framer-motion";

interface MatchCardProps {
  image: string;
  name: string;
  faceUp: boolean;
  matched: boolean;
  disabled: boolean;
  reducedMotion: boolean;
  onFlip: () => void;
}

/** A flippable board tile: mystical back, tarot artwork on the front. */
export function MatchCard({
  image,
  name,
  faceUp,
  matched,
  disabled,
  reducedMotion,
  onFlip,
}: MatchCardProps) {
  return (
    <button
      type="button"
      onClick={onFlip}
      disabled={disabled}
      aria-label={faceUp ? name : "Hidden card"}
      style={{ perspective: 800 }}
      className={`relative aspect-[2/3] w-full rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-teal-400 ${
        matched ? "opacity-80" : ""
      }`}
    >
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: faceUp ? 180 : 0 }}
        transition={reducedMotion ? { duration: 0 } : { duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Back (face-down) */}
        <div
          style={{ backfaceVisibility: "hidden" }}
          className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-xl bg-grey-gradient ring-1 ring-white/12"
        >
          <span
            aria-hidden
            className="absolute h-14 w-14 rounded-full blur-xl"
            style={{ background: "radial-gradient(circle, rgba(51,204,173,0.55), transparent 70%)" }}
          />
          <span aria-hidden className="relative text-heading-md text-aster-teal-200">
            {"\u2726"}
          </span>
        </div>

        {/* Front (artwork) */}
        <div
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          className={`absolute inset-0 overflow-hidden rounded-xl ring-1 ${
            matched ? "ring-2 ring-aster-teal-400" : "ring-white/20"
          }`}
        >
          <Image src={image} alt={name} fill sizes="8rem" className="object-cover" />
        </div>
      </motion.div>
    </button>
  );
}
