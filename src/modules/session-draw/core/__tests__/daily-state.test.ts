import { describe, expect, it } from "vitest";
import { DECK_IDS } from "@/data/deck";
import { generateSpread } from "../draw-service";
import {
  allRejected,
  applyDraw,
  clearActiveMission,
  emptyDailyState,
  pickCard,
  rejectCard,
  setActiveMission,
} from "../daily-state";

const rng = () => 0.13;
const now = new Date("2026-07-13T09:00:00Z");

describe("daily-state transitions", () => {
  it("applyDraw records the date and spread", () => {
    const spread = generateSpread(DECK_IDS, 10, rng);
    const state = applyDraw(emptyDailyState(), spread, now);
    expect(state.drawDate).toBe("2026-07-13");
    expect(state.spread).toHaveLength(10);
  });

  it("pickCard / rejectCard flag the right card only", () => {
    const spread = generateSpread(DECK_IDS, 10, rng);
    const base = applyDraw(emptyDailyState(), spread, now);
    const targetId = spread[0].cardId;
    const picked = pickCard(base, targetId);
    expect(picked.spread.find((c) => c.cardId === targetId)?.picked).toBe(true);
    expect(picked.spread.filter((c) => c.picked)).toHaveLength(1);

    const otherId = spread[1].cardId;
    const rejected = rejectCard(base, otherId);
    expect(rejected.spread.find((c) => c.cardId === otherId)?.rejected).toBe(true);
  });

  it("allRejected is true only when every card is rejected", () => {
    const spread = generateSpread(DECK_IDS, 3, rng);
    let state = applyDraw(emptyDailyState(), spread, now);
    expect(allRejected(state)).toBe(false);
    for (const c of spread) state = rejectCard(state, c.cardId);
    expect(allRejected(state)).toBe(true);
  });

  it("clearActiveMission removes the mission and records completion date", () => {
    const active = setActiveMission(emptyDailyState(), "m1");
    const cleared = clearActiveMission(active, now);
    expect(cleared.activeMissionRef).toBeNull();
    expect(cleared.lastCompletionDate).toBe("2026-07-13");
  });
});
