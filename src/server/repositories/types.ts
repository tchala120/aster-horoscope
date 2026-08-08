import type {
  DailyState,
  Difficulty,
  HistoryEntry,
  Lesson,
  LessonComment,
  LessonType,
  MatchScore,
  Mission,
  MissionFeatureId,
  Playlist,
  ReactionType,
  RewardOutcome,
  RewardType,
} from "@/shared";
import type { RoomState } from "@/modules/werewolf/core/room";

export interface UserRecord {
  id: string;
  username: string;
  passwordHash: string;
  /** Linked EVM wallet address (lowercase), or null if none linked. */
  walletAddress: string | null;
}

export interface UserRepo {
  create(username: string, passwordHash: string): Promise<UserRecord>;
  findByUsername(username: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
  findByWalletAddress(address: string): Promise<UserRecord | null>;
  setWalletAddress(userId: string, address: string | null): Promise<UserRecord>;
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
  /** On-chain HAPPY_COIN transfer hash for this reward, or null if not paid out. */
  payoutTxHash: string | null;
}

/**
 * Records real-activity signals (a game win, an article published, a video
 * watched) that gate mission completion. One pending event per (user, quest
 * type) — a fresh event overwrites any unconsumed prior one.
 */
export interface QuestEventRepo {
  record(userId: string, featureId: MissionFeatureId): void;
  /** True (and consumes the event) if one exists at/after `sinceIso`. */
  consume(userId: string, featureId: MissionFeatureId, sinceIso: string | null): boolean;
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

// ---- Aster School: Playlists ------------------------------------------------

export interface NewPlaylist {
  authorId: string;
  authorName: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
}

export interface PlaylistPatch {
  title: string;
  description: string | null;
  coverImageUrl: string | null;
}

export interface PlaylistListQuery {
  page: number;
  limit: number;
  /** Restrict to one author's playlists (e.g. for an "add to my playlist" picker). */
  authorId?: string;
}

/** Aggregate data for a playlist card: how many items it has, and its first video. */
export interface PlaylistSummaryData {
  itemCount: number;
  firstLesson: Lesson | null;
}

/** One playlist item joined with its lesson, in play order. */
export interface PlaylistItemRecord {
  id: string;
  playlistId: string;
  position: number;
  lesson: Lesson;
}

/** Curated, ordered playlists of video lessons. */
export interface PlaylistRepo {
  createPlaylist(input: NewPlaylist): Promise<Playlist>;
  updatePlaylist(id: string, patch: PlaylistPatch): Promise<Playlist>;
  deletePlaylist(id: string): Promise<void>;
  getPlaylist(id: string): Promise<Playlist | null>;
  listPlaylists(query: PlaylistListQuery): Promise<{ playlists: Playlist[]; total: number }>;
  /** Item count + cover lesson keyed by playlist id (missing ids default to empty). */
  summaryDataFor(playlistIds: string[]): Promise<Map<string, PlaylistSummaryData>>;

  listItems(playlistId: string): Promise<PlaylistItemRecord[]>;
  hasItem(playlistId: string, lessonId: string): Promise<boolean>;
  /** Appends the lesson at the end of the playlist's current order. */
  addItem(playlistId: string, lessonId: string): Promise<void>;
  removeItem(playlistId: string, lessonId: string): Promise<void>;
  /** Rewrites item positions to match this full ordered list of lesson ids. */
  reorderItems(playlistId: string, lessonIds: string[]): Promise<void>;
}

// ---- Werewolf online rooms --------------------------------------------------

/** Online Werewolf game rooms, keyed by their shareable join code. */
export interface WerewolfRoomRepo {
  create(state: RoomState): Promise<RoomState>;
  getByCode(code: string): Promise<RoomState | null>;
  /** Overwrites the room's state (last-write-wins; traffic per room is tiny). */
  save(state: RoomState): Promise<RoomState>;
  /** Most recently updated rooms, for the "open rooms" browser — filtered/capped by the caller. */
  listRecent(limit: number): Promise<RoomState[]>;
  /** Permanently removes the room. No-op if it's already gone. */
  deleteByCode(code: string): Promise<void>;
}
