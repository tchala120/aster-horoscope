import type { RewardType } from "@/shared";

/** How a reward's numeric value is presented. */
export type RewardUnit = "token" | "percent";

export interface RewardCatalogEntry {
  type: RewardType;
  label: string;
  description: string;
  /** Presentation of the granted value (ASTR token count vs discount %). */
  unit: RewardUnit;
  /** Inclusive minimum grantable value. */
  min: number;
  /** Inclusive maximum grantable value. */
  max: number;
  /** Relative likelihood of this reward TYPE being selected (before the value roll). */
  weight: number;
}

/**
 * Aster reward types (already implemented on the platform). This app only
 * displays the granted result — minting/fulfillment happens externally.
 *
 * Value selection is inverse-weighted (see reward-engine): within each range,
 * higher values are progressively rarer, so big rewards are hard to get.
 */
export const REWARD_CATALOG: readonly RewardCatalogEntry[] = [
  {
    type: "astr",
    label: "ASTR",
    description: "Aster token",
    unit: "token",
    min: 1,
    max: 100,
    weight: 1,
  },
  {
    type: "discount",
    label: "Discount",
    description: "Percent off reward redemption",
    unit: "percent",
    min: 1,
    max: 10,
    weight: 1,
  },
] as const;
