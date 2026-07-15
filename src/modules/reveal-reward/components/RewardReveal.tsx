"use client";

import { useEffect, useRef } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import type { RewardOutcome } from "@/shared";
import { Fireworks } from "@/foundation/ui/components/Fireworks";
import { playRewardFanfare } from "@/foundation/ui/sound";
import { useRewardDisplay } from "../state/use-reward-display";

interface RewardRevealProps {
  /** The granted reward returned by a successful completion. */
  reward: RewardOutcome;
  reducedMotion?: boolean;
  /** Called when the player collects/dismisses the reward. */
  onClose: () => void;
}

interface Tier {
  label: string;
  /** Gradient start (lighter). */
  from: string;
  /** Gradient end (deeper). */
  to: string;
  /** "r,g,b" triplet used for glows/scrims. */
  glow: string;
  /** Spark palette for the firework bursts. */
  sparks: string[];
}

/** Per-rarity theming. Rarer (higher-value) rewards get warmer, more radiant hues. */
const TIERS: Record<"common" | "rare" | "epic" | "legendary", Tier> = {
  common: {
    label: "Common",
    from: "#6bdcbf",
    to: "#33a1cc",
    glow: "51,204,173",
    sparks: ["#33CCAD", "#33A1CC", "#6bdcbf", "#FFFFFF"],
  },
  rare: {
    label: "Rare",
    from: "#57c3ea",
    to: "#7c4dff",
    glow: "51,161,204",
    sparks: ["#33A1CC", "#57c3ea", "#7c4dff", "#FFFFFF"],
  },
  epic: {
    label: "Epic",
    from: "#b78bff",
    to: "#7c4dff",
    glow: "124,77,255",
    sparks: ["#7c4dff", "#b78bff", "#33A1CC", "#FFFFFF"],
  },
  legendary: {
    label: "Legendary",
    from: "#ffe08a",
    to: "#ff7a1f",
    glow: "255,196,75",
    sparks: ["#FFE08A", "#FFC24B", "#ff7a1f", "#FFFFFF"],
  },
};

/** Animated number that ticks up to the final value (or shows it instantly when reduced). */
function CountUp({ to, reducedMotion }: { to: number; reducedMotion: boolean }) {
  const mv = useMotionValue(reducedMotion ? to : 0);
  const text = useTransform(mv, (v) => Math.round(v).toString());

  useEffect(() => {
    if (reducedMotion) {
      mv.set(to);
      return;
    }
    const controls = animate(mv, to, { duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 });
    return () => controls.stop();
  }, [to, reducedMotion, mv]);

  return <motion.span>{text}</motion.span>;
}

/**
 * Celebratory reward pop-up shown after the card reveal. Themed by rarity, with
 * rotating light rays, a glowing medallion, a value count-up, and layered
 * firework bursts. Accessible (role=dialog, Escape/backdrop close, focuses the
 * CTA) and fully static under reduced motion.
 */
