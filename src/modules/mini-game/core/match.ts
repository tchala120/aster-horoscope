import type { CardArtworkTheme } from "@/shared";
import { TAROT_DECK } from "@/data/deck";

/** A single board tile. Both tiles of a pair share the same `pairKey` + `image`. */
export interface Tile {
  /** Unique per tile (e.g. `the-star-a`). */
  id: string;
  /** Shared by the two tiles of a pair — used to detect a match. */
  pairKey: string;
  name: string;
  image: string;
  flipped: boolean;
  matched: boolean;
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
 * Deal `pairCount` pairs of shuffled tiles drawn from distinct tarot cards.
 * Each pair gets a themed artwork; both of its tiles share that image.
 */
export function dealTiles(pairCount: number, rng: Rng = Math.random): Tile[] {
  const chosen = shuffle(TAROT_DECK.slice(), rng).slice(0, pairCount);
  const tiles: Tile[] = [];
  chosen.forEach((card, i) => {
    const image = card.artwork[THEMES[i % THEMES.length]];
    const base = { pairKey: card.id, name: card.name, image, flipped: false, matched: false };
    tiles.push({ ...base, id: `${card.id}-a` }, { ...base, id: `${card.id}-b` });
  });
  return shuffle(tiles, rng);
}

/** Two tiles match when they belong to the same pair. */
export function isMatch(a: Tile, b: Tile): boolean {
  return a.pairKey === b.pairKey;
}
