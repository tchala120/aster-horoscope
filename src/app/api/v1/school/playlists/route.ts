import type { PlaylistInput, PlaylistResponse, PlaylistsResponse } from "@/shared";
import { ErrorCodes } from "@/shared";
import { createPlaylist, listPlaylists } from "@/server/services/playlist-service";
import { resolveAuthorName } from "@/server/services/school-service";
import { currentUserId, handleError, jsonOk, requireUserId } from "@/server/http";
import { serviceError } from "@/server/service-error";

export const dynamic = "force-dynamic";

/** GET /api/v1/school/playlists — public, paginated. `?mine=1` restricts to the signed-in user's own playlists. */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    let authorId: string | undefined;
    if (url.searchParams.get("mine") === "1") {
      authorId = (await currentUserId()) ?? undefined;
      if (!authorId) throw serviceError(ErrorCodes.AUTH_UNAUTHENTICATED, "Not authenticated.", 401);
    }
    const res = await listPlaylists({
      page: Number(url.searchParams.get("page")) || 1,
      limit: Number(url.searchParams.get("limit")) || undefined,
      authorId,
    });
    return jsonOk<PlaylistsResponse>(res);
  } catch (e) {
    return handleError(e);
  }
}

/** POST /api/v1/school/playlists — create a playlist owned by the signed-in user. */
export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const name = await resolveAuthorName(userId);
    const body = (await req.json().catch(() => null)) as PlaylistInput | null;
    if (!body) throw serviceError(ErrorCodes.VALIDATION, "Invalid request body.", 400);
    const res = await createPlaylist(userId, name, body);
    return jsonOk<PlaylistResponse>(res, 201);
  } catch (e) {
    return handleError(e);
  }
}
