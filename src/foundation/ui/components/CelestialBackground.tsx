"use client";

import { useMemo } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

interface Star {
  top: number;
  left: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
}

interface FallingStar {
  top: number;
  left: number;
  angle: number;
  length: number;
  duration: number;
  delay: number;
}

interface Sparkle {
  top: number;
  left: number;
  size: number;
  delay: number;
  duration: number;
  color: string;
}

/** A handful of fixed falling-star trajectories — deterministic, no seeded RNG needed for just a few. */
const FALLING_STARS: FallingStar[] = [
  { top: 12, left: 78, angle: 200, length: 110, duration: 9, delay: 0.5 },
  { top: 30, left: 55, angle: 205, length: 90, duration: 12, delay: 5 },
  { top: 8, left: 30, angle: 195, length: 130, duration: 14, delay: 9 },
];

/** Palette the ✦ magic-dust sparkles cycle through (brand teal/sky/gold/purple + white). */
const SPARKLE_COLORS = ["#47d4b4", "#66bfe2", "#ffe08a", "#b78bff", "#ffffff"];

/**
 * Deterministic star field so the server and client render identically
 * (a plain Math.random() would cause a hydration mismatch).
 */
// Browsers round numeric CSS values to ~6 significant figures when they
// reflect a parsed `style` attribute back into the DOM, but React compares
// the server HTML against the full-precision float computed on the client.
// Rounding here keeps both sides byte-identical so hydration never flags it.
const round4 = (n: number) => Math.round(n * 10000) / 10000;

function useStars(count: number, seed: number): Star[] {
  return useMemo(() => {
    // Pure sin-hash: deterministic pseudo-random with no mutable state.
    const rand = (n: number) => {
      const x = Math.sin(n * 12.9898 + seed) * 43758.5453;
      return x - Math.floor(x);
    };
    return Array.from({ length: count }, (_, i) => ({
      top: round4(rand(i * 6 + 1) * 100),
      left: round4(rand(i * 6 + 2) * 100),
      size: round4(1 + rand(i * 6 + 3) * 2.4),
      delay: round4(rand(i * 6 + 4) * 6),
      duration: round4(3 + rand(i * 6 + 5) * 5),
      opacity: round4(0.35 + rand(i * 6 + 6) * 0.6),
    }));
  }, [count, seed]);
}

function useSparkles(count: number, seed: number): Sparkle[] {
  return useMemo(() => {
    const rand = (n: number) => {
      const x = Math.sin(n * 12.9898 + seed) * 43758.5453;
      return x - Math.floor(x);
    };
    return Array.from({ length: count }, (_, i) => ({
      top: round4(rand(i * 6 + 1) * 100),
      left: round4(rand(i * 6 + 2) * 100),
      size: round4(8 + rand(i * 6 + 3) * 8),
      delay: round4(rand(i * 6 + 4) * 5),
      duration: round4(3 + rand(i * 6 + 5) * 3),
      color: SPARKLE_COLORS[i % SPARKLE_COLORS.length],
    }));
  }, [count, seed]);
}

/**
 * Ambient cosmic backdrop: a deep space wash, drifting aurora glows in the
 * brand palette, and a twinkling star field. Purely decorative and absolutely
 * positioned — drop it inside a `relative` container. Animations are disabled
 * under `prefers-reduced-motion` (see globals.css).
 */
export function CelestialBackground({ className = "" }: { className?: string }) {
  const stars = useStars(64, 20260714);
  const sparkles = useSparkles(16, 20260720);
  const reduced = useReducedMotion() ?? false;

  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden bg-grey-950 ${className}`}>
      {/* Deep cosmic base: planets, shooting star, and galaxy swirl */}
      <Image src="/landing-page/bg.png" alt="" fill priority sizes="100vw" className="animate-bg-twinkle object-cover" />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgba(10,11,15,0.35) 0%, rgba(10,11,15,0.15) 30%, rgba(10,11,15,0.55) 100%)" }}
      />

      {/* Star field */}
      {stars.map((star, i) => (
        <span
          key={i}
          className="animate-twinkle absolute rounded-full bg-white"
          style={{
            top: `${star.top}%`,
            left: `${star.left}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.duration}s`,
            boxShadow: "0 0 6px rgba(255,255,255,0.75)",
          }}
        />
      ))}

      {/* Magic-dust sparkles: ✦ glyphs that drift up and fade, echoing the
          AuthPanel hero's twinkle but spread across the whole backdrop. */}
      {!reduced &&
        sparkles.map((sp, i) => (
          <motion.span
            key={i}
            className="pointer-events-none absolute select-none leading-none"
            style={{
              top: `${sp.top}%`,
              left: `${sp.left}%`,
              fontSize: sp.size,
              color: sp.color,
              textShadow: `0 0 6px ${sp.color}`,
            }}
            animate={{
              y: [8, -12, 8],
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.5],
              rotate: [0, 25, 0],
            }}
            transition={{
              duration: sp.duration,
              ease: "easeInOut",
              repeat: Infinity,
              delay: sp.delay,
            }}
          >
            {"✦"}
          </motion.span>
        ))}

      {/* Falling stars: a rotated wrapper sets the trajectory angle; the inner
          trail animates translateX along that local axis so the two transforms
          don't collide. */}
      {FALLING_STARS.map((fs, i) => (
        <span
          key={i}
          className="absolute"
          style={{ top: `${fs.top}%`, left: `${fs.left}%`, transform: `rotate(${fs.angle}deg)` }}
        >
          <span
            className="animate-shooting-star block h-px rounded-full"
            style={{
              width: `${fs.length}px`,
              background: "linear-gradient(90deg, rgba(255,255,255,0.95), rgba(255,255,255,0))",
              boxShadow: "0 0 6px 1px rgba(255,255,255,0.7)",
              animationDuration: `${fs.duration}s`,
              animationDelay: `${fs.delay}s`,
            }}
          />
        </span>
      ))}
    </div>
  );
}
