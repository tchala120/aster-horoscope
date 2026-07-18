import type { ReactionsResponse, ToggleReactionRequest } from "@/shared";
import { ErrorCodes } from "@/shared";
import { getReactions, toggleReaction } from "@/server/services/school-service";
import { currentUserId, handleError, jsonOk, requireUserId } from "@/server/http";
import { serviceError } from "@/server/service-error";

export const dynamic = "force-dynamic";

/** GET /api/v1/school/lessons/:id/reactions — counts + viewer's own (public). */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const userId = await currentUserId();
    return jsonOk<ReactionsResponse>(await getReactions(id, userId));
  } catch (e) {
    return handleError(e);
  }
}

/** POST /api/v1/school/lessons/:id/reactions — toggle a like/bookmark (auth). */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => null)) as ToggleReactionRequest | null;
    if (!body?.type) throw serviceError(ErrorCodes.VALIDATION, "A reaction type is required.", 400);
    return jsonOk<ReactionsResponse>(await toggleReaction(userId, id, body.type));
  } catch (e) {
    return handleError(e);
  }
}
