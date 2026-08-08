import type {
  Playlist,
  PlaylistDetailResponse,
  PlaylistInput,
  PlaylistItem,
  PlaylistResponse,
  PlaylistSummary,
  PlaylistsResponse,
} from "@/shared";
import { ErrorCodes } from "@/shared";
import { playlistRepo, schoolRepo } from "../repositories";
import { serviceError } from "../service-error";

const TITLE_MAX = 200;
const DESCRIPTION_MAX = 500;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function badRequest(message: string): never {
  throw serviceError(ErrorCodes.VALIDATION, message, 400);
}

function cleanTitle(raw: unknown): string {
  const t = typeof raw === "string" ? raw.trim() : "";
  if (!t) badRequest("Title is required.");
  if (t.length > TITLE_MAX) badRequest(`Title must be ${TITLE_MAX} characters or fewer.`);
  return t;
}

function cleanDescription(raw: unknown): string | null {
  if (raw == null || raw === "") return null;
  const d = String(raw).trim();
  if (d.length > DESCRIPTION_MAX)
    badRequest(`Description must be ${DESCRIPTION_MAX} characters or fewer.`);
  return d || null;
}

/** Only accepts URLs from our own asset-upload endpoint (POST /school/assets). */
const COVER_IMAGE_URL_RE = /^\/api\/v1\/school\/assets\/[a-zA-Z0-9-]+$/;

function cleanCoverImageUrl(raw: unknown): string | null {
  if (raw == null || raw === "") return null;
  const url = String(raw).trim();
  if (!COVER_IMAGE_URL_RE.test(url)) badRequest("Invalid cover image.");
  return url;
}

async function requirePlaylist(id: string): Promise<Playlist> {
  const playlist = await playlistRepo.getPlaylist(id);
  if (!playlist) throw serviceError(ErrorCodes.NOT_FOUND, "Playlist not found.", 404);
  return playlist;
}

function requireOwner(playlist: Playlist, userId: string): void {
  if (playlist.authorId !== userId) {
    throw serviceError(ErrorCodes.AUTH_FORBIDDEN, "You can only manage your own playlists.", 403);
  }
}

/** Item rows come back as bare Lessons; a playlist card/queue needs the LessonSummary
 * shape, but engagement counts aren't shown there, so they're zeroed out. */
async function itemsFor(playlistId: string): Promise<PlaylistItem[]> {
  const rows = await playlistRepo.listItems(playlistId);
  return rows.map((r) => ({
    id: r.id,
    playlistId: r.playlistId,
    position: r.position,
    lesson: {
      ...r.lesson,
      commentCount: 0,
      likeCount: 0,
      bookmarkCount: 0,
      videoViews: null,
      videoDurationSeconds: null,
    },
  }));
}

export async function listPlaylists(params: {
  page?: number;
  limit?: number;
  authorId?: string;
}): Promise<PlaylistsResponse> {
  const page = Math.max(1, Math.floor(params.page ?? 1));
  const limit = Math.min(MAX_LIMIT, Math.max(1, Math.floor(params.limit ?? DEFAULT_LIMIT)));
  const { playlists, total } = await playlistRepo.listPlaylists({
    page,
    limit,
    authorId: params.authorId,
  });
  const summaryData = await playlistRepo.summaryDataFor(playlists.map((p) => p.id));
  const summaries: PlaylistSummary[] = playlists.map((p) => {
    const data = summaryData.get(p.id);
    return {
      ...p,
      itemCount: data?.itemCount ?? 0,
      firstLesson: data?.firstLesson
        ? {
            ...data.firstLesson,
            commentCount: 0,
            likeCount: 0,
            bookmarkCount: 0,
            videoViews: null,
            videoDurationSeconds: null,
          }
        : null,
    };
  });
  return { playlists: summaries, total, page, limit };
}

export async function getPlaylist(id: string): Promise<PlaylistDetailResponse> {
  const playlist = await requirePlaylist(id);
  return { playlist, items: await itemsFor(id) };
}

export async function createPlaylist(
  userId: string,
  userName: string,
  input: PlaylistInput,
): Promise<PlaylistResponse> {
  const playlist = await playlistRepo.createPlaylist({
    authorId: userId,
    authorName: userName,
    title: cleanTitle(input.title),
    description: cleanDescription(input.description),
    coverImageUrl: cleanCoverImageUrl(input.coverImageUrl),
  });
  return { playlist };
}

export async function updatePlaylist(
  userId: string,
  id: string,
  input: PlaylistInput,
): Promise<PlaylistResponse> {
  const playlist = await requirePlaylist(id);
  requireOwner(playlist, userId);
  const updated = await playlistRepo.updatePlaylist(id, {
    title: cleanTitle(input.title),
    description: cleanDescription(input.description),
    coverImageUrl: cleanCoverImageUrl(input.coverImageUrl),
  });
  return { playlist: updated };
}

export async function deletePlaylist(userId: string, id: string): Promise<void> {
  const playlist = await requirePlaylist(id);
  requireOwner(playlist, userId);
  await playlistRepo.deletePlaylist(id);
}

export async function addPlaylistItem(
  userId: string,
  playlistId: string,
  lessonId: string,
): Promise<PlaylistDetailResponse> {
  const playlist = await requirePlaylist(playlistId);
  requireOwner(playlist, userId);

  const lesson = await schoolRepo.getLesson(lessonId);
  if (!lesson) throw serviceError(ErrorCodes.NOT_FOUND, "Lesson not found.", 404);
  if (lesson.type !== "video") badRequest("Only video lessons can be added to a playlist.");

  if (await playlistRepo.hasItem(playlistId, lessonId)) {
    badRequest("This video is already in the playlist.");
  }
  await playlistRepo.addItem(playlistId, lessonId);
  return { playlist, items: await itemsFor(playlistId) };
}

export async function removePlaylistItem(
  userId: string,
  playlistId: string,
  lessonId: string,
): Promise<PlaylistDetailResponse> {
  const playlist = await requirePlaylist(playlistId);
  requireOwner(playlist, userId);
  await playlistRepo.removeItem(playlistId, lessonId);
  return { playlist, items: await itemsFor(playlistId) };
}

export async function reorderPlaylistItems(
  userId: string,
  playlistId: string,
  lessonIds: unknown,
): Promise<PlaylistDetailResponse> {
  const playlist = await requirePlaylist(playlistId);
  requireOwner(playlist, userId);

  if (!Array.isArray(lessonIds) || lessonIds.some((id) => typeof id !== "string")) {
    badRequest("lessonIds must be a list of lesson ids.");
  }
  const current = await playlistRepo.listItems(playlistId);
  const currentIds = new Set(current.map((i) => i.lesson.id));
  const nextIds = lessonIds as string[];
  if (nextIds.length !== currentIds.size || nextIds.some((id) => !currentIds.has(id))) {
    badRequest("lessonIds must match the playlist's current items exactly.");
  }

  await playlistRepo.reorderItems(playlistId, nextIds);
  return { playlist, items: await itemsFor(playlistId) };
}
