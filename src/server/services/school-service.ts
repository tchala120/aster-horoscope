import type {
  CommentsResponse,
  LessonComment,
  LessonDetailResponse,
  LessonInput,
  LessonSummary,
  LessonsResponse,
  LessonType,
  ReactionsResponse,
  ReactionType,
} from "@/shared";
import { ErrorCodes } from "@/shared";
import type { Lesson } from "@/shared";
import type { LessonCounts } from "../repositories/types";
import { schoolRepo, userRepo } from "../repositories";
import { serviceError } from "../service-error";
import { extractYoutubeId, fetchYoutubeAuthor, fetchYoutubeViewCounts } from "../youtube";

const TITLE_MAX = 200;
const SUMMARY_MAX = 500;
const CONTENT_MAX = 50_000;
const TAG_MAX_COUNT = 5;
const TAG_MAX_LEN = 30;
const COMMENT_MAX = 2_000;
const VIDEO_AUTHOR_MAX = 100;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const LESSON_TYPES = new Set<LessonType>(["article", "pdf", "video"]);
// Vercel serverless functions cap request bodies at ~4.5 MB, so uploads through
// the API route must stay under that. (Bumping to 10 MB needs direct-to-storage
// uploads — e.g. Supabase Storage — instead of storing bytes via the route.)
export const PDF_MAX_MB = 4;
export const PDF_MAX_BYTES = PDF_MAX_MB * 1024 * 1024;

function badRequest(message: string): never {
  throw serviceError(ErrorCodes.VALIDATION, message, 400);
}

function cleanTitle(raw: unknown): string {
  const t = typeof raw === "string" ? raw.trim() : "";
  if (!t) badRequest("Title is required.");
  if (t.length > TITLE_MAX) badRequest(`Title must be ${TITLE_MAX} characters or fewer.`);
  return t;
}

function cleanSummary(raw: unknown): string | null {
  if (raw == null || raw === "") return null;
  const s = String(raw).trim();
  if (s.length > SUMMARY_MAX) badRequest(`Summary must be ${SUMMARY_MAX} characters or fewer.`);
  return s || null;
}

function cleanContent(raw: unknown): string {
  const c = typeof raw === "string" ? raw.trim() : "";
  if (!c) badRequest("Content is required.");
  if (c.length > CONTENT_MAX) badRequest(`Content must be ${CONTENT_MAX} characters or fewer.`);
  return c;
}

function cleanVideoUrl(raw: unknown): string {
  const u = typeof raw === "string" ? raw.trim() : "";
  if (!u) badRequest("A YouTube link is required.");
  if (!extractYoutubeId(u)) badRequest("Enter a valid YouTube link.");
  return u;
}

/** A manually entered video author/credit, or null when left blank (falls back to auto-fill). */
function cleanVideoAuthor(raw: unknown): string | null {
  if (raw == null) return null;
  const a = String(raw).trim();
  if (a.length > VIDEO_AUTHOR_MAX) badRequest(`Author must be ${VIDEO_AUTHOR_MAX} characters or fewer.`);
  return a || null;
}

/** The video's author: the manual value if given, else a best-effort YouTube lookup. */
async function resolveVideoAuthor(manual: string | null, videoId: string | null): Promise<string | null> {
  if (manual) return manual;
  return videoId ? fetchYoutubeAuthor(videoId) : null;
}

function cleanTags(raw: unknown): string[] {
  if (raw == null) return [];
  if (!Array.isArray(raw)) badRequest("Tags must be a list.");
  const tags = raw
    .map((t) => String(t).trim().toLowerCase())
    .filter((t) => t.length > 0);
  if (tags.length > TAG_MAX_COUNT) badRequest(`Use at most ${TAG_MAX_COUNT} tags.`);
  for (const t of tags) {
    if (t.length > TAG_MAX_LEN) badRequest(`Each tag must be ${TAG_MAX_LEN} characters or fewer.`);
  }
  return Array.from(new Set(tags));
}

function toSummary(lesson: Lesson, counts: LessonCounts | undefined): LessonSummary {
  return {
    ...lesson,
    commentCount: counts?.comments ?? 0,
    likeCount: counts?.likes ?? 0,
    bookmarkCount: counts?.bookmarks ?? 0,
    videoViews: null,
  };
}

