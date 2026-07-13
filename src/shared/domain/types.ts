/** Core domain types — shared by client and server. Framework-agnostic. */

export type Difficulty = "easy" | "medium" | "hard";
export type Arcana = "major";
export type RewardType = "astr" | "discount" | "physical_coupon" | "artwork";
export type MissionStatus =
  | "assigned"
  | "active"
  | "completed"
  | "expired"
  | "rejected";

export interface TarotCard {
  id: string;
  name: string;
  arcana: Arcana;
  artworkRef: string;
  meaning: string;
}

export interface SpreadCard {
  cardId: string;
  picked: boolean;
  rejected: boolean;
}

export type Spread = SpreadCard[];

/** Anonymous-or-authenticated identity for a player. */
export interface SeekerSession {
  sessionId: string;
  isAuthenticated: boolean;
  userId: string | null;
  schemaVersion: number;
}

/** The player's per-day mechanical state (localStorage-first). */
export interface DailyState {
  /** ISO date (fixed app timezone) of the current spread; null until first draw. */
  drawDate: string | null;
  spread: Spread;
  activeMissionRef: string | null;
  lastCompletionDate: string | null;
  lastShareBonusDate: string | null;
}

export interface Mission {
  id: string;
  cardRef: string;
  featureRef: string;
  difficulty: Difficulty;
  deadline: string;
  status: MissionStatus;
}

export interface RewardOutcome {
  id: string;
  missionRef: string;
  granted: boolean;
  rewardType: RewardType | null;
}

export interface ShareEvent {
  id: string;
  outcomeRef: string;
  sharedAt: string;
  bonusGranted: boolean;
}

export interface AuthContext {
  userId: string;
  username: string;
}
