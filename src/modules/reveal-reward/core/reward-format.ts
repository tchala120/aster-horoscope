import type { RewardOutcome } from "@/shared";
import { REWARD_CATALOG } from "@/data/reward-catalog";

/** Rarity tier derived from how high a value sits in its range (higher = rarer). */
export type RewardRarity = "common" | "rare" | "epic" | "legendary";

export interface RewardDisplay {
  /** Prominent value line, e.g. "42 ASTR" or "7% off". */
  headline: string;
  /** Reward label, e.g. "ASTR" / "Discount". */
  label: string;
  /** Longer descriptive line shown under the headline. */
  detail: string;
  /** Numeric value for the count-up animation; null when nothing was granted. */
  value: number | null;
  /** How the value reads ("token" → ASTR, "percent" → % off); null on no-gain. */
  unit: "token" | "percent" | null;
  /** Rarity tier, used to theme the reveal. */
  rarity: RewardRarity;
  /** Normalized position of the value within its range (0..1). */
  rarityRatio: number;
}

function rarityFor(ratio: number): RewardRarity {
  if (ratio >= 0.85) return "legendary";
  if (ratio >= 0.6) return "epic";
  if (ratio >= 0.3) return "rare";
  return "common";
}

/**
 * Format a granted reward for display. Falls back to a friendly no-gain message
 * if nothing was granted (keeps the reveal robust even without a value).
 */
export function formatReward(outcome: RewardOutcome): RewardDisplay {
  if (!outcome.granted || outcome.rewardType === null || outcome.value === null) {
    return {
      headline: "No reward this time",
      label: "",
      detail: "Better luck on your next mission.",
      value: null,
      unit: null,
      rarity: "common",
      rarityRatio: 0,
    };
  }

  const entry = REWARD_CATALOG.find((e) => e.type === outcome.rewardType);
  const label = entry?.label ?? outcome.rewardType;
  const span = entry ? entry.max - entry.min : 0;
  const rarityRatio =
    entry && span > 0 ? Math.min(1, Math.max(0, (outcome.value - entry.min) / span)) : 1;
  const rarity = rarityFor(rarityRatio);

  if (outcome.rewardType === "discount") {
    return {
      headline: `${outcome.value}% off`,
      label,
      detail: `A ${outcome.value}% discount to use on your next reward redemption.`,
      value: outcome.value,
      unit: "percent",
      rarity,
      rarityRatio,
    };
  }

  // ASTR token
  return {
    headline: `${outcome.value} ASTR`,
    label,
    detail: `${outcome.value} ASTR token${outcome.value === 1 ? "" : "s"} added to your balance.`,
    value: outcome.value,
    unit: "token",
    rarity,
    rarityRatio,
  };
}