/** Fills in live YouTube view counts for video lessons (best-effort; leaves others untouched). */
async function attachVideoViews(summaries: LessonSummary[]): Promise<LessonSummary[]> {
  const idsByLesson = new Map<string, string>();
  for (const s of summaries) {
    const ytId = s.type === "video" && s.videoUrl ? extractYoutubeId(s.videoUrl) : null;
    if (ytId) idsByLesson.set(s.id, ytId);
  }
  if (idsByLesson.size === 0) return summaries;

  const views = await fetchYoutubeViewCounts([...idsByLesson.values()]);
  if (views.size === 0) return summaries;

  return summaries.map((s) => {
    const ytId = idsByLesson.get(s.id);
    const count = ytId ? views.get(ytId) : undefined;
    return count === undefined ? s : { ...s, videoViews: count };
  });
}

/** The signed-in user's display name, for stamping on lessons/comments. */
export async function resolveAuthorName(userId: string): Promise<string> {
  const user = await userRepo.findById(userId);
  if (!user) throw serviceError(ErrorCodes.AUTH_UNAUTHENTICATED, "Not authenticated.", 401);
  return user.username;
}

async function requireLesson(id: string): Promise<Lesson> {
  const lesson = await schoolRepo.getLesson(id);
  if (!lesson) throw serviceError(ErrorCodes.NOT_FOUND, "Lesson not found.", 404);
  return lesson;
}

// ---- Lessons ---------------------------------------------------------------

export async function listLessons(params: {
  page?: number;
  limit?: number;
  q?: string;
  tag?: string;
  types?: string[];
}): Promise<LessonsResponse> {
  const page = Math.max(1, Math.floor(params.page ?? 1));
  const limit = Math.min(MAX_LIMIT, Math.max(1, Math.floor(params.limit ?? DEFAULT_LIMIT)));
  const types = params.types?.filter((t): t is LessonType => LESSON_TYPES.has(t as LessonType));
  const { lessons, total } = await schoolRepo.listLessons({
    page,
    limit,
    q: params.q?.trim() || undefined,
    tag: params.tag?.trim().toLowerCase() || undefined,
    types: types?.length ? types : undefined,
  });
  const counts = await schoolRepo.countsFor(lessons.map((l) => l.id));
  const summaries = await attachVideoViews(lessons.map((l) => toSummary(l, counts.get(l.id))));
  return { lessons: summaries, total, page, limit };
}

export async function getLesson(id: string, userId: string | null): Promise<LessonDetailResponse> {
  const lesson = await requireLesson(id);
  const counts = await schoolRepo.countsFor([id]);
  const yourReactions = userId ? await schoolRepo.userReactions(id, userId) : [];
  const [summary] = await attachVideoViews([toSummary(lesson, counts.get(id))]);
  return { lesson: summary, yourReactions };
}

export function getLessonFile(id: string): Promise<{ data: Uint8Array; fileName: string } | null> {
  return schoolRepo.getLessonFile(id);
}

export function createArticle(userId: string, userName: string, input: LessonInput): Promise<Lesson> {
  return schoolRepo.createLesson({
    authorId: userId,
    authorName: userName,
    title: cleanTitle(input.title),
    summary: cleanSummary(input.summary),
    type: "article",
    content: cleanContent(input.content),
    pdfFileName: null,
    videoUrl: null,
    videoAuthor: null,
    tags: cleanTags(input.tags),
  });
}

export async function createVideo(userId: string, userName: string, input: LessonInput): Promise<Lesson> {
  const videoUrl = cleanVideoUrl(input.videoUrl);
  const videoId = extractYoutubeId(videoUrl);
  const videoAuthor = await resolveVideoAuthor(cleanVideoAuthor(input.videoAuthor), videoId);
  return schoolRepo.createLesson({
    authorId: userId,
    authorName: userName,
    title: cleanTitle(input.title),
    summary: cleanSummary(input.summary),
    type: "video",
    content: null,
    pdfFileName: null,
    videoUrl,
    videoAuthor,
    tags: cleanTags(input.tags),
  });
}

