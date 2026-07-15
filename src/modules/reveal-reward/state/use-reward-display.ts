import { useMemo } from "react";
import type { RewardOutcome } from "@/shared";
import { formatReward, type RewardDisplay } from "../core/reward-format";

/**
 * Adapter hook (state layer): turns a reward outcome into display strings for
 * the reveal UI. Presentational components consume the core formatter through
 * this hook rather than importing core directly.
 */
export function useRewardDisplay(reward: RewardOutcome): RewardDisplay {
  return useMemo(() => formatReward(reward), [reward]);
}
