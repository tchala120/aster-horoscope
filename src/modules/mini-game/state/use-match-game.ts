"use client";

import { useEffect, useMemo, useReducer, useRef } from "react";
import { playClip, preloadClip } from "@/foundation/ui/sound";
import { dealTiles, isMatch, seededRng, type Tile } from "../core/match";

export type { Tile } from "../core/match";

/** Number of pairs on the board (18 tiles → 4×5 mobile / 6×3 desktop grid). */
export const PAIRS = 9;
/** Fixed seed for the first deal so server + client render identically. */
const INITIAL_SEED = 20260715;
/** How long a mismatched pair stays revealed before flipping back (ms). */
const FLIP_BACK_MS = 900;
/** Cheerful cue played on each successful pair. */
const MATCH_SOUND = "/sound/happy.mp3";

interface State {
  tiles: Tile[];
  firstIndex: number | null;
  moves: number;
  locked: boolean;
}

type Action =
  | { type: "deal"; tiles: Tile[] }
  | { type: "flip"; index: number }
  | { type: "resolve" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "deal":
      return { tiles: action.tiles, firstIndex: null, moves: 0, locked: false };

    case "flip": {
      const tile = state.tiles[action.index];
      if (state.locked || !tile || tile.flipped || tile.matched) return state;

      const tiles = state.tiles.map((t, i) =>
        i === action.index ? { ...t, flipped: true } : t,
      );

      // First card of a pair.
      if (state.firstIndex === null) {
        return { ...state, tiles, firstIndex: action.index };
      }

      // Second card — score the attempt.
      const first = tiles[state.firstIndex];
      const second = tiles[action.index];
      if (isMatch(first, second)) {
        const settled = tiles.map((t) =>
          t.id === first.id || t.id === second.id ? { ...t, matched: true } : t,
        );
        return { ...state, tiles: settled, firstIndex: null, moves: state.moves + 1 };
      }
      // Mismatch — lock the board until `resolve` flips them back.
      return { ...state, tiles, firstIndex: null, moves: state.moves + 1, locked: true };
    }

    case "resolve":
      return {
        ...state,
        tiles: state.tiles.map((t) => (t.matched ? t : { ...t, flipped: false })),
        locked: false,
      };

    default:
      return state;
  }
}

/**
 * Tarot Match game state. The first deal is deterministic (hydration-safe);
 * restart reshuffles randomly. Mismatched pairs auto-flip-back after a beat.
 */
export function useMatchGame() {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    tiles: dealTiles(PAIRS, seededRng(INITIAL_SEED)),
    firstIndex: null,
    moves: 0,
    locked: false,
  }));

  // Flip mismatched pairs back after a short delay.
  useEffect(() => {
    if (!state.locked) return;
    const timer = setTimeout(() => dispatch({ type: "resolve" }), FLIP_BACK_MS);
    return () => clearTimeout(timer);
  }, [state.locked]);

  const matches = useMemo(
    () => state.tiles.filter((t) => t.matched).length / 2,
    [state.tiles],
  );
  const won = state.tiles.length > 0 && matches === state.tiles.length / 2;

  // Cheer with a happy clip whenever the matched count rises (not on restart).
  useEffect(() => {
    preloadClip(MATCH_SOUND);
  }, []);

  const prevMatches = useRef(matches);
  useEffect(() => {
    if (matches > prevMatches.current) playClip(MATCH_SOUND);
    prevMatches.current = matches;
  }, [matches]);

  return {
    tiles: state.tiles,
    moves: state.moves,
    matches,
    totalPairs: PAIRS,
    locked: state.locked,
    won,
    flip: (index: number) => dispatch({ type: "flip", index }),
    restart: () => dispatch({ type: "deal", tiles: dealTiles(PAIRS) }),
  };
}
