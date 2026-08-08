import type {
  AddPlaylistItemRequest,
  PlaylistDetailResponse,
  ReorderPlaylistItemsRequest,
} from "@/shared";
import { ErrorCodes } from "@/shared";
import { addPlaylistItem, reorderPlaylistItems } from "@/server/services/playlist-service";
import { handleError, jsonOk, requireUserId } from "@/server/http";
import { serviceError } from "@/server/service-error";

export const dynamic = "force-dynamic";

/** POST /api/v1/school/playlists/:id/items — append a video lesson to the playlist (owner only). */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => null)) as AddPlaylistItemRequest | null;
    if (!body?.lessonId) throw serviceError(ErrorCodes.VALIDATION, "lessonId is required.", 400);
    return jsonOk<PlaylistDetailResponse>(await addPlaylistItem(userId, id, body.lessonId));
  } catch (e) {
    return handleError(e);
  }
}

/** PUT /api/v1/school/playlists/:id/items — reorder to the given full lesson id order (owner only). */
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => null)) as ReorderPlaylistItemsRequest | null;
    if (!body) throw serviceError(ErrorCodes.VALIDATION, "Invalid request body.", 400);
    return jsonOk<PlaylistDetailResponse>(await reorderPlaylistItems(userId, id, body.lessonIds));
  } catch (e) {
    return handleError(e);
  }
}
