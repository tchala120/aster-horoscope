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

/** A Tarot Match ranking-board entry: player name, score (fewer moves is better), and date. */
export interface MatchScore {
  id: string;
  name: string;
  moves: number;
  /** ISO-8601 UTC timestamp of when the score was set. */
  createdAt: string;
}

// ---- Aster School ----------------------------------------------------------

export type LessonType = "article" | "pdf" | "video";
export type ReactionType = "like" | "bookmark";

/** A knowledge lesson: a written article (markdown), an uploaded PDF, or a linked video. */
export interface Lesson {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  summary: string | null;
  type: LessonType;
  /** Markdown body (articles only). */
  content: string | null;
  /** Original file name (PDFs only). */
  pdfFileName: string | null;
  /** YouTube link (videos only). */
  videoUrl: string | null;
  /** YouTube channel name, fetched when the link was attached (videos only). */
  videoAuthor: string | null;
  tags: string[];
  createdAt: string; // ISO-8601 UTC
  updatedAt: string; // ISO-8601 UTC
}

/** A lesson enriched with engagement counts for cards and the detail view. */
export interface LessonSummary extends Lesson {
  commentCount: number;
  likeCount: number;
  bookmarkCount: number;
  /** Live YouTube view count (videos only); null when unavailable or not a video. */
  videoViews: number | null;
  /** Video duration in seconds (videos only); null when unavailable or not a video. */
  videoDurationSeconds: number | null;
}

/** A comment on a lesson. */
export interface LessonComment {
  id: string;
  lessonId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string; // ISO-8601 UTC
}
