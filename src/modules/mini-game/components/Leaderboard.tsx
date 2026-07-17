"use client";

import type { MatchScore } from "@/shared";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface LeaderboardProps {
  scores: MatchScore[];
  /** Id of the viewer's just-set score, highlighted in the list. */
  highlightId?: string | null;
  loading?: boolean;
}

/** Tarot Match ranking board: rank, name, score (moves) and date. Fewest moves wins. */
export function Leaderboard({ scores, highlightId, loading }: LeaderboardProps) {
  return (
    <section className="rounded-2xl bg-grey-gradient p-5 ring-1 ring-white/8">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-heading-sm font-bold text-grey-50">Ranking</h2>
        <span className="text-text-sm text-grey-400">Fewest moves wins</span>
      </div>

      {loading ? (
        <p className="mt-4 text-text-sm text-grey-400">Loading…</p>
      ) : scores.length === 0 ? (
        <p className="mt-4 text-text-sm text-grey-400">
          No scores yet — win a game to claim the top spot.
        </p>
      ) : (
        <ol className="mt-4 flex flex-col gap-1.5">
          {scores.map((s, i) => {
            const mine = s.id === highlightId;
            return (
              <li
                key={s.id}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
                  mine ? "bg-aster-teal-500/15 ring-1 ring-aster-teal-400/50" : "bg-white/4"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    i === 0 ? "bg-brand-gradient text-grey-950" : "bg-white/8 text-grey-200"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-text-sm font-semibold text-grey-100">
                  {s.name}
                  {mine ? <span className="ml-1.5 text-aster-teal-300">(you)</span> : null}
                </span>
                <span className="shrink-0 text-text-sm font-bold text-aster-teal-300">
                  {s.moves} <span className="font-normal text-grey-400">moves</span>
                </span>
                <span className="hidden shrink-0 text-text-sm text-grey-500 sm:block">
                  {formatDate(s.createdAt)}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
