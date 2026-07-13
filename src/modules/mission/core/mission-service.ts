import type { Difficulty, Mission } from "@/shared";
import { DIFFICULTY_WINDOW_DAYS } from "@/shared";
import { MISSION_CATALOG, type MissionCatalogEntry } from "@/data/mission-catalog";

/** Random source in [0, 1). Injected for determinism. */
export type Rng = () => number;

function defaultRng(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] / 2 ** 32;
}

/** Pick a catalog entry for a newly drawn card (random assignment). */
export function pickCatalogEntry(rng: Rng = defaultRng): MissionCatalogEntry {
  const index = Math.floor(rng() * MISSION_CATALOG.length);
  return MISSION_CATALOG[Math.min(index, MISSION_CATALOG.length - 1)];
}

/** Deadline ISO for a difficulty, measured from `now`. */
export function deadlineFor(difficulty: Difficulty, now: Date): string {
  const days = DIFFICULTY_WINDOW_DAYS[difficulty];
  const deadline = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return deadline.toISOString();
}

/** Create a newly assigned mission for a picked card (no deadline until accepted). */
export function createMission(
  id: string,
  cardId: string,
  now: Date,
  rng: Rng = defaultRng,
): Mission {
  const entry = pickCatalogEntry(rng);
  return {
    id,
    cardRef: cardId,
    featureRef: entry.featureId,
    difficulty: entry.difficulty,
    deadline: "",
    status: "assigned",
  };
}

/** Accept an assigned mission: activate it and start its difficulty-based deadline. */
export function acceptMission(mission: Mission, now: Date): Mission {
  return { ...mission, status: "active", deadline: deadlineFor(mission.difficulty, now) };
}

/** Reject an assigned mission (returns to the spread). */
export function rejectMission(mission: Mission): Mission {
  return { ...mission, status: "rejected" };
}

/** Whether an active mission's deadline has passed. */
export function isExpired(mission: Mission, now: Date): boolean {
  if (mission.status !== "active" || !mission.deadline) return false;
  return now.getTime() > new Date(mission.deadline).getTime();
}

/** Complete an active mission if within its window; otherwise mark expired. */
export function completeMission(
  mission: Mission,
  now: Date,
): { ok: true; mission: Mission } | { ok: false; mission: Mission; reason: "expired" | "invalid" } {
  if (mission.status !== "active") {
    return { ok: false, mission, reason: "invalid" };
  }
  if (isExpired(mission, now)) {
    return { ok: false, mission: { ...mission, status: "expired" }, reason: "expired" };
  }
  return { ok: true, mission: { ...mission, status: "completed" } };
}
