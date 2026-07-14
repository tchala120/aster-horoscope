"use client";

import { useMemo } from "react";

interface Star {
  top: number;
  left: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
}

/**
 * Deterministic star field so the server and client render identically
 * (a plain Math.random() would cause a hydration mismatch).
 */
function useStars(count: number, seed: number): Star[] {
  return useMemo(() => {
    // Pure sin-hash: deterministic pseudo-random with no mutable state.
    const rand = (n: number) => {
      const x = Math.sin(n * 12.9898 + seed) * 43758.5453;
      return x - Math.floor(x);
    };
    return Array.from({ length: count }, (_, i) => ({
      top: rand(i * 6 + 1) * 100,
      left: rand(i * 6 + 2) * 100,
      size: 1 + rand(i * 6 + 3) * 2.4,
      delay: rand(i * 6 + 4) * 6,
      duration: 3 + rand(i * 6 + 5) * 5,
      opacity: 0.35 + rand(i * 6 + 6) * 0.6,
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

  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {/* Deep cosmic base */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(125% 90% at 50% -10%, #1a2740 0%, #10141f 48%, #0a0b0f 100%)",
        }}
      />

      {/* Aurora glows */}
      <div
        className="animate-aurora absolute left-[8%] right-[8%] top-[-10%] h-[48vh] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(51,204,173,0.30), transparent 65%)" }}
      />
      <div
        className="animate-aurora-slow absolute left-[-6%] top-[36%] h-[42vh] w-[52vw] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(51,161,204,0.24), transparent 68%)" }}
      />
      <div
        className="animate-aurora-slow2 absolute bottom-[2%] right-[-6%] h-[40vh] w-[48vw] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(124,77,255,0.20), transparent 70%)" }}
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
    </div>
  );
}
