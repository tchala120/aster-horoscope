import type { RewardOutcome } from "@/shared";
import { REWARD_CATALOG } from "@/data/reward-catalog";

/** Rarity tier derived from how high a value sits in its range (higher = rarer). */
export type RewardRarity = "common" | "rare" | "epic" | "legendary";

export interface RewardDisplay {
  /** Prominent value line, e.g. "42 HP". */
  headline: string;
  /** Reward label, e.g. "HP". */
  label: string;
  /** Longer descriptive line shown under the headline. */
  detail: string;
  /** Numeric value for the count-up animation; null when nothing was granted. */
  value: number | null;
  /** How the value reads ("token" → HP); null on no-gain. */
  unit: "token" | null;
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

  const detail = outcome.payoutTxHash
    ? `${outcome.value} HP sent to your wallet.`
    : outcome.payoutError
      ? `${outcome.value} HP granted — ${outcome.payoutError}`
      : `${outcome.value} HP token${outcome.value === 1 ? "" : "s"} added to your balance.`;

  return {
    headline: `${outcome.value} HP`,
    label,
    detail,
    value: outcome.value,
    unit: "token",
    rarity,
    rarityRatio,
  };
}
