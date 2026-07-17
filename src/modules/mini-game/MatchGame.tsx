"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { MatchScore } from "@/shared";
import { AmbientMusic } from "@/foundation/ui/components/AmbientMusic";
import { BackLink } from "@/foundation/ui/components/BackLink";
import { CelestialBackground } from "@/foundation/ui/components/CelestialBackground";
import { Fireworks } from "@/foundation/ui/components/Fireworks";
import { Leaderboard } from "./components/Leaderboard";
import { MatchCard } from "./components/MatchCard";
import { leaderboardApi } from "./state/leaderboard-api";
import { useMatchGame } from "./state/use-match-game";

/**
 * Tarot Match — a memory/pairs mini-game. Flip two cards; matching pairs stay
 * face-up. Clear the board in as few moves as possible. Client-only, no login.
 */
export function MatchGame() {
  const reducedMotion = useReducedMotion() ?? false;
  const { tiles, moves, matches, totalPairs, locked, won, flip, restart } = useMatchGame();

  // Ranking board: load on mount, submit the score when a game is won.
  const [scores, setScores] = useState<MatchScore[]>([]);
  const [loadingScores, setLoadingScores] = useState(true);
  const [myScoreId, setMyScoreId] = useState<string | null>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    let active = true;
    void leaderboardApi.top().then((res) => {
      if (!active) return;
      setLoadingScores(false);
      if (res.ok) setScores(res.value.scores);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!won || submittedRef.current) return;
    submittedRef.current = true;
    void leaderboardApi.submit(moves).then((res) => {
      if (res.ok) {
        setScores(res.value.scores);
        setMyScoreId(res.value.yourScoreId ?? null);
      }
    });
  }, [won, moves]);

  // Start a fresh game: clear the ranking highlight and allow the next submit.
  const handleRestart = () => {
    submittedRef.current = false;
    setMyScoreId(null);
    restart();
  };

  return (
    <main className="relative flex flex-1 flex-col">
      <CelestialBackground />
      <AmbientMusic src="/sound/adventure.mp3" />

      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 p-6">
        <BackLink />

        <header className="flex items-end justify-between gap-4">
          <div>
            <p className="text-text-sm font-semibold uppercase tracking-[0.2em] text-aster-teal-400">
              Tarot Match
            </p>
            <h1 className="mt-1 text-heading-lg font-bold text-grey-50">Find the pairs</h1>
          </div>
          <button
            type="button"
            onClick={handleRestart}
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

        {/* Board — 6 columns, scaled up 1.2x on large screens */}
        <div className="relative lg:-ml-[10%] lg:w-[120%]">
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
            {tiles.map((tile, i) => (
              <MatchCard
                key={tile.id}
                index={i}
                image={tile.image}
                name={tile.name}
                faceUp={tile.flipped || tile.matched}
                matched={tile.matched}
                wrong={locked && tile.flipped && !tile.matched}
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
                  onClick={handleRestart}
                  className="mt-5 rounded-full bg-brand-gradient px-8 py-3 text-text-md font-semibold text-grey-950 transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  Play again
                </button>
              </motion.div>
            </div>
          )}
        </div>

        <Leaderboard scores={scores} highlightId={myScoreId} loading={loadingScores} />
      </div>
    </main>
  );
}
