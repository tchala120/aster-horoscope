import type { Difficulty, MissionFeatureId } from "@/shared";

export interface MissionCatalogEntry {
  featureId: MissionFeatureId;
  feature: string;
  action: string;
  difficulty: Difficulty;
}

/**
 * Mission catalog derived from 10 existing Aster features (Lot of Luck excluded).
 * Difficulty sets the mission time window only (see DIFFICULTY_WINDOW_DAYS).
 */
export const MISSION_CATALOG: readonly MissionCatalogEntry[] = [
  { featureId: "active_participant", feature: "Active Participant", action: "Attend a knowledge-sharing session", difficulty: "easy" },
  { featureId: "daily_engagement", feature: "Daily Engagement", action: "Attend the daily jogging feature", difficulty: "easy" },
  { featureId: "helpful_reviewer", feature: "Helpful Reviewer", action: "Submit feedback for a knowledge-sharing session", difficulty: "easy" },
  { featureId: "survey_champion", feature: "Survey Champion", action: "Submit a survey", difficulty: "easy" },
  { featureId: "marketplace_trader", feature: "Marketplace Trader", action: "Buy a product on the marketplace", difficulty: "easy" },
  { featureId: "teaching_assistant", feature: "Teaching Assistant", action: "Be a TA for a knowledge-sharing session", difficulty: "medium" },
  { featureId: "weekly_contribution", feature: "Weekly Contribution", action: "Answer the weekly quiz (Friday)", difficulty: "medium" },
  { featureId: "marketplace_poster", feature: "Marketplace Poster", action: "Sell a product on the marketplace", difficulty: "medium" },
  { featureId: "expert_speaker", feature: "Expert Speaker", action: "Become a speaker of a knowledge-sharing session", difficulty: "hard" },
  { featureId: "asset_collector", feature: "Asset Collector", action: "Hold assets (NFT / ASA / AAB) in your wallet", difficulty: "hard" },
] as const;
