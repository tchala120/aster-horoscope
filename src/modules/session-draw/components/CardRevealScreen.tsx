"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { CardArtworkTheme, TarotCard } from "@/shared";
import { durations, easings } from "@/foundation/ui/motion";
import { Fireworks } from "@/foundation/ui/components/Fireworks";

interface CardRevealScreenProps {
  /** The picked card, revealed after the mission is completed. */
  card: TarotCard | undefined;
  /** Which themed artwork to show (chosen randomly at reveal time). */
  theme: CardArtworkTheme;
  reducedMotion?: boolean;
  onDone: () => void;
}

/**
 * Post-completion reveal: shows the picked card's artwork, name, and meaning.
 * Shown after the player taps "I did it". The card swings in with a single-axis
 * rotateY entrance (0deg at rest, so the artwork never renders mirrored).
 */
export function CardRevealScreen({ card, theme, reducedMotion, onDone }: CardRevealScreenProps) {
  const imageUrl = card?.artwork[theme];

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <p className="text-text-sm font-semibold uppercase tracking-widest text-aster-teal-400">
        Mission complete — your card
      </p>

      <div className="relative flex items-center justify-center">
        {/* Burst of light synced to the flip reveal */}
        {!reducedMotion && (
          <motion.span
            aria-hidden
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0, 0.95, 0], scale: [0.5, 1.4, 1.75] }}
            transition={{ duration: durations.flip * 1.5, ease: easings.out, times: [0, 0.55, 1] }}
            className="pointer-events-none absolute -inset-10 rounded-full blur-2xl"
            style={{
              background:
                "radial-gradient(circle, rgba(255,255,255,0.55), rgba(51,204,173,0.35) 40%, transparent 70%)",
            }}
          />
        )}

        {/* Rainbow border ring: an oversized conic gradient, spun slowly and
            clipped by this wrapper's rounded corners + overflow-hidden, so
            only a thin ring shows right at the card's edge rather than a
            diffuse halo around it. The 3px padding is what reveals that
            ring — the card itself sits flush on top of everything else. */}
        <div className="relative aspect-[2/3] w-[21rem] max-w-[90vw] overflow-hidden rounded-2xl p-[3px] shadow-2xl">
          <span
            aria-hidden
            className={`pointer-events-none absolute -inset-1/2 ${reducedMotion ? "" : "animate-aura-rainbow"}`}
            style={{
              background:
                "conic-gradient(from 0deg, #ff3d81, #ff9d3d, #ffe93d, #3dffa1, #3dc8ff, #8a5dff, #ff3d81)",
            }}
          />

          <motion.div
            initial={reducedMotion ? false : { opacity: 0, scale: 0.85, rotateY: -90 }}
            animate={reducedMotion ? undefined : { opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: durations.flip, ease: easings.out }}
            style={{ transformPerspective: 1000 }}
            className="relative h-full w-full overflow-hidden rounded-2xl bg-grey-900"
          >
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={card?.name ?? "Tarot card"}
                fill
                priority
                className="object-cover"
                sizes="21rem"
              />
            ) : (
              <span aria-hidden className="block h-full w-full bg-brand-gradient" />
            )}
          </motion.div>
        </div>

        {/* Celebratory spark burst over the reveal */}
        {!reducedMotion && <Fireworks />}
      </div>

      {card ? (
        <div className="max-w-sm">
          <h2 className="text-heading-lg font-bold text-grey-50">{card.name}</h2>
          <p className="mt-2 text-text-md text-grey-300">{card.meaning}</p>
        </div>
      ) : null}

      <button
        type="button"
        onClick={onDone}
        className="rounded-full bg-brand-gradient px-8 py-3 text-text-md font-semibold text-grey-950 transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-sky-300"
      >
        Reveal reward
      </button>
    </div>
  );
}
