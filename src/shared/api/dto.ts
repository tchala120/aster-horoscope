import type { DailyState, HistoryEntry, Mission, RewardOutcome, SeekerSession } from "../domain/types";

/** Auth request (register / login). */
export interface AuthRequest {
  username: string;
  password: string;
}

/** Authenticated identity (GET /api/v1/auth/session). */
export interface AuthResponse {
  session: SeekerSession;
}

/** GET /api/v1/sessions/me — full server-authoritative state. */
export interface SessionResponse {
  session: SeekerSession;
  daily: DailyState;
  activeMission: Mission | null;
}

/** POST /api/v1/draws */
export interface DrawResponse {
  daily: DailyState;
}

/** POST /api/v1/missions/pick */
export interface PickRequest {
  cardId: string;
}

/** Mission lifecycle responses (pick / accept / reject / complete). */
export interface MissionResponse {
  mission: Mission | null;
  daily: DailyState;
  /** Present only on a successful `complete`: the granted reward to reveal. */
  reward?: RewardOutcome | null;
}

/** PATCH /api/v1/missions/{id} */
export type MissionAction = "accept" | "reject" | "complete";
export interface MissionActionRequest {
  action: MissionAction;
}

/** GET /api/v1/history — the authenticated player's completed-mission history. */
export interface HistoryResponse {
  entries: HistoryEntry[];
}
