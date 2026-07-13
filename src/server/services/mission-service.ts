import { randomUUID } from "node:crypto";
import type { Mission, MissionResponse } from "@/shared";
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
import { missionRepo, stateRepo } from "../repositories/memory";
import { serviceError } from "../service-error";

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

/** Complete an active mission if within its window (US-011); else mark expired (US-010). */
export function complete(userId: string, missionId: string): MissionResponse {
  const mission = loadMission(missionId);
  const result = completeMission(mission, new Date());
  const saved = missionRepo.update(result.mission);

  if (!result.ok) {
    // Expired/invalid: clear the active mission so the Seeker can draw again next day.
    const cleared = clearActiveMission(stateRepo.get(userId));
    stateRepo.set(userId, { ...cleared, activeMissionRef: null });
    throw serviceError(
      "MISSION_002",
      result.reason === "expired" ? "Mission deadline has passed." : "Mission is not active.",
      409,
    );
  }

  const next = clearActiveMission(stateRepo.get(userId), new Date());
  stateRepo.set(userId, next);
  return { mission: saved, daily: next };
}
