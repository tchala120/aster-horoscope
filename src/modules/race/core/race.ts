import { TAROT_DECK } from "@/data/deck";

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;

/** Distinct player token colors (index = seat). */
export const TOKENS = [
  { color: "#33ccad", label: "Teal" },
  { color: "#33a1cc", label: "Sky" },
  { color: "#b78bff", label: "Violet" },
  { color: "#ff7a1f", label: "Amber" },
  { color: "#ffd45a", label: "Gold" },
  { color: "#ff5a8a", label: "Rose" },
] as const;

export type EffectKind = "none" | "forward" | "back" | "again" | "skip" | "swap";

export interface SpaceDef {
  rank: number;
  name: string;
  effect: EffectKind;
  amount: number;
  blurb: string;
}

export interface PlayerCard {
  name: string;
  image: string;
  color: string;
  label: string;
}

/** Six distinct arcana used as player pawns (each a different artwork). */
const PLAYER_ARCANA = [1, 2, 3, 4, 17, 19]; // Magician, High Priestess, Empress, Emperor, Star, Sun
const PLAYER_THEMES = ["life", "love", "money", "work", "life", "love"] as const;

export const PLAYER_CARDS: readonly PlayerCard[] = PLAYER_ARCANA.map((rank, i) => {
  const card = TAROT_DECK[rank];
  return {
    name: card.name,
    image: card.artwork[PLAYER_THEMES[i]],
    color: TOKENS[i].color,
    label: TOKENS[i].label,
  };
});

// ---- Difficulty ------------------------------------------------------------

export type DifficultyId = "easy" | "medium" | "hard";

interface EventSpec {
  effect: EffectKind;
  amount: number;
}

export interface Difficulty {
  id: DifficultyId;
  /** Work-themed label for the tier. */
  label: string;
  tagline: string;
  /** Number of board spaces (0 … size-1). The last space is the goal. */
  size: number;
  /** Pool of events placed on the interior spaces. */
  events: EventSpec[];
}

// Gentle: short trail, few and small hazards, generous boosts.
const EASY_EVENTS: EventSpec[] = [
  { effect: "forward", amount: 3 },
  { effect: "forward", amount: 2 },
  { effect: "forward", amount: 2 },
  { effect: "again", amount: 0 },
  { effect: "swap", amount: 0 },
  { effect: "back", amount: 2 },
  { effect: "back", amount: 1 },
  { effect: "skip", amount: 0 },
];

// Balanced: even mix of boosts and setbacks.
const MEDIUM_EVENTS: EventSpec[] = [
  { effect: "forward", amount: 3 },
  { effect: "forward", amount: 2 },
  { effect: "again", amount: 0 },
  { effect: "swap", amount: 0 },
  { effect: "skip", amount: 0 },
  { effect: "back", amount: 4 },
  { effect: "back", amount: 3 },
  { effect: "back", amount: 2 },
];

// Brutal: long road, many big pitfalls, slim boosts.
const HARD_EVENTS: EventSpec[] = [
  { effect: "forward", amount: 2 },
  { effect: "forward", amount: 1 },
  { effect: "again", amount: 0 },
  { effect: "swap", amount: 0 },
  { effect: "swap", amount: 0 },
  { effect: "skip", amount: 0 },
  { effect: "skip", amount: 0 },
  { effect: "back", amount: 6 },
  { effect: "back", amount: 5 },
  { effect: "back", amount: 4 },
  { effect: "back", amount: 4 },
  { effect: "back", amount: 3 },
  { effect: "back", amount: 2 },
];

export const DIFFICULTIES: readonly Difficulty[] = [
  { id: "easy", label: "Intern", tagline: "A short trail with few hazards.", size: 20, events: EASY_EVENTS },
  { id: "medium", label: "Manager", tagline: "A balanced road of boosts and pitfalls.", size: 24, events: MEDIUM_EVENTS },
  { id: "hard", label: "Executive", tagline: "A long road riddled with pitfalls.", size: 30, events: HARD_EVENTS },
];

export function getDifficulty(id: DifficultyId): Difficulty {
  return DIFFICULTIES.find((d) => d.id === id) ?? DIFFICULTIES[1];
}

// ---- Board -----------------------------------------------------------------

const EVENT_TITLE: Record<Exclude<EffectKind, "none">, string> = {
  forward: "Leap",
  back: "Pitfall",
  again: "Fortune",
  skip: "Snare",
  swap: "Fate Swap",
};

function eventBlurb(effect: EffectKind, amount: number): string {
  const s = amount === 1 ? "space" : "spaces";
  switch (effect) {
    case "forward":
      return `A lucky path — leap ahead ${amount} ${s}!`;
    case "back":
      return `A rockslide — tumble back ${amount} ${s}!`;
    case "again":
      return "Fortune smiles — roll again!";
    case "skip":
      return "Snared — skip your next turn.";
    case "swap":
      return "A twist of fate — swap places with the leader.";
    default:
      return "";
  }
}

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Build a board for a difficulty, scattering its event pool across random
 * interior spaces. Start (0) and the goal (size-1) are always plain.
 * Call again to reshuffle the event placement.
 */
export function buildBoard(id: DifficultyId): SpaceDef[] {
  const diff = getDifficulty(id);
  const size = diff.size;

  const board: SpaceDef[] = Array.from({ length: size }, (_, rank) => ({
    rank,
    name: rank === 0 ? "Start" : rank === size - 1 ? "The Summit" : "Trail",
    effect: "none" as EffectKind,
    amount: 0,
    blurb: "",
  }));

  const interior: number[] = [];
  for (let i = 1; i < size - 1; i++) interior.push(i);
  const spots = shuffleInPlace(interior).slice(0, Math.min(diff.events.length, interior.length));

  spots.forEach((pos, k) => {
    const e = diff.events[k];
    board[pos] = {
      rank: pos,
      name: EVENT_TITLE[e.effect as Exclude<EffectKind, "none">],
      effect: e.effect,
      amount: e.amount,
      blurb: eventBlurb(e.effect, e.amount),
    };
  });

  return board;
}

/** The goal index for a board (its last space). */
export function goalIndex(board: SpaceDef[]): number {
  return board.length - 1;
}

export function rollDie(rng: () => number = Math.random): number {
  return 1 + Math.floor(rng() * 6);
}

/** Clamp a board position to [0, goal]. */
export function clampPos(pos: number, goal: number): number {
  return Math.max(0, Math.min(goal, pos));
}
