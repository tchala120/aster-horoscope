import type {
  DailyState,
  Difficulty,
  HistoryEntry,
  Lesson,
  LessonComment,
  LessonType,
  MatchScore,
  Mission,
  ReactionType,
  RewardOutcome,
  RewardType,
} from "@/shared";

export interface UserRecord {
  id: string;
  username: string;
  passwordHash: string;
}

export interface UserRepo {
  create(username: string, passwordHash: string): Promise<UserRecord>;
  findByUsername(username: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
}

export interface StateRepo {
  /** Returns the user's daily state, or a fresh empty one if none exists. */
  get(userId: string): DailyState;
  set(userId: string, state: DailyState): void;
}

export interface MissionRepo {
  create(mission: Mission): Mission;
  get(id: string): Mission | null;
  update(mission: Mission): Mission;
}

export interface RewardRepo {
  /** Persist a granted reward outcome (keyed by its mission). */
  create(outcome: RewardOutcome): RewardOutcome;
  /** The reward granted for a mission, if any. */
  getByMission(missionRef: string): RewardOutcome | null;
}

/** Fields captured when recording a completed-mission history entry. */
export interface NewHistoryEntry {
  userId: string;
  cardRef: string;
  featureRef: string;
  difficulty: Difficulty;
  rewardType: RewardType | null;
  rewardValue: number | null;
  rewardGranted: boolean;
}

export interface HistoryRepo {
  /** Persist a completed-mission record; returns it with id + completedAt. */
  add(entry: NewHistoryEntry): Promise<HistoryEntry>;
  /** The user's history, newest first. */
  listByUser(userId: string): Promise<HistoryEntry[]>;
}

/** Fields captured when recording a Tarot Match ranking result. */
export interface NewMatchScore {
  name: string;
  moves: number;
}

export interface MatchScoreRepo {
  /** Persist a completed game; returns it with id + createdAt. */
  add(entry: NewMatchScore): Promise<MatchScore>;
  /** Top scores: fewest moves first, then most recent. */
  top(limit: number): Promise<MatchScore[]>;
}

// ---- Aster School ----------------------------------------------------------

export interface NewLesson {
  authorId: string;
  authorName: string;
  title: string;
  summary: string | null;
  type: LessonType;
  content: string | null;
  pdfFileName: string | null;
  videoUrl: string | null;
  videoAuthor: string | null;
  tags: string[];
}

export interface LessonPatch {
  title: string;
  summary: string | null;
  content: string | null;
  videoUrl: string | null;
  videoAuthor: string | null;
  tags: string[];
}

export interface LessonListQuery {
  page: number;
  limit: number;
  q?: string;
  tag?: string;
  types?: LessonType[];
}

export interface LessonCounts {
  comments: number;
  likes: number;
  bookmarks: number;
}

export interface NewComment {
  lessonId: string;
  authorId: string;
  authorName: string;
  body: string;
}

/** An image uploaded via the rich text editor's image button. */
export interface AssetRepo {
  create(authorId: string, data: Uint8Array, mimeType: string): Promise<{ id: string }>;
  get(id: string): Promise<{ data: Uint8Array; mimeType: string } | null>;
}

/** Aster School data access (lessons + PDF blobs + comments + reactions). */
export interface SchoolRepo {
  createLesson(input: NewLesson, pdf?: Uint8Array): Promise<Lesson>;
  updateLesson(id: string, patch: LessonPatch): Promise<Lesson>;
  deleteLesson(id: string): Promise<void>;
  getLesson(id: string): Promise<Lesson | null>;
  getLessonFile(id: string): Promise<{ data: Uint8Array; fileName: string } | null>;
  listLessons(query: LessonListQuery): Promise<{ lessons: Lesson[]; total: number }>;
  /** Engagement counts keyed by lesson id (missing ids default to zero). */
  countsFor(lessonIds: string[]): Promise<Map<string, LessonCounts>>;

  listComments(lessonId: string): Promise<LessonComment[]>;
  addComment(input: NewComment): Promise<LessonComment>;
  getComment(id: string): Promise<LessonComment | null>;
  deleteComment(id: string): Promise<void>;

  /** Add the reaction if absent, remove it if present (idempotent toggle). */
  toggleReaction(lessonId: string, userId: string, type: ReactionType): Promise<void>;
  reactionCounts(lessonId: string): Promise<{ likes: number; bookmarks: number }>;
  userReactions(lessonId: string, userId: string): Promise<ReactionType[]>;
}
