/** Core domain types — shared by client and server. Framework-agnostic. */

export type Difficulty = "easy" | "medium" | "hard";
export type Arcana = "major";
export type RewardType = "astr" | "discount";
export type MissionStatus =
  | "assigned"
  | "active"
  | "completed"
  | "expired"
  | "rejected";

/** Themed front artwork for a card (one image per life area). */
export interface CardArtwork {
  life: string;
  love: string;
  money: string;
  work: string;
}

/** The available artwork themes. */
export type CardArtworkTheme = keyof CardArtwork;

export interface TarotCard {
  id: string;
  name: string;
  arcana: Arcana;
  artwork: CardArtwork;
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
  /** Display name of the authenticated player (shown in the profile menu). */
  username: string;
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
  /**
   * The granted amount: ASTR token count (1-100) or discount percentage (1-10).
   * Null when nothing was granted. Higher values are rarer (inverse-weighted).
   */
  value: number | null;
}

export interface ShareEvent {
  id: string;
  outcomeRef: string;
  sharedAt: string;
  bonusGranted: boolean;
}

/**
 * A completed-mission record shown in the player's history: which card was
 * picked, the quest (feature) it assigned, the reward granted, and when.
 * References resolve to the deck / mission catalog / reward catalog on display.
 */
export interface HistoryEntry {
  id: string;
  cardRef: string;
  featureRef: string;
  difficulty: Difficulty;
  rewardType: RewardType | null;
  rewardValue: number | null;
  rewardGranted: boolean;
  /** ISO-8601 UTC timestamp of the completion. */
  completedAt: string;
}

export interface AuthContext {
  userId: string;
  username: string;
}
