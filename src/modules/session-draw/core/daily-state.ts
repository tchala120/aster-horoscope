import type { DailyState, Spread } from "@/shared";
import { drawDateFor } from "./draw-service";

/** A fresh daily state with no draw yet. */
export function emptyDailyState(): DailyState {
  return {
    drawDate: null,
    spread: [],
    activeMissionRef: null,
    lastCompletionDate: null,
    lastShareBonusDate: null,
  };
}

/** Record a new spread as today's draw. */
export function applyDraw(state: DailyState, spread: Spread, now: Date): DailyState {
  return { ...state, drawDate: drawDateFor(now), spread };
}

/** Mark a card in the current spread as picked. */
export function pickCard(state: DailyState, cardId: string): DailyState {
  return {
    ...state,
    spread: state.spread.map((c) => (c.cardId === cardId ? { ...c, picked: true } : c)),
  };
}

/** Mark a card as rejected (returns to same spread). Clears `picked` too — a
 *  rejected card's mission was declined, so it should fade out with the rest
 *  of the un-chosen cards rather than still render as "the picked card"
 *  (which, since this is persisted, would otherwise look stuck forever). */
export function rejectCard(state: DailyState, cardId: string): DailyState {
  return {
    ...state,
    spread: state.spread.map((c) => (c.cardId === cardId ? { ...c, picked: false, rejected: true } : c)),
  };
}

/** All cards in the current spread have been rejected. */
export function allRejected(state: DailyState): boolean {
  return state.spread.length > 0 && state.spread.every((c) => c.rejected);
}

/** Attach the single active mission (used by U2). */
export function setActiveMission(state: DailyState, missionRef: string): DailyState {
  return { ...state, activeMissionRef: missionRef };
}

/** Clear the active mission (completion/expiry) — re-enables the next draw. */
export function clearActiveMission(state: DailyState, now: Date | null = null): DailyState {
  return {
    ...state,
    activeMissionRef: null,
    lastCompletionDate: now ? drawDateFor(now) : state.lastCompletionDate,
  };
}
