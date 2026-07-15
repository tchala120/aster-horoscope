"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import Image from "next/image";
import { motion, useSpring } from "framer-motion";

interface CardPadProps {
  image: string;
  name: string;
  /** "r,g,b" triplet for the lit glow. */
  glow: string;
  active: boolean;
  disabled: boolean;
  reducedMotion: boolean;
  /** Staggers the idle float so the cards don't bob in unison. */
  floatDelay?: number;
  onPress: () => void;
}

interface Sparkle {
  id: number;
  x: number; // % within the card
  y: number;
  size: number; // px
  color: string;
}

const SPARKLE_BASE_COLORS = ["#ffffff", "#ffe08a"];

/**
 * A "living" tarot-card pad: it gently levitates, tilts in 3D toward the pointer,
 * and every so often twinkles with a little charm-sparkle (random timing/place).
 * When it lights up (playback) or is tapped it jumps and wiggles. The lit glow is
 * the essential game signal, so it is NOT gated by reduced motion — only the
 * movement/sparkles are.
 */
export function CardPad({
  image,
  name,
  glow,
  active,
  disabled,
  reducedMotion,
  floatDelay = 0,
  onPress,
}: CardPadProps) {
  const rotateX = useSpring(0, { stiffness: 220, damping: 18 });
  const rotateY = useSpring(0, { stiffness: 220, damping: 18 });
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const idRef = useRef(0);

  function handleMove(e: PointerEvent<HTMLButtonElement>) {
    if (reducedMotion) return;
    const r = e.currentTarget.getBoundingClientRect();
    rotateY.set(((e.clientX - r.left) / r.width - 0.5) * 16);
    rotateX.set(-((e.clientY - r.top) / r.height - 0.5) * 16);
  }
  function resetTilt() {
    rotateX.set(0);
    rotateY.set(0);
  }

  // Occasional charm-sparkles at random spots + random intervals. Client-only
  // (so it never causes a hydration mismatch) and skipped for reduced motion.
  useEffect(() => {
    if (reducedMotion) return;
    let mounted = true;
    let nextTimer: ReturnType<typeof setTimeout>;
    const clearTimers: ReturnType<typeof setTimeout>[] = [];
    const palette = [...SPARKLE_BASE_COLORS, `rgb(${glow})`];

    const burst = () => {
      if (!mounted) return;
      const count = 1 + Math.floor(Math.random() * 2); // 1–2
      const created: Sparkle[] = Array.from({ length: count }, () => ({
        id: idRef.current++,
        x: 12 + Math.random() * 76,
        y: 12 + Math.random() * 76,
        size: 9 + Math.random() * 9,
        color: palette[Math.floor(Math.random() * palette.length)],
      }));
      setSparkles((s) => [...s, ...created]);
      const ids = new Set(created.map((c) => c.id));
      clearTimers.push(
        setTimeout(() => {
          if (mounted) setSparkles((s) => s.filter((sp) => !ids.has(sp.id)));
        }, 1200),
      );
      nextTimer = setTimeout(burst, 2600 + Math.random() * 4000); // 2.6–6.6s
    };

    // Random initial delay so the cards don't all twinkle together.
    nextTimer = setTimeout(burst, 500 + Math.random() * 3000);

    return () => {
      mounted = false;
      clearTimeout(nextTimer);
      clearTimers.forEach(clearTimeout);
    };
  }, [reducedMotion, glow]);

  return (
    <motion.button
      type="button"
      onClick={onPress}
      onPointerMove={handleMove}
      onPointerLeave={resetTilt}
      disabled={disabled}
      aria-label={name}
      aria-pressed={active}
      className="relative aspect-[3/4] w-full rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-default"
      style={{
        transformPerspective: 700,
        rotateX: reducedMotion ? 0 : rotateX,
        rotateY: reducedMotion ? 0 : rotateY,
        boxShadow: active ? `0 0 36px rgba(${glow},0.85)` : "none",
      }}
      animate={
        reducedMotion
          ? { scale: 1, y: 0, rotate: 0 }
          : active
            ? { scale: [1, 1.18, 1.1], y: [0, -14, -8], rotate: [0, -6, 6, 0] }
            : { scale: 1, y: [0, -5, 0], rotate: 0 }
      }
      transition={
        reducedMotion
          ? { duration: 0 }
          : active
            ? { duration: 0.5, ease: "easeOut" }
            : {
                y: { duration: 3.4, ease: "easeInOut", repeat: Infinity, delay: floatDelay },
                default: { duration: 0.3 },
              }
      }
    >
      {/* Clipped artwork */}
      <span className="absolute inset-0 overflow-hidden rounded-xl bg-grey-900 ring-1 ring-white/12">
        <Image src={image} alt="" fill sizes="8rem" className="object-cover" />
      </span>

      {/* Charm-sparkles (random, non-interactive, may peek past the edges) */}
      <span aria-hidden className="pointer-events-none absolute inset-0">
        {sparkles.map((s) => (
          <motion.span
            key={s.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 select-none leading-none"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              fontSize: s.size,
              color: s.color,
              textShadow: `0 0 7px ${s.color}`,
            }}
            initial={{ opacity: 0, scale: 0.3, rotate: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0.3, 1, 0.4], rotate: [0, 35], y: [0, -9] }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            {"\u2726"}
          </motion.span>
        ))}
      </span>

      {/* Lit signal: colored inner ring + tint, fades in when active. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-xl transition-opacity duration-150"
        style={{
          opacity: active ? 1 : 0,
          boxShadow: `inset 0 0 0 2px rgba(${glow},0.95)`,
          background: `radial-gradient(circle at 50% 40%, rgba(255,255,255,0.26), rgba(${glow},0.16) 55%, transparent 75%)`,
        }}
      />
    </motion.button>
  );
}
