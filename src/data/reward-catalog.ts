import type { RewardType } from "@/shared";

export interface RewardCatalogEntry {
  type: RewardType;
  label: string;
  description: string;
}

/**
 * Aster reward types (already implemented on the platform). This app only
 * displays the granted result — minting/fulfillment happens externally.
 */
export const REWARD_CATALOG: readonly RewardCatalogEntry[] = [
  { type: "astr", label: "ASTR", description: "Aster token" },
  { type: "discount", label: "Discount", description: "Use on reward redemption" },
  { type: "physical_coupon", label: "Physical coupon", description: "Starbucks card, Central voucher" },
  { type: "artwork", label: "Artwork", description: "NFT, ASA, or AAB" },
] as const;
