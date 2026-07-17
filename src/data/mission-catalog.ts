import type { Difficulty, MissionFeatureId } from "@/shared";

export interface MissionCatalogEntry {
  featureId: MissionFeatureId;
  feature: string;
  action: string;
  difficulty: Difficulty;
  /** External Aster page where the Seeker performs the mission. */
  link: string;
}

/** Teaching Assistant & Expert Speaker share the same sign-up form. */
const KS_SIGNUP_FORM =
  "https://forms.office.com/pages/responsepage.aspx?id=wGfYuEm5XEWV3c7lMk7YFRTK7vpkUHhAip-nbg5Lg2BUN1FLWFBDQ1JHNjY0MEpVT0s1M05YRlVMTiQlQCN0PWcu&route=shorturl";

/**
 * Mission catalog derived from 10 existing Aster features (Lot of Luck excluded).
 * Difficulty sets the mission time window only (see DIFFICULTY_WINDOW_DAYS).
 * `link` opens the Aster page where the mission is performed.
 */
export const MISSION_CATALOG: readonly MissionCatalogEntry[] = [
  { featureId: "active_participant", feature: "Active Participant", action: "Attend a knowledge-sharing session", difficulty: "easy", link: "https://aster.arise.tech/session/?tab=coming-up" },
  { featureId: "daily_engagement", feature: "Daily Engagement", action: "Attend the daily jogging feature", difficulty: "easy", link: "https://aster.arise.tech/daily-jogging/" },
  { featureId: "helpful_reviewer", feature: "Helpful Reviewer", action: "Submit feedback for a knowledge-sharing session", difficulty: "easy", link: "https://aster.arise.tech/profile/history/" },
  { featureId: "survey_champion", feature: "Survey Champion", action: "Submit a survey", difficulty: "easy", link: "https://aster.arise.tech/survey/" },
  { featureId: "marketplace_trader", feature: "Marketplace Trader", action: "Buy a product on the marketplace", difficulty: "easy", link: "https://aster.arise.tech/marketplace/" },
  { featureId: "teaching_assistant", feature: "Teaching Assistant", action: "Be a TA for a knowledge-sharing session", difficulty: "medium", link: KS_SIGNUP_FORM },
  { featureId: "weekly_contribution", feature: "Weekly Contribution", action: "Answer the weekly quiz (Friday)", difficulty: "medium", link: "https://aster.arise.tech/weekly-quiz/" },
  { featureId: "marketplace_poster", feature: "Marketplace Poster", action: "Sell a product on the marketplace", difficulty: "medium", link: "https://aster.arise.tech/marketplace/inventory/" },
  { featureId: "expert_speaker", feature: "Expert Speaker", action: "Become a speaker of a knowledge-sharing session", difficulty: "hard", link: KS_SIGNUP_FORM },
  { featureId: "asset_collector", feature: "Asset Collector", action: "Hold assets (NFT / ASA / AAB) in your wallet", difficulty: "hard", link: "https://aster.arise.tech/collection-gallery/" },
] as const;