export function RewardReveal({ reward, reducedMotion = false, onClose }: RewardRevealProps) {
  const display = useRewardDisplay(reward);
  const tier = TIERS[display.rarity];
  const granted = display.value !== null;
  const glyph = display.unit === "percent" ? "%" : "\u2726"; // ✦
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Triumphant fanfare when the reward appears — grander for rarer rewards.
  // Skipped for reduced-motion users, matching the hover-chime convention.
  useEffect(() => {
    if (reducedMotion) return;
    playRewardFanfare(display.rarityRatio);
  }, [reducedMotion, display.rarityRatio]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex min-h-full items-center justify-center overflow-y-auto p-4"
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      onClick={onClose}
    >
      {/* Scrim + ambient rarity glow */}
      <div aria-hidden className="fixed inset-0 bg-black/75 backdrop-blur-sm" />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{ background: `radial-gradient(60% 50% at 50% 42%, rgba(${tier.glow},0.28), transparent 70%)` }}
      />

      <div className="relative my-auto" onClick={(e) => e.stopPropagation()}>
        {/* Rotating light rays behind the card */}
        {!reducedMotion && (
          <span
            aria-hidden
            className="animate-reward-rays pointer-events-none absolute left-1/2 top-1/2 h-[150%] w-[150%]"
            style={{
              background: `repeating-conic-gradient(from 0deg, rgba(${tier.glow},0.30) 0deg 2.5deg, transparent 2.5deg 20deg)`,
              maskImage: "radial-gradient(circle, #000 6%, transparent 66%)",
              WebkitMaskImage: "radial-gradient(circle, #000 6%, transparent 66%)",
            }}
          />
        )}

        {/* Prize card with a rarity-tinted gradient border + outer glow */}
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={granted ? `You earned ${display.headline}` : display.headline}
          className="relative z-10 w-[min(22rem,92vw)] rounded-3xl p-[1.5px]"
          style={{
            backgroundImage: `linear-gradient(155deg, rgba(${tier.glow},0.95), rgba(255,255,255,0.14) 42%, rgba(${tier.glow},0.55))`,
            boxShadow: `0 24px 90px -24px rgba(${tier.glow},0.75)`,
          }}
          initial={reducedMotion ? false : { opacity: 0, scale: 0.82, y: 26 }}
          animate={reducedMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 20 }}
        >
          <div className="relative overflow-hidden rounded-[calc(1.5rem-1.5px)] bg-grey-950/85 px-7 py-8 text-center backdrop-blur-xl">
            {/* Top sheen */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-24"
              style={{ background: `linear-gradient(180deg, rgba(${tier.glow},0.18), transparent)` }}
            />

            <div className="relative flex flex-col items-center gap-4">
              {/* Rarity badge */}
              {granted && (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-text-sm font-bold uppercase tracking-[0.18em]"
                  style={{
                    color: tier.from,
                    backgroundColor: `rgba(${tier.glow},0.14)`,
                    boxShadow: `inset 0 0 0 1px rgba(${tier.glow},0.45)`,
                  }}
                >
                  <span aria-hidden>{"\u2726"}</span>
                  {tier.label}
                </span>
              )}

              {/* Medallion */}
              <div className="relative mt-1 h-24 w-24">
                <span
                  aria-hidden
                  className={`absolute -inset-3 rounded-full blur-xl ${reducedMotion ? "" : "animate-aura-pulse"}`}
                  style={{ background: `radial-gradient(circle, rgba(${tier.glow},0.6), transparent 70%)` }}
                />
                <div
                  className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full"
                  style={{
                    background: `radial-gradient(circle at 32% 26%, ${tier.from}, ${tier.to})`,
                    boxShadow: `0 10px 30px -6px rgba(${tier.glow},0.7), inset 0 2px 10px rgba(255,255,255,0.5), inset 0 -8px 16px rgba(0,0,0,0.25)`,
                  }}
                >
                  <span
                    aria-hidden
                    className="text-heading-lg font-bold text-white"
                    style={{ textShadow: "0 2px 6px rgba(0,0,0,0.35)" }}
                  >
                    {glyph}
                  </span>
                  {!reducedMotion && (
                    <span
                      aria-hidden
                      className="animate-reward-shine absolute -inset-y-4 left-0 w-1/3 bg-white/45 blur-md"
                    />
                  )}
                </div>
              </div>

              {/* Eyebrow */}
              <p className="text-text-sm font-semibold uppercase tracking-[0.22em] text-grey-400">
                {granted ? "You earned" : "Result"}
              </p>

              {/* Value */}
              <div
                aria-hidden
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: `linear-gradient(92deg, ${tier.from}, ${tier.to})` }}
              >
                {granted ? (
                  <span className="text-[2.75rem] font-bold leading-none tracking-tight sm:text-[3.4rem]">
                    <CountUp to={display.value as number} reducedMotion={reducedMotion} />
                    {display.unit === "percent" ? (
                      "%"
                    ) : (
                      <span className="ml-1.5 align-baseline text-heading-sm font-bold sm:text-heading-md">
                        ASTR
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-heading-lg font-bold">{display.headline}</span>
                )}
              </div>

              {/* Detail */}
              <p className="max-w-[16rem] text-text-md text-grey-300">{display.detail}</p>

              {/* Collect */}
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                className="group relative mt-2 overflow-hidden rounded-full bg-brand-gradient px-9 py-3 text-text-md font-semibold text-grey-950 outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-white/70"
              >
                <span className="relative z-10">Collect reward</span>
                {!reducedMotion && (
                  <span
                    aria-hidden
                    className="animate-reward-shine absolute inset-y-0 left-0 w-1/3 bg-white/50 blur-sm"
                  />
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Firework bursts over (and beyond) the card — not clipped. */}
        {!reducedMotion && (
          <>
            <Fireworks count={30} radius={190} colors={tier.sparks} />
            <Fireworks count={18} radius={120} delay={0.55} colors={tier.sparks} />
          </>
        )}
      </div>
    </motion.div>
  );
}
