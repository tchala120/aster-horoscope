"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { CelestialBackground } from "@/foundation/ui/components/CelestialBackground";
import { Fireworks } from "@/foundation/ui/components/Fireworks";
import { MatchCard } from "./components/MatchCard";
import { useMatchGame } from "./state/use-match-game";

/**
 * Tarot Match — a memory/pairs mini-game. Flip two cards; matching pairs stay
 * face-up. Clear the board in as few moves as possible. Client-only, no login.
 */
export function MatchGame() {
  const reducedMotion = useReducedMotion() ?? false;
  const { tiles, moves, matches, totalPairs, locked, won, flip, restart } = useMatchGame();

  return (
    <main className="relative flex flex-1 flex-col">
      <CelestialBackground />

      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col gap-5 p-6">
        <Link
          href="/"
          className="w-fit text-text-sm font-semibold text-aster-sky-300 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-sky-400"
        >
          ← Home
        </Link>

        <header className="flex items-end justify-between gap-4">
          <div>
            <p className="text-text-sm font-semibold uppercase tracking-[0.2em] text-aster-teal-400">
              Tarot Match
            </p>
            <h1 className="mt-1 text-heading-lg font-bold text-grey-50">Find the pairs</h1>
          </div>
          <button
            type="button"
            onClick={restart}
            className="shrink-0 rounded-full bg-white/8 px-4 py-2 text-text-sm font-semibold text-grey-100 ring-1 ring-white/12 transition-colors hover:bg-white/16 focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-teal-400"
          >
            Shuffle
          </button>
        </header>

        {/* Scoreboard */}
        <div className="flex items-center gap-4 text-text-sm text-grey-300">
          <span>
            Moves <span className="font-bold text-grey-50">{moves}</span>
          </span>
          <span aria-hidden className="text-grey-600">
            ·
          </span>
          <span>
            Matched{" "}
            <span className="font-bold text-aster-teal-300">
              {matches}/{totalPairs}
            </span>
          </span>
        </div>

        {/* Board */}
        <div className="relative">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {tiles.map((tile, i) => (
              <MatchCard
                key={tile.id}
                image={tile.image}
                name={tile.name}
                faceUp={tile.flipped || tile.matched}
                matched={tile.matched}
                disabled={locked || tile.flipped || tile.matched}
                reducedMotion={reducedMotion}
                onFlip={() => flip(i)}
              />
            ))}
          </div>

          {/* Win celebration */}
          {won && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-grey-950/70 backdrop-blur-sm">
              {!reducedMotion && <Fireworks count={30} radius={200} />}
              <motion.div
                initial={reducedMotion ? false : { opacity: 0, scale: 0.85, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 220, damping: 20 }}
                className="relative z-10 mx-4 rounded-3xl bg-grey-gradient px-8 py-7 text-center ring-1 ring-white/10"
              >
                <p className="text-text-sm font-semibold uppercase tracking-[0.2em] text-aster-teal-400">
                  Reading complete
                </p>
                <h2 className="mt-1 text-heading-lg font-bold text-grey-50">You matched them all</h2>
                <p className="mt-2 text-text-md text-grey-300">
                  Cleared in <span className="font-bold text-grey-50">{moves}</span> moves.
                </p>
                <button
                  type="button"
                  onClick={restart}
                  className="mt-5 rounded-full bg-brand-gradient px-8 py-3 text-text-md font-semibold text-grey-950 transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  Play again
                </button>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
