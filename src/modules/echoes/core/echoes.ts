import type { CardArtworkTheme } from "@/shared";
import { TAROT_DECK } from "@/data/deck";

/** Number of card pads on the board (3×3). */
export const PAD_COUNT = 9;

/**
 * One pleasant note per pad (C-major pentatonic, ascending) so any sequence
 * sounds harmonious. Must stay the same length as PAD_COUNT.
 */
export const PAD_FREQS = [
  523.25, // C5
  587.33, // D5
  659.25, // E5
  783.99, // G5
  880.0, // A5
  1046.5, // C6
  1174.66, // D6
  1318.51, // E6
  1567.98, // G6
];

/** Game phases: idle → showing (playback) → input → advancing → (loop) / over. */
export type Phase = "idle" | "showing" | "input" | "advancing" | "over";

/** A card face shown on a pad. */
export interface PadCard {
  image: string;
  name: string;
}

/** Random source in [0, 1). Injected so the first deal can be deterministic. */
export type Rng = () => number;

/** Deterministic LCG — used for the initial deal so SSR and client agree. */
export function seededRng(seed: number): Rng {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const THEMES: readonly CardArtworkTheme[] = ["life", "love", "money", "work"];

function shuffle<T>(items: T[], rng: Rng): T[] {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Deal PAD_COUNT distinct card faces (random cards + random themes), ensuring
 * no two pads share the same artwork so the board is always visually varied.
 */
export function dealCards(rng: Rng = Math.random): PadCard[] {
  const deck = shuffle(TAROT_DECK.slice(), rng);
  const used = new Set<string>();
  const pads: PadCard[] = [];
  for (const card of deck) {
    if (pads.length >= PAD_COUNT) break;
    const theme = THEMES[Math.floor(rng() * THEMES.length)];
    const image = card.artwork[theme];
    if (used.has(image)) continue;
    used.add(image);
    pads.push({ image, name: card.name });
  }
  return pads;
}

/** A random pad index in [0, PAD_COUNT). */
export function randomStep(rng: Rng = Math.random): number {
  return Math.floor(rng() * PAD_COUNT);
}
