import { ErrorCodes } from "@/shared";
import { schoolRepo, questEventRepo } from "@/server/repositories";
import { handleError, jsonOk, requireUserId } from "@/server/http";
import { serviceError } from "@/server/service-error";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/school/lessons/:id/watch — the signed-in player watched a
 * video lesson (reported by the player once playback crosses the watched
 * threshold; see VideoPlayer.tsx). Records this user's "watch a video" quest
 * signal, which gates mission completion.
 */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const { id } = await ctx.params;
    const lesson = await schoolRepo.getLesson(id);
    if (!lesson || lesson.type !== "video") {
      throw serviceError(ErrorCodes.VALIDATION, "Not a video lesson.", 400);
    }
    questEventRepo.record(userId, "watch_video");
    return jsonOk({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
