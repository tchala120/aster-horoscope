"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { CardArtworkTheme } from "@/shared";
import { TAROT_DECK } from "@/data/deck";
import { CelestialBackground } from "@/foundation/ui/components/CelestialBackground";
import { CardPad } from "./components/CardPad";
import { useEchoesGame } from "./state/use-echoes-game";

const THEMES: readonly CardArtworkTheme[] = ["life", "love", "money", "work"];
const GLOWS = [
  "51,204,173", // teal
  "51,161,204", // sky
  "124,77,255", // purple
  "255,122,31", // orange
  "255,212,90", // gold
  "71,178,218", // light sky
  "103,191,226", // sky-300
  "183,139,255", // light purple
  "71,212,180", // teal-400
];

/** Nine fixed horoscope cards, one per pad (aligned by index with PAD_FREQS). */
const PADS = Array.from({ length: 9 }, (_, i) => {
  const card = TAROT_DECK[i];
  return {
    image: card.artwork[THEMES[i % THEMES.length]],
    name: card.name,
    glow: GLOWS[i],
  };
});

const STATUS: Record<string, string> = {
  idle: "Watch the cards, then echo them back",
  showing: "Watch closely…",
  input: "Your turn — echo the song",
  advancing: "Beautiful. One more…",
  over: "A card fell out of tune",
};

export function EchoesGame() {
  const reducedMotion = useReducedMotion() ?? false;
  const { phase, activePad, round, score, best, canPress, start, press } = useEchoesGame();

  const showStart = phase === "idle" || phase === "over";

  return (
    <main className="relative flex flex-1 flex-col">
      <CelestialBackground />

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col gap-5 p-6">
        <Link
          href="/"
          className="w-fit text-text-sm font-semibold text-aster-sky-300 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-sky-400"
        >
          ← Home
        </Link>

        <header className="text-center">
          <p className="text-text-sm font-semibold uppercase tracking-[0.2em] text-aster-teal-400">
            Mini-game
          </p>
          <h1 className="mt-1 text-heading-lg font-bold text-grey-50">Echoes of the Stars</h1>
          <p className="mt-2 text-text-md text-grey-400">{STATUS[phase]}</p>
        </header>

        {/* Scoreboard */}
        <div className="flex items-center justify-center gap-8 text-center">
          <div>
            <p className="text-text-sm uppercase tracking-widest text-grey-500">Round</p>
            <p className="text-heading-md font-bold text-grey-50">{round || "—"}</p>
          </div>
          <div>
            <p className="text-text-sm uppercase tracking-widest text-grey-500">Best</p>
            <p className="text-heading-md font-bold text-aster-teal-300">{best}</p>
          </div>
        </div>

        {/* 3×3 board */}
        <div className="grid grid-cols-3 gap-3">
          {PADS.map((p, i) => (
            <CardPad
              key={i}
              image={p.image}
              name={p.name}
              glow={p.glow}
              active={activePad === i}
              disabled={!canPress}
              reducedMotion={reducedMotion}
              onPress={() => press(i)}
            />
          ))}
        </div>

        {/* Start / game over */}
        {showStart && (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="text-center"
          >
            {phase === "over" && (
              <p className="mb-3 text-text-md text-grey-300">
                You echoed{" "}
                <span className="font-bold text-grey-50">
                  {score} {score === 1 ? "round" : "rounds"}
                </span>
                .
              </p>
            )}
            <button
              type="button"
              onClick={start}
              className="rounded-full bg-brand-gradient px-10 py-3 text-text-md font-semibold text-grey-950 transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              {phase === "over" ? "Try again" : "Start"}
            </button>
          </motion.div>
        )}
      </div>
    </main>
  );
}
