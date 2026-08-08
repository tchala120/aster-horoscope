import type { PlaylistDetailResponse } from "@/shared";
import { removePlaylistItem } from "@/server/services/playlist-service";
import { handleError, jsonOk, requireUserId } from "@/server/http";

export const dynamic = "force-dynamic";

/** DELETE /api/v1/school/playlists/:id/items/:lessonId — remove a video from the playlist (owner only). */
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string; lessonId: string }> },
) {
  try {
    const userId = await requireUserId();
    const { id, lessonId } = await ctx.params;
    return jsonOk<PlaylistDetailResponse>(await removePlaylistItem(userId, id, lessonId));
  } catch (e) {
    return handleError(e);
  }
}
