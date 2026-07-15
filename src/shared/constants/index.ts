import type { Difficulty, RewardType } from "../domain/types";

/** App-wide fixed timezone for daily-reset boundaries (D3-3). */
export const APP_TIMEZONE = "UTC";

/** Number of cards in a daily spread (D3, US-003). */
export const SPREAD_SIZE = 10;

/** Difficulty time windows in days (Easy = within a day, Medium = 2-3, Hard = 1 week). */
export const DIFFICULTY_WINDOW_DAYS: Record<Difficulty, number> = {
  easy: 1,
  medium: 3,
  hard: 7,
};

/** Reward types displayed on reveal (already implemented on the Aster platform). */
export const REWARD_TYPES: readonly RewardType[] = ["astr", "discount"] as const;

/** Mission catalog feature IDs (from the 10 Aster features; Lot of Luck excluded). */
export const MISSION_FEATURE_IDS = [
  "active_participant",
  "daily_engagement",
  "helpful_reviewer",
  "survey_champion",
  "marketplace_trader",
  "teaching_assistant",
  "weekly_contribution",
  "marketplace_poster",
  "expert_speaker",
  "asset_collector",
] as const;

export type MissionFeatureId = (typeof MISSION_FEATURE_IDS)[number];
