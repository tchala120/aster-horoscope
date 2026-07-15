"use client";

import Image from "next/image";
import { motion } from "framer-motion";

interface CardPadProps {
  image: string;
  name: string;
  /** "r,g,b" triplet for the lit glow. */
  glow: string;
  active: boolean;
  disabled: boolean;
  reducedMotion: boolean;
  onPress: () => void;
}

/**
 * A tarot-card pad. It jumps and wiggles when it lights up (during playback) or
 * is tapped, so the artwork "comes alive". The glow overlay is the essential
 * lit signal, so it is NOT gated by reduced motion — only the bounce is.
 */
export function CardPad({ image, name, glow, active, disabled, reducedMotion, onPress }: CardPadProps) {
  return (
    <motion.button
      type="button"
      onClick={onPress}
      disabled={disabled}
      aria-label={name}
      aria-pressed={active}
      className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-grey-900 ring-1 ring-white/12 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-default"
      animate={
        reducedMotion
          ? { scale: 1 }
          : active
            ? { scale: [1, 1.16, 1.08], rotate: [0, -6, 6, -3, 0], y: [0, -12, -6] }
            : { scale: 1, rotate: 0, y: 0 }
      }
      transition={
        active
          ? { duration: 0.45, ease: "easeOut" }
          : { type: "spring", stiffness: 300, damping: 18 }
      }
      whileHover={disabled || reducedMotion ? undefined : { scale: 1.04 }}
      whileTap={disabled || reducedMotion ? undefined : { scale: 0.95 }}
    >
      <Image src={image} alt="" fill sizes="8rem" className="object-cover" />

      {/* Lit signal: colored ring + glow, fades in when active. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-xl transition-opacity duration-150"
        style={{
          opacity: active ? 1 : 0,
          boxShadow: `inset 0 0 0 2px rgba(${glow},0.95), 0 0 34px rgba(${glow},0.85)`,
          background: `radial-gradient(circle at 50% 40%, rgba(255,255,255,0.28), rgba(${glow},0.18) 55%, transparent 75%)`,
        }}
      />
    </motion.button>
  );
}
