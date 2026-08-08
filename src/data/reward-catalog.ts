import type { RewardType } from "@/shared";

/** How a reward's numeric value is presented. */
export type RewardUnit = "token";

export interface RewardCatalogEntry {
  type: RewardType;
  label: string;
  description: string;
  unit: RewardUnit;
  /** Inclusive minimum grantable value. */
  min: number;
  /** Inclusive maximum grantable value. */
  max: number;
  /** Relative likelihood of this reward TYPE being selected (before the value roll). */
  weight: number;
}

/**
 * A completed quest grants a random amount of HAPPY_COIN (HP), the app's
 * on-chain ERC-20 (see wagmi-config.ts). Value selection is inverse-weighted
 * (see reward-engine): within the range, higher values are progressively
 * rarer, so big rewards are hard to get.
 */
export const REWARD_CATALOG: readonly RewardCatalogEntry[] = [
  {
    type: "astr",
    label: "HP",
    description: "Happy Coin",
    unit: "token",
    min: 1,
    max: 100,
    weight: 1,
  },
] as const;
