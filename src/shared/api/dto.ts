import type {
  DailyState,
  HistoryEntry,
  Lesson,
  LessonComment,
  LessonSummary,
  LessonType,
  MatchScore,
  Mission,
  ReactionType,
  RewardOutcome,
  SeekerSession,
} from "../domain/types";

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

/** GET/POST /api/v1/match/scores — Tarot Match ranking board (fewest moves first). */
export interface MatchScoresResponse {
  scores: MatchScore[];
  /** Present after a submit: the id of the just-recorded score (to highlight it). */
  yourScoreId?: string | null;
}

/** POST /api/v1/match/scores — record a completed game. Name derives from the session. */
export interface SubmitMatchScoreRequest {
  moves: number;
}

// ---- Aster School ----------------------------------------------------------

/** GET /api/v1/school/lessons — paginated, filterable feed. */
export interface LessonsResponse {
  lessons: LessonSummary[];
  total: number;
  page: number;
  limit: number;
}

/** GET /api/v1/school/lessons/:id — a lesson with engagement + the viewer's reactions. */
export interface LessonDetailResponse {
  lesson: LessonSummary;
  /** Reaction types the current viewer has set (empty when not logged in). */
  yourReactions: ReactionType[];
}

/**
 * POST/PUT a lesson (JSON). `type` selects article vs. video on create and
 * defaults to "article"; PDF lessons are created via multipart form-data instead.
 */
export interface LessonInput {
  type?: LessonType;
  title: string;
  summary?: string;
  content?: string; // markdown (articles)
  videoUrl?: string; // YouTube link (video)
  /** Video author/credit; auto-filled from YouTube when left blank. */
  videoAuthor?: string;
  tags?: string[];
}

/** Response after creating a lesson. */
export interface LessonResponse {
  lesson: Lesson;
}

/** POST /api/v1/school/assets — an image uploaded from the rich text editor. */
export interface AssetResponse {
  url: string;
}

/** GET /api/v1/school/lessons/:id/comments */
export interface CommentsResponse {
  comments: LessonComment[];
}

/** POST /api/v1/school/lessons/:id/comments */
export interface CommentInput {
  body: string;
}

/** GET/POST /api/v1/school/lessons/:id/reactions */
export interface ReactionsResponse {
  likeCount: number;
  bookmarkCount: number;
  yourReactions: ReactionType[];
}

export interface ToggleReactionRequest {
  type: ReactionType;
}
