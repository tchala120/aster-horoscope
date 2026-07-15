import { TAROT_DECK } from "@/data/deck";

/** Ranks are indices into the 22 major-arcana deck (The Fool = 0 … The World = 21). */
export const DECK_SIZE = TAROT_DECK.length;

export type Rng = () => number;
export type Guess = "higher" | "lower";

/** Deterministic LCG — used for the first deal so SSR and client agree. */
export function seededRng(seed: number): Rng {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** A random rank in [0, DECK_SIZE), optionally different from `exclude`. */
export function drawRank(rng: Rng = Math.random, exclude?: number): number {
  const pick = () => Math.min(DECK_SIZE - 1, Math.floor(rng() * DECK_SIZE));
  let r = pick();
  if (exclude === undefined) return r;
  let guard = 0;
  while (r === exclude && guard++ < 64) r = pick();
  if (r === exclude) r = (exclude + 1) % DECK_SIZE;
  return r;
}

/** Whether the guess about `next` relative to `current` is correct. */
export function isCorrect(guess: Guess, current: number, next: number): boolean {
  return guess === "higher" ? next > current : next < current;
}
