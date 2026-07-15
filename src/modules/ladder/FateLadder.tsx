"use client";

import { motion, useReducedMotion } from "framer-motion";
import { TAROT_DECK } from "@/data/deck";
import { BackLink } from "@/foundation/ui/components/BackLink";
import { CardBack } from "@/foundation/ui/components/CardBack";
import { CelestialBackground } from "@/foundation/ui/components/CelestialBackground";
import { Fireworks } from "@/foundation/ui/components/Fireworks";
import { TarotFace } from "./components/TarotFace";
import { useLadderGame } from "./state/use-ladder-game";

const THEMES = ["life", "love", "money", "work"] as const;

function faceOf(rank: number) {
  const card = TAROT_DECK[rank];
  return { rank, name: card.name, image: card.artwork[THEMES[rank % THEMES.length]] };
}

export function FateLadder() {
  const reduced = useReducedMotion() ?? false;
  const { current, next, phase, revealed, result, streak, best, canGuess, guess, restart } =
    useLadderGame();

  const currentFace = faceOf(current);
  const nextFace = faceOf(next);
  const isRecord = phase === "over" && streak > 0 && streak >= best;

  return (
    <main className="relative flex flex-1 flex-col">
      <CelestialBackground />

      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col gap-5 p-6">
        <BackLink />

        <header className="text-center">
          <p className="text-text-sm font-semibold uppercase tracking-[0.2em] text-aster-teal-400">
            Mini-game
          </p>
          <h1 className="mt-1 text-heading-lg font-bold text-grey-50">Fate&apos;s Ladder</h1>
          <p className="mt-2 text-text-md text-grey-400">
            Will the next card rank <span className="font-semibold text-grey-200">higher</span> or{" "}
            <span className="font-semibold text-grey-200">lower</span> than{" "}
            <span className="font-bold text-aster-teal-300">{current}</span>?
          </p>
        </header>

        {/* Scoreboard */}
        <div className="flex items-center justify-center gap-8 text-center">
          <div>
            <p className="text-text-sm uppercase tracking-widest text-grey-500">Streak</p>
            <p className="text-heading-md font-bold text-grey-50">{streak}</p>
          </div>
          <div>
            <p className="text-text-sm uppercase tracking-widest text-grey-500">Best</p>
            <p className="text-heading-md font-bold text-aster-teal-300">{best}</p>
          </div>
        </div>

        {/* Cards */}
        <div className="flex items-start justify-center gap-4">
          <div className="flex flex-col items-center gap-2">
            <p className="text-text-sm text-grey-400">Your card</p>
            <div className="aspect-[2/3] w-40 max-w-[40vw]">
              <TarotFace rank={currentFace.rank} name={currentFace.name} image={currentFace.image} />
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <p className="text-text-sm text-grey-400">Next card</p>
            <div className="aspect-[2/3] w-40 max-w-[40vw]" style={{ perspective: 1000 }}>
              <motion.div
                className="relative h-full w-full"
                style={{ transformStyle: "preserve-3d" }}
                animate={{ rotateY: revealed ? 180 : 0 }}
                transition={reduced ? { duration: 0 } : { duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Face-down back — same artwork as the daily-draw spread */}
                <CardBack rounded="rounded-2xl" />

                {/* Revealed front */}
                <div
                  className="absolute inset-0 overflow-hidden rounded-2xl"
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  <TarotFace rank={nextFace.rank} name={nextFace.name} image={nextFace.image} />
                  {revealed && result && (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl"
                      style={{
                        boxShadow:
                          result === "correct"
                            ? "inset 0 0 0 3px #33ccad, 0 0 26px rgba(51,204,173,0.7)"
                            : "inset 0 0 0 3px #ef4444, 0 0 26px rgba(239,68,68,0.6)",
                      }}
                    >
                      <span
                        className="text-display-md font-bold"
                        style={{
                          color: result === "correct" ? "#6bdcbf" : "#ff6b6b",
                          textShadow: "0 2px 8px rgba(0,0,0,0.7)",
                        }}
                      >
                        {result === "correct" ? "\u2713" : "\u2717"}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Guess buttons */}
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={!canGuess}
            onClick={() => guess("lower")}
            className="flex w-36 items-center justify-center gap-1.5 rounded-full px-6 py-3 text-text-md font-semibold text-aster-sky-200 ring-1 ring-aster-sky-500/40 transition-colors enabled:hover:bg-aster-sky-500/16 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-sky-400"
          >
            {"\u25BC"} Lower
          </button>
          <button
            type="button"
            disabled={!canGuess}
            onClick={() => guess("higher")}
            className="flex w-36 items-center justify-center gap-1.5 rounded-full px-6 py-3 text-text-md font-semibold text-aster-teal-200 ring-1 ring-aster-teal-500/40 transition-colors enabled:hover:bg-aster-teal-500/16 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-teal-400"
          >
            {"\u25B2"} Higher
          </button>
        </div>
      </div>

      {/* Game over */}
      {phase === "over" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-grey-950/70 p-4 backdrop-blur-sm">
          {!reduced && isRecord && <Fireworks count={30} radius={210} />}
          <div className="relative z-10 w-full max-w-sm rounded-3xl bg-grey-gradient px-8 py-7 text-center ring-1 ring-white/10">
            <p className="text-text-sm font-semibold uppercase tracking-[0.2em] text-aster-teal-400">
              {isRecord ? "New best" : "The ladder breaks"}
            </p>
            <h2 className="mt-1 text-heading-lg font-bold text-grey-50">
              Streak of {streak}
            </h2>
            <p className="mt-2 text-text-md text-grey-300">
              Best streak: <span className="font-bold text-grey-50">{best}</span>
            </p>
            <button
              type="button"
              onClick={restart}
              className="mt-5 rounded-full bg-brand-gradient px-9 py-3 text-text-md font-semibold text-grey-950 transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              Climb again
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
