"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

/** Animates a number counting up from its previous value to `target`. */
function useCountUp(target: number, durationMs = 900): number {
  const [value, setValue] = useState(target);
  const from = useRef(target);

  useEffect(() => {
    const start = from.current;
    const startTime = performance.now();
    let raf: number;
    const tick = (t: number) => {
      const progress = Math.min(1, (t - startTime) / durationMs);
      const eased = 1 - (1 - progress) ** 3;
      setValue(start + (target - start) * eased);
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        from.current = target;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return value;
}

/** Sparkle glyphs that drift and fade around the hero coin (deterministic layout). */
const HERO_SPARKLES = [
  { left: "6%", top: "14%", size: 12, delay: 0, dur: 3.4, color: "#47d4b4" },
  { left: "88%", top: "22%", size: 10, delay: 0.6, dur: 4.0, color: "#b78bff" },
  { left: "16%", top: "70%", size: 9, delay: 1.3, dur: 3.7, color: "#ffe08a" },
  { left: "80%", top: "76%", size: 11, delay: 0.9, dur: 4.3, color: "#66bfe2" },
] as const;

function StatColumn({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-text-sm font-bold uppercase tracking-wide text-aster-teal-400">{label}</p>
      <p className="mt-1 text-heading-md font-bold text-grey-50 tabular-nums">{value}</p>
    </div>
  );
}

interface StakingHeroProps {
  aprPercent: number | undefined;
  totalStakedTokens: number | undefined;
  lockDays: number | undefined;
  onStakeClick: () => void;
}

/** Hero banner: badge, headline, animated APR/TVL/lock stats, Stake CTA, floating coin art. */
export function StakingHero({ aprPercent, totalStakedTokens, lockDays, onStakeClick }: StakingHeroProps) {
  const reduced = useReducedMotion() ?? false;
  const apr = useCountUp(aprPercent ?? 0);
  const staked = useCountUp(totalStakedTokens ?? 0);

  const fadeUp = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const, delay },
        };

  return (
    <section className="relative flex flex-col items-center overflow-hidden rounded-3xl bg-grey-900/70 px-6 py-10 text-center ring-1 ring-white/8 backdrop-blur-xl sm:py-14">
      <motion.span
        {...fadeUp(0)}
        className="inline-flex items-center gap-2 rounded-full bg-grey-950/70 px-4 py-1.5 text-text-sm font-semibold text-grey-300 ring-1 ring-white/12"
      >
        <span aria-hidden>⚡</span> Built on Sepolia
      </motion.span>

      <motion.h1
        {...fadeUp(0.08)}
        className="mt-6 bg-brand-gradient bg-clip-text text-[2rem] font-bold leading-tight text-transparent sm:text-[2.75rem]"
      >
        Fixed APR
      </motion.h1>
      <motion.h2
        {...fadeUp(0.14)}
        className="text-[2rem] font-bold leading-tight text-grey-50 sm:text-[2.75rem]"
      >
        Staking Rewards
      </motion.h2>

      <motion.p {...fadeUp(0.2)} className="mt-3 max-w-sm text-text-md text-grey-400">
        Lock HP in the pool and earn a fixed reward — no surprises.
      </motion.p>

      <motion.div {...fadeUp(0.28)} className="mt-8 flex items-center justify-center gap-8 sm:gap-12">
        <StatColumn
          label="Total staked"
          value={
            totalStakedTokens === undefined
              ? "…"
              : `${staked.toLocaleString(undefined, { maximumFractionDigits: 2 })} HP`
          }
        />
        <StatColumn
          label="APR"
          value={aprPercent === undefined ? "…" : `${apr.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`}
        />
        <StatColumn label="Lock" value={lockDays === undefined ? "…" : `${lockDays}d`} />
      </motion.div>

      <motion.button
        {...fadeUp(0.34)}
        type="button"
        onClick={onStakeClick}
        whileHover={reduced ? undefined : { scale: 1.05 }}
        whileTap={reduced ? undefined : { scale: 0.97 }}
        className="mt-8 rounded-full bg-brand-gradient px-8 py-3.5 text-text-md font-semibold text-grey-950 shadow-lg"
      >
        Stake Now
      </motion.button>

      {/* Floating coin art with glow + drifting sparkles. */}
      <motion.div
        {...fadeUp(0.4)}
        className="relative mt-10 flex h-36 w-36 items-center justify-center sm:h-44 sm:w-44"
      >
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(255,196,64,0.45), transparent 70%)" }}
          animate={reduced ? undefined : { opacity: [0.6, 1, 0.6], scale: [1, 1.08, 1] }}
          transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
        />
        <motion.div
          className="relative h-28 w-28 sm:h-36 sm:w-36"
          animate={reduced ? undefined : { y: [0, -10, 0] }}
          transition={{ duration: 3.4, ease: "easeInOut", repeat: Infinity }}
        >
          <Image src="/tokens/happy.png" alt="" fill sizes="9rem" className="object-contain" />
        </motion.div>

        {!reduced &&
          HERO_SPARKLES.map((s, i) => (
            <motion.span
              key={i}
              aria-hidden
              className="pointer-events-none absolute select-none leading-none"
              style={{
                left: s.left,
                top: s.top,
                fontSize: s.size,
                color: s.color,
                textShadow: `0 0 6px ${s.color}`,
              }}
              animate={{
                y: [8, -12, 8],
                opacity: [0, 1, 0],
                scale: [0.5, 1, 0.5],
                rotate: [0, 25, 0],
              }}
              transition={{ duration: s.dur, ease: "easeInOut", repeat: Infinity, delay: s.delay }}
            >
              {"✦"}
            </motion.span>
          ))}
      </motion.div>
    </section>
  );
}
