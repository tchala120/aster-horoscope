import { describe, it } from "vitest";
import fc from "fast-check";
import { DECK_IDS } from "@/data/deck";
import { canDraw, drawDateFor, generateSpread, type Rng } from "../draw-service";
import { applyDraw, emptyDailyState, setActiveMission } from "../daily-state";

/** Deterministic LCG rng from a seed for reproducible property runs. */
function lcg(seed: number): Rng {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

const seed = fc.integer({ min: 1, max: 2 ** 31 - 1 });
const day = fc.date({ min: new Date("2000-01-01T00:00:00Z"), max: new Date("2100-01-01T00:00:00Z") });

describe("PBT — draw invariants", () => {
  it("P2: every spread has exactly 10 distinct cards, all from the deck", () => {
    fc.assert(
      fc.property(seed, (s) => {
        const spread = generateSpread(DECK_IDS, 10, lcg(s));
        const ids = spread.map((c) => c.cardId);
        return (
          spread.length === 10 &&
          new Set(ids).size === 10 &&
          ids.every((id) => DECK_IDS.includes(id))
        );
      }),
    );
  });

  it("P1: at most one spread per day — a same-day re-draw is blocked", () => {
    fc.assert(
      fc.property(seed, day, (s, d) => {
        const drawn = applyDraw(emptyDailyState(), generateSpread(DECK_IDS, 10, lcg(s)), d);
        return canDraw(drawn, d) === false;
      }),
    );
  });

  it("P4: after a draw, a new draw is available once the UTC date advances", () => {
    fc.assert(
      fc.property(seed, day, (s, d) => {
        const drawn = applyDraw(emptyDailyState(), generateSpread(DECK_IDS, 10, lcg(s)), d);
        const nextDay = new Date(drawn.drawDate ? `${drawn.drawDate}T00:00:00Z` : d);
        nextDay.setUTCDate(nextDay.getUTCDate() + 1);
        // Different calendar day and no active mission -> drawable.
        return drawDateFor(nextDay) !== drawn.drawDate && canDraw(drawn, nextDay) === true;
      }),
    );
  });

  it("P3: a draw is always blocked while a mission is active", () => {
    fc.assert(
      fc.property(day, fc.string({ minLength: 1 }), (d, missionRef) => {
        const active = setActiveMission(emptyDailyState(), missionRef);
        return canDraw(active, d) === false;
      }),
    );
  });
});
