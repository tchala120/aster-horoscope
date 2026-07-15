"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

interface FireworksProps {
  /** Number of spark particles in the burst. */
  count?: number;
  /** How far the sparks travel from center, in px. */
  radius?: number;
  className?: string;
  /** Seconds to wait before the burst begins (lets you stagger layered bursts). */
  delay?: number;
  /** Override the spark palette (e.g. to match a reward's rarity colors). */
  colors?: string[];
}

const COLORS = ["#33CCAD", "#33A1CC", "#FFFFFF", "#7C4DFF", "#FFC24B"];

interface Spark {
  x: number;
  y: number;
  color: string;
  size: number;
  delay: number;
}

/**
 * A one-shot celebratory spark burst that radiates from the center and drifts
 * down (gravity), then fades. Deterministic layout (no Math.random) so it's
 * SSR/hydration-safe. Purely decorative — drop inside a `relative` container.
 */
export function Fireworks({
  count = 24,
  radius = 180,
  className = "",
  delay = 0,
  colors = COLORS,
}: FireworksProps) {
  const sparks = useMemo<Spark[]>(() => {
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const jitter = Math.sin(i * 12.9898) * 0.5 + 0.5; // deterministic 0..1
      const dist = radius * (0.55 + jitter * 0.55);
      return {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        color: colors[i % colors.length],
        size: 5 + jitter * 5,
        delay: (i % 4) * 0.04,
      };
    });
  }, [count, radius, colors]);

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 flex items-center justify-center ${className}`}
    >
      {sparks.map((s, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            width: s.size,
            height: s.size,
            backgroundColor: s.color,
            boxShadow: `0 0 8px ${s.color}`,
          }}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0.5 }}
          animate={{
            opacity: [0, 1, 1, 0],
            x: [0, s.x * 0.7, s.x, s.x],
            y: [0, s.y * 0.7, s.y, s.y + 28], // arc + gravity droop
            scale: [0.5, 1.2, 1, 0.3],
          }}
          transition={{ duration: 1.2, ease: "easeOut", delay: delay + s.delay, times: [0, 0.2, 0.65, 1] }}
        />
      ))}
    </div>
  );
}
