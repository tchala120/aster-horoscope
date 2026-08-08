import { describe, expect, it } from "vitest";
import { DIFFICULTY_WINDOW_DAYS, MISSION_FEATURE_IDS, REWARD_TYPES, SPREAD_SIZE } from "@/shared";

describe("shared constants", () => {
  it("spread size is 20 (two rows of 10)", () => {
    expect(SPREAD_SIZE).toBe(20);
  });

  it("difficulty windows match Easy=1 / Medium=3 / Hard=7 days", () => {
    expect(DIFFICULTY_WINDOW_DAYS).toEqual({ easy: 1, medium: 3, hard: 7 });
  });

  it("has 1 reward type (HP token)", () => {
    expect(REWARD_TYPES).toHaveLength(1);
    expect(REWARD_TYPES).toEqual(["astr"]);
  });

  it("has 3 quest types (play a game, watch a video, write an article)", () => {
    expect(MISSION_FEATURE_IDS).toHaveLength(3);
    expect(MISSION_FEATURE_IDS).toEqual(["play_game", "watch_video", "write_article"]);
  });
});
