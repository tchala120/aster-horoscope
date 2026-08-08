import type { PlaylistDetailResponse, PlaylistInput, PlaylistResponse } from "@/shared";
import { ErrorCodes } from "@/shared";
import { deletePlaylist, getPlaylist, updatePlaylist } from "@/server/services/playlist-service";
import { handleError, jsonOk, requireUserId } from "@/server/http";
import { serviceError } from "@/server/service-error";

export const dynamic = "force-dynamic";

/** GET /api/v1/school/playlists/:id — public detail with ordered items. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    return jsonOk<PlaylistDetailResponse>(await getPlaylist(id));
  } catch (e) {
    return handleError(e);
  }
}

/** PUT /api/v1/school/playlists/:id — update own playlist's title/description. */
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => null)) as PlaylistInput | null;
    if (!body) throw serviceError(ErrorCodes.VALIDATION, "Invalid request body.", 400);
    return jsonOk<PlaylistResponse>(await updatePlaylist(userId, id, body));
  } catch (e) {
    return handleError(e);
  }
}

/** DELETE /api/v1/school/playlists/:id — delete own playlist. */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const { id } = await ctx.params;
    await deletePlaylist(userId, id);
    return jsonOk({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
