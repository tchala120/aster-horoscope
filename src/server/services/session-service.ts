import type { SeekerSession } from "@/shared";
import type { SessionResponse } from "@/shared";
import { DECK_IDS } from "@/data/deck";
import { applyDraw } from "@/modules/session-draw/core/daily-state";
import { canDraw, generateSpread } from "@/modules/session-draw/core/draw-service";
import { missionRepo, stateRepo, userRepo } from "../repositories/memory";
import { serviceError } from "../service-error";

export function buildSession(userId: string): SeekerSession {
  return { sessionId: userId, isAuthenticated: true, userId, schemaVersion: 1 };
}

/** Server-authoritative full state for a user. */
export function getState(userId: string): SessionResponse {
  const user = userRepo.findById(userId);
  if (!user) throw serviceError("AUTH_001", "Not authenticated.", 401);
  const daily = stateRepo.get(userId);
  const activeMission = daily.activeMissionRef ? missionRepo.get(daily.activeMissionRef) : null;
  return { session: buildSession(userId), daily, activeMission };
}

/** Server-authoritative daily draw (one/day, blocked while a mission is active). */
export function draw(userId: string) {
  const daily = stateRepo.get(userId);
  const now = new Date();
  if (!canDraw(daily, now)) {
    throw serviceError("DRAW_001", "You have already drawn today or have an active mission.", 409);
  }
  const next = applyDraw(daily, generateSpread(DECK_IDS), now);
  stateRepo.set(userId, next);
  return next;
}
