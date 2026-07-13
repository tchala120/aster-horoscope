import { describe, expect, it } from "vitest";
import { DECK_IDS } from "@/data/deck";
import {
  canDraw,
  drawDateFor,
  generateSpread,
  nextResetAt,
  type Rng,
} from "../draw-service";
import { applyDraw, emptyDailyState, setActiveMission } from "../daily-state";

const fixedRng: Rng = () => 0.42;

describe("generateSpread", () => {
  it("returns 10 distinct card ids from the deck", () => {
    const spread = generateSpread(DECK_IDS, 10, fixedRng);
    expect(spread).toHaveLength(10);
    const ids = spread.map((c) => c.cardId);
    expect(new Set(ids).size).toBe(10);
    ids.forEach((id) => expect(DECK_IDS).toContain(id));
  });

  it("initializes cards face-down (not picked/rejected)", () => {
    const spread = generateSpread(DECK_IDS, 10, fixedRng);
    spread.forEach((c) => {
      expect(c.picked).toBe(false);
      expect(c.rejected).toBe(false);
    });
  });
});

describe("date helpers", () => {
  it("drawDateFor returns the UTC calendar date", () => {
    expect(drawDateFor(new Date("2026-07-13T23:59:59Z"))).toBe("2026-07-13");
  });

  it("nextResetAt returns the next UTC midnight", () => {
    expect(nextResetAt(new Date("2026-07-13T10:00:00Z"))).toBe("2026-07-14T00:00:00.000Z");
  });
});

describe("canDraw", () => {
  const now = new Date("2026-07-13T10:00:00Z");

  it("allows a draw when none happened today and no active mission", () => {
    expect(canDraw(emptyDailyState(), now)).toBe(true);
  });

  it("blocks a second draw on the same day", () => {
    const drawn = applyDraw(emptyDailyState(), generateSpread(DECK_IDS, 10, fixedRng), now);
    expect(canDraw(drawn, now)).toBe(false);
  });

  it("allows a draw again the next day", () => {
    const drawn = applyDraw(emptyDailyState(), generateSpread(DECK_IDS, 10, fixedRng), now);
    expect(canDraw(drawn, new Date("2026-07-14T00:00:01Z"))).toBe(true);
  });

  it("blocks a draw while a mission is active", () => {
    const active = setActiveMission(emptyDailyState(), "mission-1");
    expect(canDraw(active, now)).toBe(false);
  });
});