export function createPdf(
  userId: string,
  userName: string,
  meta: { title: string; summary?: string; tags?: string[]; fileName: string },
  pdf: Uint8Array,
): Promise<Lesson> {
  if (pdf.byteLength === 0) badRequest("The PDF is empty.");
  if (pdf.byteLength > PDF_MAX_BYTES) badRequest(`The PDF must be ${PDF_MAX_MB} MB or smaller.`);
  const fileName = meta.fileName.trim() || "document.pdf";
  return schoolRepo.createLesson(
    {
      authorId: userId,
      authorName: userName,
      title: cleanTitle(meta.title),
      summary: cleanSummary(meta.summary),
      type: "pdf",
      content: null,
      pdfFileName: fileName.toLowerCase().endsWith(".pdf") ? fileName : `${fileName}.pdf`,
      videoUrl: null,
      videoAuthor: null,
      tags: cleanTags(meta.tags),
    },
    pdf,
  );
}

export async function updateLesson(userId: string, id: string, input: LessonInput): Promise<Lesson> {
  const lesson = await requireLesson(id);
  if (lesson.authorId !== userId) {
    throw serviceError(ErrorCodes.AUTH_FORBIDDEN, "You can only edit your own lessons.", 403);
  }
  const videoUrl = lesson.type === "video" ? cleanVideoUrl(input.videoUrl) : null;
  const videoId = videoUrl ? extractYoutubeId(videoUrl) : null;
  const videoAuthor =
    lesson.type === "video" ? await resolveVideoAuthor(cleanVideoAuthor(input.videoAuthor), videoId) : null;
  return schoolRepo.updateLesson(id, {
    title: cleanTitle(input.title),
    summary: cleanSummary(input.summary),
    // PDF lessons keep a null body; only articles carry markdown content.
    content: lesson.type === "article" ? cleanContent(input.content) : null,
    videoUrl,
    videoAuthor,
    tags: cleanTags(input.tags),
  });
}

export async function deleteLesson(userId: string, id: string): Promise<void> {
  const lesson = await requireLesson(id);
  if (lesson.authorId !== userId) {
    throw serviceError(ErrorCodes.AUTH_FORBIDDEN, "You can only delete your own lessons.", 403);
  }
  await schoolRepo.deleteLesson(id);
}

// ---- Comments --------------------------------------------------------------

export async function listComments(id: string): Promise<CommentsResponse> {
  return { comments: await schoolRepo.listComments(id) };
}

export async function addComment(
  userId: string,
  userName: string,
  id: string,
  rawBody: unknown,
): Promise<CommentsResponse> {
  const body = typeof rawBody === "string" ? rawBody.trim() : "";
  if (!body) badRequest("Comment cannot be empty.");
  if (body.length > COMMENT_MAX) badRequest(`Comment must be ${COMMENT_MAX} characters or fewer.`);
  await requireLesson(id);
  await schoolRepo.addComment({ lessonId: id, authorId: userId, authorName: userName, body });
  return { comments: await schoolRepo.listComments(id) };
}

export async function deleteComment(userId: string, commentId: string): Promise<void> {
  const comment: LessonComment | null = await schoolRepo.getComment(commentId);
  if (!comment) throw serviceError(ErrorCodes.NOT_FOUND, "Comment not found.", 404);
  if (comment.authorId !== userId) {
    throw serviceError(ErrorCodes.AUTH_FORBIDDEN, "You can only delete your own comments.", 403);
  }
  await schoolRepo.deleteComment(commentId);
}

// ---- Reactions -------------------------------------------------------------

async function reactionsResponse(id: string, userId: string | null): Promise<ReactionsResponse> {
  const counts = await schoolRepo.reactionCounts(id);
  const yourReactions = userId ? await schoolRepo.userReactions(id, userId) : [];
  return { likeCount: counts.likes, bookmarkCount: counts.bookmarks, yourReactions };
}

export async function getReactions(id: string, userId: string | null): Promise<ReactionsResponse> {
  await requireLesson(id);
  return reactionsResponse(id, userId);
}

export async function toggleReaction(
  userId: string,
  id: string,
  type: ReactionType,
): Promise<ReactionsResponse> {
  if (type !== "like" && type !== "bookmark") badRequest("Invalid reaction type.");
  await requireLesson(id);
  await schoolRepo.toggleReaction(id, userId, type);
  return reactionsResponse(id, userId);
}
