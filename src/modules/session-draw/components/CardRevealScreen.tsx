"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { TarotCard } from "@/shared";
import { durations, easings } from "@/foundation/ui/motion";

interface CardRevealScreenProps {
  /** The picked card, revealed after the mission is completed. */
  card: TarotCard | undefined;
  reducedMotion?: boolean;
  onDone: () => void;
}

/**
 * Post-completion reveal: shows the picked card's artwork, name, and meaning.
 * Shown after the player taps "I did it". The card swings in with a single-axis
 * rotateY entrance (0deg at rest, so the artwork never renders mirrored).
 */
export function CardRevealScreen({ card, reducedMotion, onDone }: CardRevealScreenProps) {
  const imageUrl = card?.artwork.love;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <p className="text-text-sm font-semibold uppercase tracking-widest text-aster-teal-400">
        Mission complete — your card
      </p>

      <motion.div
        initial={reducedMotion ? false : { opacity: 0, scale: 0.85, rotateY: -90 }}
        animate={reducedMotion ? undefined : { opacity: 1, scale: 1, rotateY: 0 }}
        transition={{ duration: durations.flip, ease: easings.out }}
        style={{ transformPerspective: 1000 }}
        className="relative aspect-[2/3] w-56 max-w-[70vw] overflow-hidden rounded-2xl bg-grey-900 ring-1 ring-white/16 shadow-2xl"
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={card?.name ?? "Tarot card"}
            fill
            priority
            className="object-cover"
            sizes="14rem"
          />
        ) : (
          <span aria-hidden className="block h-full w-full bg-brand-gradient" />
        )}
      </motion.div>

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
        Continue
      </button>
    </div>
  );
}
