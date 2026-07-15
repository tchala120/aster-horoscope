import { describe, expect, it } from "vitest";
import {
  DIFFICULTY_WINDOW_DAYS,
  MISSION_FEATURE_IDS,
  REWARD_TYPES,
  SPREAD_SIZE,
} from "@/shared";

describe("shared constants", () => {
  it("spread size is 10", () => {
    expect(SPREAD_SIZE).toBe(10);
  });

  it("difficulty windows match Easy=1 / Medium=3 / Hard=7 days", () => {
    expect(DIFFICULTY_WINDOW_DAYS).toEqual({ easy: 1, medium: 3, hard: 7 });
  });

  it("has 2 reward types (ASTR token + discount)", () => {
    expect(REWARD_TYPES).toHaveLength(2);
    expect(REWARD_TYPES).toEqual(["astr", "discount"]);
  });

  it("has 10 mission feature ids (Lot of Luck excluded)", () => {
    expect(MISSION_FEATURE_IDS).toHaveLength(10);
    expect(MISSION_FEATURE_IDS).not.toContain("lot_of_luck_participant");
  });
});
