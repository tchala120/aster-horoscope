import type { DailyState, Spread } from "@/shared";
import { SPREAD_SIZE } from "@/shared";

/** Random source returning a float in [0, 1). Injected for determinism in tests. */
export type Rng = () => number;

/** Default RNG — cryptographically strong (guest client, D3-2). */
export function defaultRng(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] / 2 ** 32;
}

/**
 * Draw a spread of `size` distinct cards from `deckIds` without replacement.
 * Fisher-Yates partial shuffle. Pure given `rng`.
 */
export function generateSpread(
  deckIds: readonly string[],
  size: number = SPREAD_SIZE,
  rng: Rng = defaultRng,
): Spread {
  const pool = [...deckIds];
  const n = Math.min(size, pool.length);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n).map((cardId) => ({ cardId, picked: false, rejected: false }));
}

/** The app-timezone (UTC) calendar date for a given instant, as YYYY-MM-DD. */
export function drawDateFor(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/** ISO timestamp of the next reset boundary (next UTC midnight). */
export function nextResetAt(now: Date): string {
  const next = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0),
  );
  return next.toISOString();
}

/**
 * Whether a new draw is allowed: not already drawn today AND no active mission.
 * (US-004 one-per-day, US-005 blocked while a mission is active.)
 */
export function canDraw(state: DailyState, now: Date): boolean {
  if (state.activeMissionRef) return false;
  return state.drawDate !== drawDateFor(now);
}
