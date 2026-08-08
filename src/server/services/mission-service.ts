import { randomUUID } from "node:crypto";
import type { Mission, MissionFeatureId, MissionResponse } from "@/shared";
import {
  clearActiveMission,
  pickCard,
  rejectCard,
  setActiveMission,
} from "@/modules/session-draw/core/daily-state";
import {
  acceptMission,
  completeMission,
  createMission,
  rejectMission,
} from "@/modules/mission/core/mission-service";
import { generateReward } from "@/modules/reveal-reward/core/reward-engine";
import { missionRepo, questEventRepo, rewardRepo, stateRepo } from "../repositories/memory";
import { historyRepo, userRepo } from "../repositories";
import { serviceError } from "../service-error";
import { payoutReward } from "../web3/reward-payout";

/** Pick a card from today's spread and assign a mission (US-006, US-007). */
export function pick(userId: string, cardId: string): MissionResponse {
  const daily = stateRepo.get(userId);
  if (daily.activeMissionRef) {
    throw serviceError("MISSION_003", "You already have an active mission.", 409);
  }
  const card = daily.spread.find((c) => c.cardId === cardId);
  if (!card) throw serviceError("MISSION_001", "Card is not in today's spread.", 400);
  if (card.rejected) throw serviceError("MISSION_001", "That card was already rejected.", 400);

  const mission = missionRepo.create(createMission(randomUUID(), cardId, new Date()));
  const next = pickCard(daily, cardId);
  stateRepo.set(userId, next);
  return { mission, daily: next };
}

function loadMission(missionId: string): Mission {
  const mission = missionRepo.get(missionId);
  if (!mission) throw serviceError("NOT_FOUND", "Mission not found.", 404);
  return mission;
}

/** Accept an assigned mission → active with a difficulty-based deadline (US-008). */
export function accept(userId: string, missionId: string): MissionResponse {
  const mission = loadMission(missionId);
  if (mission.status !== "assigned") {
    throw serviceError("MISSION_002", "Mission cannot be accepted.", 409);
  }
  const active = missionRepo.update(acceptMission(mission, new Date()));
  const next = setActiveMission(stateRepo.get(userId), active.id);
  stateRepo.set(userId, next);
  return { mission: active, daily: next };
}

/** Reject an assigned mission → re-pick from the same spread (US-009). */
export function reject(userId: string, missionId: string): MissionResponse {
  const mission = loadMission(missionId);
  const rejected = missionRepo.update(rejectMission(mission));
  const next = rejectCard(stateRepo.get(userId), mission.cardRef);
  stateRepo.set(userId, next);
  return { mission: rejected, daily: next };
}

/**
 * Complete an active mission if within its window (US-011); else mark expired
 * (US-010). Completion also requires proof the linked quest activity actually
 * happened (a game win, an article published, a video watched) — recorded by
 * the quest-event repo when that real action occurs. The mission is only
 * flipped to "completed" once that proof is consumed; a missing/expired proof
 * leaves the mission "active" so the Seeker can go do it and try again.
 */
export async function complete(userId: string, missionId: string): Promise<MissionResponse> {
  const mission = loadMission(missionId);
  const attempt = completeMission(mission, new Date());

  if (!attempt.ok) {
    // Expired/invalid: persist that, then clear the active mission so the
    // Seeker can draw again next day.
    missionRepo.update(attempt.mission);
    const cleared = clearActiveMission(stateRepo.get(userId));
    stateRepo.set(userId, { ...cleared, activeMissionRef: null });
    throw serviceError(
      "MISSION_002",
      attempt.reason === "expired" ? "Mission deadline has passed." : "Mission is not active.",
      409,
    );
  }

  const verified = questEventRepo.consume(
    userId,
    mission.featureRef as MissionFeatureId,
    mission.acceptedAt,
  );
  if (!verified) {
    throw serviceError(
      "MISSION_004",
      "Complete the linked activity first, then come back and tap “I did it”.",
      409,
    );
  }

  const saved = missionRepo.update(attempt.mission);
  const next = clearActiveMission(stateRepo.get(userId), new Date());
  stateRepo.set(userId, next);

  // Roll the reward, then attempt to pay it out on-chain to the Seeker's
  // linked wallet. A payout hiccup (no wallet linked, RPC error, etc.) never
  // blocks the mission/reward reveal — it's recorded so support/history can see it.
  const rolled = generateReward(randomUUID(), saved.id);
  const user = await userRepo.findById(userId);
  let payoutTxHash: string | null = null;
  let payoutError: string | null = null;
  if (rolled.granted && rolled.value) {
    if (!user?.walletAddress) {
      payoutError = "No wallet linked — link a wallet to receive HP rewards.";
    } else {
      const payout = await payoutReward(user.walletAddress as `0x${string}`, rolled.value);
      payoutTxHash = payout.txHash;
      payoutError = payout.error;
    }
  }
  const reward = rewardRepo.create({ ...rolled, payoutTxHash, payoutError });

  // Record the completion in the player's history (persisted to Postgres when
  // configured). Non-fatal: a history write failure must not break the reveal.
  try {
    await historyRepo.add({
      userId,
      cardRef: saved.cardRef,
      featureRef: saved.featureRef,
      difficulty: saved.difficulty,
      rewardType: reward.rewardType,
      rewardValue: reward.value,
      rewardGranted: reward.granted,
      payoutTxHash: reward.payoutTxHash,
    });
  } catch (e) {
    console.error("Failed to record history entry", e);
  }

  return { mission: saved, daily: next, reward };
}
