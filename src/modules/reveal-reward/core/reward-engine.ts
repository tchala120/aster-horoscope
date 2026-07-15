import type { RewardOutcome } from "@/shared";
import { REWARD_CATALOG, type RewardCatalogEntry } from "@/data/reward-catalog";

/** Random source in [0, 1). Injected for deterministic tests. */
export type Rng = () => number;

/** Cryptographically-seeded default RNG (works in both Node 18+ and the browser). */
function defaultRng(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] / 2 ** 32;
}

/** Pick an index from a set of non-negative weights (one RNG draw). */
function weightedIndex(weights: readonly number[], rng: Rng): number {
  const total = weights.reduce((sum, w) => sum + w, 0);
  let r = rng() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r < 0) return i;
  }
  return weights.length - 1;
}

/** Choose which reward type to grant, weighted by each catalog entry's `weight`. */
function pickRewardType(rng: Rng): RewardCatalogEntry {
  const index = weightedIndex(
    REWARD_CATALOG.map((entry) => entry.weight),
    rng,
  );
  return REWARD_CATALOG[index];
}

/**
 * Pick a value in [min, max] with INVERSE weighting: weight(v) = 1/v, so higher
 * values are progressively rarer. Value `min` is `max`× more likely than `max`.
 */
export function pickRewardValue(entry: RewardCatalogEntry, rng: Rng = defaultRng): number {
  const span = entry.max - entry.min + 1;
  const values = Array.from({ length: span }, (_, i) => entry.min + i);
  const weights = values.map((v) => 1 / v);
  return values[weightedIndex(weights, rng)];
}

/**
 * Generate a granted reward outcome for a completed mission. The reward type is
 * chosen by catalog weight, then its value is rolled with inverse weighting.
 */
export function generateReward(
  id: string,
  missionRef: string,
  rng: Rng = defaultRng,
): RewardOutcome {
  const entry = pickRewardType(rng);
  const value = pickRewardValue(entry, rng);
  return { id, missionRef, granted: true, rewardType: entry.type, value };
}
